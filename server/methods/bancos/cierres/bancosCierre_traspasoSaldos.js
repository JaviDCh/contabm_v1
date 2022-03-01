


import { TimeOffset } from '/globals/globals'; 
import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    bancosCierre_traspasoSaldos: function (ano, ciaContab) {
        // debugger;

        // traspasamos los saldos finales del año al año próximo ...

        Match.test(ano, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 4;
        let currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "bancos_cierreBancos_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'bancos', process: 'cierreBancos' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `inicializando los saldos de cuentas bancarias del año próximo ... `
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // -------------------------------------------------------------------------------------------------------------
        // ponemos los saldos iniciales del año próximo en cero
        query = `Update Saldos Set Inicial = 0 From Saldos s Inner Join CuentasBancarias c
                 On s.CuentaBancaria = c.CuentaInterna
                 Where s.Ano = ? And c.Cia = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                                      replacements: [ (ano + 1), ciaContab.numero ],
                                      type: sequelize.QueryTypes.UPDATE
                                  })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        // -------------------------------------------------------------------------------------------------------------



        // leemos los saldos de las cuentas de bancos ...
        response = null;
        response = Async.runSync(function(done) {
                Saldos_sql.findAndCountAll({
                    where: { ano: ano },
                    include: [
                     {
                         model: CuentasBancarias_sql,
                         as: 'cuentaBancaria',
                         where: { cia: ciaContab.numero }}
                    ],
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
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `actualizando saldos de cuentas bancarias ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((saldoCuentaBancaria) => {

            // leemos el saldo para la misma cuenta y año próximo (cuentaBancaria, ano); si no existe uno, debemos agregarlo
            let saldoAnoProximo = leerSaldoCuentaBancariaAnoProximo(saldoCuentaBancaria, ano);


            // finalmente, actualizamos el saldo Inicial del año próximo con el Mes12 del año actual
            // -------------------------------------------------------------------------------------------------------------
            query = `Update Saldos Set Inicial = ? From Saldos s
                     Where s.ID = ?`;

            let response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, {
                                          replacements:
                                            [
                                                saldoCuentaBancaria.mes12,
                                                saldoAnoProximo.id
                                            ],
                                          type: sequelize.QueryTypes.UPDATE
                                      })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            // -------------------------------------------------------------------------------------------------------------


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `actualizando saldos de cuentas bancarias ... `
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `actualizando saldos de cuentas bancarias ... `
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------

        });

        // debugger;
        // TODO: saldosCompañías: hacer lo anterior, pero para saldos de compañías ...

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `inicializando los saldos (de compañías) del año próximo ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // -------------------------------------------------------------------------------------------------------------
        // ponemos los saldos iniciales del año próximo en cero
        query = `Update SaldosCompanias Set Inicial = 0 From SaldosCompanias s Where s.Ano = ? And s.Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                                      replacements: [ (ano + 1), ciaContab.numero ],
                                      type: sequelize.QueryTypes.UPDATE
                                  })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        // -------------------------------------------------------------------------------------------------------------



        // leemos los saldos de las compañías
        response = null;
        response = Async.runSync(function(done) {
                SaldosCompanias_sql.findAndCountAll({
                    where: { ano: ano, cia: ciaContab.numero },
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
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;
        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `actualizando saldos de compañías ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((saldoCompania) => {

            // leemos el saldo para la misma cuenta y año próximo (cuentaBancaria, ano); si no existe uno, debemos agregarlo
            let saldoAnoProximo = leerSaldoCompaniaAnoProximo(saldoCompania, ano);


            // finalmente, actualizamos el saldo Inicial del año próximo con el Mes12 del año actual
            // -------------------------------------------------------------------------------------------------------------
            query = `Update SaldosCompanias Set Inicial = ? From SaldosCompanias s
                     Where s.compania = ? And s.moneda = ? And s.Ano = ? And s.Cia = ?`;

            let response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, {
                                          replacements:
                                            [
                                                saldoCompania.mes12,
                                                saldoCompania.compania,
                                                saldoCompania.moneda,
                                                saldoCompania.ano,
                                                saldoCompania.cia,
                                            ],
                                          type: sequelize.QueryTypes.UPDATE
                                      })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            // -------------------------------------------------------------------------------------------------------------


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `actualizando saldos de compañías ... `
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `actualizando saldos de compañías ... `
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
        currentProcess = 4;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `actualizando el último mes cerrado ... `
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        response = {};
        let filter = { cia: ciaContab.numero };

        let ultimoMesCerrado = {
            mes: 0,
            ano: ano + 1,
            ultAct: new Date(),
            manAuto: "A",
            cia: ciaContab.numero,
            usuario: Meteor.user().emails[0].address,
        };

        // al actualizar (insert/update), sequelize grobaliza las fechas; revertimos ...
        ultimoMesCerrado.ultAct = moment(ultimoMesCerrado.ultAct).subtract(TimeOffset, 'h').toDate();

        response = Async.runSync(function(done) {
            UltimoMesCerrado_sql.update(ultimoMesCerrado, { where: filter })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        return `Ok, el traspaso de saldos, desde el año ${ano.toString()} al año ${(ano + 1).toString()},
                se ha ejecutado en forma satisfactoria.`;
    }
});

function leerSaldoCuentaBancariaAnoProximo(saldoCuentaBancaria, ano) {

    // leemos el saldo para la cuenta bancaria, pero para el próximo año; si no existe, debemos agregarlo ...
    let response = null;
    response = Async.runSync(function(done) {
            Saldos_sql.findAll({
                where: { ano: (ano + 1), cuentaBancaria: saldoCuentaBancaria.cuentaBancariaID },
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let saldoCuentaBancariaAnoProximo = response.result[0];

    if (!saldoCuentaBancariaAnoProximo) {
        // la cuenta no tiene un registro para el año próximo; lo agregamos ...

        response = Async.runSync(function(done) {
                Saldos_sql.create({
                    cuentaBancariaID: saldoCuentaBancaria.cuentaBancariaID,
                    ano: ano + 1,
                    inicial: 0 },
                    {raw: true}, )
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        saldoCuentaBancariaAnoProximo = response.result;
    };

    return saldoCuentaBancariaAnoProximo;
};


function leerSaldoCompaniaAnoProximo(saldoCompania, ano) {

    // leemos el saldo para la cuenta bancaria, pero para el próximo año; si no existe, debemos agregarlo ...
    let response = null;
    response = Async.runSync(function(done) {
            SaldosCompanias_sql.findAll({
                where:
                {
                    compania: saldoCompania.compania,
                    moneda: saldoCompania.moneda,
                    ano: (ano + 1),
                    cia: saldoCompania.cia,
                },
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let saldoCompaniaAnoProximo = response.result[0];

    if (!saldoCompaniaAnoProximo) {
        // la cuenta no tiene un registro para el año próximo; lo agregamos ...

        response = Async.runSync(function(done) {
                SaldosCompanias_sql.create({
                    compania: saldoCompania.compania,
                    moneda: saldoCompania.moneda,
                    ano: (ano + 1),
                    inicial: 0,
                    cia: saldoCompania.cia,
                },
                {raw: true}, )
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        saldoCompaniaAnoProximo = response.result;
    };

    return saldoCompaniaAnoProximo;
};
