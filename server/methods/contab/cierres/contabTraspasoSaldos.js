
import moment from 'moment';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    contabTraspasoSaldos: function (anoFiscal, ciaContab) {

        Match.test(anoFiscal, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 3;
        let currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "contab_cierreContab_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'contab', process: 'cierreContab' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `inicializando los saldos de cuentas contables del año (fiscal) próximo ... `
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // -------------------------------------------------------------------------------------------------------------
        // ponemos los saldos iniciales del año próximo en cero
        query = `Update SaldosContables Set Inicial = 0 Where Ano = ? And Cia = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                                      replacements: [ (anoFiscal + 1), ciaContab.numero ],
                                      type: sequelize.QueryTypes.UPDATE
                                  })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        // -------------------------------------------------------------------------------------------------------------

        // leemos los saldos de las cuentas contables, para el año fiscal en curso ...
        response = null;
        response = Async.runSync(function(done) {
                SaldosContables_sql.findAndCountAll({
                    attributes: [ 'cuentaContableID', 'moneda', 'monedaOriginal', 'anual', ],
                    where: { ano: anoFiscal, cia: ciaContab.numero },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = response.result.count;     // cantidad de saldos leídos arriba
        reportarCada = Math.floor(numberOfItems / 10);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `actualizando saldos de cuentas contables del próximo año fiscal ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        const anoFiscalProximo = anoFiscal + 1;

        response.result.rows.forEach((saldoAnoFiscalActual) => {

            // leemos el saldo para la misma cuenta y año próximo (cuentaBancaria, ano); si no existe uno, debemos agregarlo
            let saldoContableAnoFiscalProximo_count = leerSaldoCuentaContableAnoProximo(
                saldoAnoFiscalActual.cuentaContableID,
                anoFiscalProximo,
                saldoAnoFiscalActual.moneda,
                saldoAnoFiscalActual.monedaOriginal
            );


            // ahora no estamos seguros si podemos hacer upsert en sequelize para sql server (2012). Lo que hacemos arriba
            // contar la cantidad de saldos que existen para el próximo año fiscal, para agregar o actualizar en consecuencia
            // -------------------------------------------------------------------------------------------------------------

            response = null;

            if (saldoContableAnoFiscalProximo_count) {
                // Ok, el saldo existe para el año fiscal próximo; lo actualizamos ...
                response = Async.runSync(function(done) {
                    SaldosContables_sql.update(
                        {
                            inicial: saldoAnoFiscalActual.anual,
                        },
                        { where: {
                            cuentaContableID: saldoAnoFiscalActual.cuentaContableID,
                            ano: anoFiscalProximo,
                            moneda: saldoAnoFiscalActual.moneda,
                            monedaOriginal: saldoAnoFiscalActual.monedaOriginal,
                        }}
                    )
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });
            }
            else {
                // Ok, el saldo, para el año fiscal próximo, no existe ; lo agregamos ...
                response = Async.runSync(function(done) {
                    SaldosContables_sql.create(
                        {
                            cuentaContableID: saldoAnoFiscalActual.cuentaContableID,
                            ano: anoFiscalProximo,
                            moneda: saldoAnoFiscalActual.moneda,
                            monedaOriginal: saldoAnoFiscalActual.monedaOriginal,
                            inicial: saldoAnoFiscalActual.anual,
                            cia: ciaContab.numero,
                        })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });
            };

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            // -------------------------------------------------------------------------------------------------------------


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; cada cant recs / 10 registros .
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 30 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `actualizando saldos de cuentas contables ... `
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `actualizando saldos de cuentas contables ... `
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------

        });

        // ----------------------------------------------------------------------------------------------
        // actualizamos el último mes cerrado, al año próximo y mes 0

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `actualizando el último mes cerrado ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------



        // después del traspaso de saldos, el UMC debe quedar en 0 y para el próximo año fiscal
        response = {};
        let filter = { cia: ciaContab.numero };

        let ultimoMesCerrado = {
            mes: 0,
            ano: anoFiscalProximo,
            ultAct: new Date(),
            manAuto: "A",
            cia: ciaContab.numero,
            usuario: Meteor.user().emails[0].address,
        };

        // al actualizar (insert/update), sequelize grobaliza las fechas; revertimos ...
        ultimoMesCerrado.ultAct = moment(ultimoMesCerrado.ultAct).subtract(TimeOffset, 'h').toDate();

        response = Async.runSync(function(done) {
            UltimoMesCerradoContab_sql.update(ultimoMesCerrado, { where: filter })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        return `Ok, el traspaso de saldos en <em>Contab</em>, desde el año fiscal ${anoFiscal.toString()} al año fiscal
                ${(anoFiscal + 1).toString()}, ha sido ejecutado en forma exitosa.`;
    }
});


function leerSaldoCuentaContableAnoProximo(cuentaContableID, anoFiscalProximo, moneda, monedaOriginal) {

    // leemos el saldo para la cuenta bancaria, pero para el próximo año; si no existe, debemos agregarlo ...
    let response = null;
    response = Async.runSync(function(done) {
            SaldosContables_sql.count({
                where: {
                    cuentaContableID: cuentaContableID,
                    ano: anoFiscalProximo,
                    moneda: moneda,
                    monedaOriginal: monedaOriginal,
                },
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    return response.result;
};
