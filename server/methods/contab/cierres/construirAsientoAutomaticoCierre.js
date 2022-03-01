
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    construirAsientoAutomaticoCierre: function (anoFiscal, ciaContab) {
        Match.test(anoFiscal, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "contab_cierreContab_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'contab', process: 'cierreContab' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `Procesos genéricos iniciales`
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        let periodoCalendario = ContabFunctions.construirPeriodoParaMesFiscal(12, anoFiscal, ciaContab.numero);

        if (periodoCalendario.error)
            throw new Meteor.Error(periodoCalendario.errMessage);

        let primerDiaMes = periodoCalendario.desde;
        let ultimoDiaMes = periodoCalendario.hasta;

        // leemos la cuenta contable definida como GyP
        const cuentaContableGyP = determinarCuentaContableGyP(ciaContab);

        if (!cuentaContableGyP) {
            throw new Meteor.Error("error-leer-cuentaContableGyP",
                        `Hemos obtenido un error al intentar leer la cuenta contable de tipo GyP
                        para la compañía Contab seleccionada.`);
        }

        // determinamos las monedas y monedas original usadas en los asientos del período y las guardamos en un array
        const monedasEnAsientosArray = determinarMonedasUsadasEnAsientos(primerDiaMes, ultimoDiaMes, ciaContab);

        // determinamos el filtro para leer las cuentas de gastos e ingresos en asientos contables registrados en el período
        const filtroCuentasIngresosGastos = determinarFiltroCuentasIngresosGastos(ciaContab);

        // leemos el factor de cambio más reciente para usarlo en el asiento de cierre anual
        const factorCambio = ContabFunctions.leerCambioMonedaMasReciente(ultimoDiaMes);

        if (factorCambio.error) {
            throw new Meteor.Error("error-leer-factorCambio",
                        `Hemos obtenido un error al intentar leer el factor de cambio para la fecha más reciente a
                        ${moment(ultimoDiaMes).format('YYYY-MM-DD')}.`);
        }

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        numberOfProcess = monedasEnAsientosArray.length;
        currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `Determinando y grabando cada asiento`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        currentProcess = 0;

        // debemos agregar un asiento automático para cada combinación mon/monOrig
        monedasEnAsientosArray.forEach((moneda) => {

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `Determinando y grabando cada asiento`
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            let numeroContabAsientoAutomatico =
                determinarNumeroContabAsientoAutomatico(moneda, primerDiaMes, ultimoDiaMes, ciaContab);

            // leemos los saldos del mes 12, para cuentas
            // contables de tipo gastos/ingresos. Estos saldos deben ser, justamente, revertidos, para
            // que los saldos de estas cuentas, luego del cierre anual, queden en cero ...

             query = `Select s.CuentaContableID As cuentaContableID, c.Descripcion As nombreCuenta,
                      Mes12 As saldoMes12
                      From SaldosContables s Inner Join CuentasContables c On s.CuentaContableID = c.ID
                      Where ${filtroCuentasIngresosGastos} And s.Mes12 <> 0 And c.TotDet = 'D'
                      And s.Ano = ? And s.Moneda = ? And s.MonedaOriginal = ? And s.Cia = ?`;

            let response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, {
                                          replacements: [
                                              anoFiscal,
                                              moneda.moneda,
                                              moneda.monedaOriginal,
                                              ciaContab.numero
                                          ],
                                          type: sequelize.QueryTypes.SELECT
                                      })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            let saldosMes12CuentasGastosIng = [];

            response.result.forEach((saldoMes12) => {
                saldosMes12CuentasGastosIng.push({
                    cuentaContableID: saldoMes12.cuentaContableID,
                    saldoMes12: saldoMes12.saldoMes12,
                    nombreCuenta: saldoMes12.nombreCuenta,
                });
            });

            // ahora que tenemos el movimiento para cada cuenta nómina (egr/ing), agregamos el asiento. Recorremos el
            // array, para agregar una partida para cada cuenta y su correspondiente movimiento en la cuenta GyP ...

            // agregamos el asiento ...

            let asientoContable = {
                numero: numeroContabAsientoAutomatico,
                mes: ultimoDiaMes.getMonth() + 1,
                ano: ultimoDiaMes.getFullYear(),
                tipo: 'AUTO',                  // el tipo siempre es AUTO para este tipo de asientos
                fecha: ultimoDiaMes,
                descripcion: 'Asiento automático de cierre anual - generado por el sistema en forma automática.',
                moneda: moneda.moneda,
                monedaOriginal: moneda.monedaOriginal,
                convertirFlag: true,
                factorDeCambio: factorCambio.factorCambio,
                ingreso: moment(new Date()).subtract(TimeOffset, 'hours').toDate(),  // sequeliza globaliza; revertimos
                ultAct: moment(new Date()).subtract(TimeOffset, 'hours').toDate(),   // sequeliza globaliza; revertimos
                asientoTipoCierreAnualFlag: true,
                mesFiscal: 12,
                anoFiscal: anoFiscal,
                usuario: Meteor.user().emails[0].address,
                cia: ciaContab.numero
            };

            // TODO: vamos a buscar 'raw: true' en todo el proyect (install atom find-and-replace package); debe haber una
            // forma de que sequelize no regrese un instance cuando hacemos un create() ...
            response = null;
            response = Async.runSync(function(done) {
                AsientosContables_sql.create(asientoContable, { raw: true })    // para que sequelize no regrese un instance ...
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // asiento contable recién agregado a sql server
            let asientoContableAgregado = response.result.dataValues;



            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = saldosMes12CuentasGastosIng.length;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess++;

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `Agregando las partidas del asiento ...`
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------

            let partida = 0;

            saldosMes12CuentasGastosIng.forEach((saldoMes12) => {

                if (saldoMes12.saldoMes12 === 0)
                    return;         // continue with next item in forEach ...

                partida = partida + 10;

                // ------------------------------------------------------------------------------------------------
                // agregamos la partida que corresponde a la cuenta contable
                let partidaAsiento = {
                    numeroAutomatico: asientoContableAgregado.numeroAutomatico,
                    partida: partida,
                    cuentaContableID: saldoMes12.cuentaContableID,
                    descripcion: `GyP - ${saldoMes12.nombreCuenta}`,
                    referencia: `AsientoCierreAnual`,
                    debe: saldoMes12.saldoMes12 < 0 ? saldoMes12.saldoMes12 * -1 : 0,
                    haber: saldoMes12.saldoMes12 > 0 ? saldoMes12.saldoMes12 : 0,
                };

                response = null;
                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partidaAsiento, { raw: true })    // para que sequelize no regrese un instance ...
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                // ------------------------------------------------------------------------------------------------

                partida = partida + 10;

                // ------------------------------------------------------------------------------------------------
                // agregamos la partida que corresponde a la cuenta GyP
                partidaAsiento = {
                    numeroAutomatico: asientoContableAgregado.numeroAutomatico,
                    partida: partida,
                    cuentaContableID: cuentaContableGyP,
                    descripcion: `GyP - ${saldoMes12.nombreCuenta}`,
                    referencia: `AsientoCierreAnual`,
                    debe: saldoMes12.saldoMes12 > 0 ? saldoMes12.saldoMes12 : 0,
                    haber: saldoMes12.saldoMes12 < 0 ? saldoMes12.saldoMes12 * -1 : 0,
                };

                response = null;
                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partidaAsiento, { raw: true })    // para que sequelize no regrese un instance ...
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                // ------------------------------------------------------------------------------------------------



                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 25) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `Agregando las partidas del asiento ...`
                                };
                    methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = {
                                      current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `Agregando las partidas del asiento ...`
                                    };
                        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    };
                };
                // -------------------------------------------------------------------------------------------------------
            });
        });

        return `Ok, el (los) asiento automático de cierre anual ha sido construido y agregado a <em>Contab</em> en forma exitosa,
                para el año fiscal ${anoFiscal.toString()}.`;
    }
});

function leerMesesDesdeTablaMesesDelAnoFiscal(mesesArray, cia) {

    // ahora leemos los registros que existen en la tabla MesesDelAnoFiscal; el contenido de esta tabla nos ayuda a
    // determinar si el año fiscal de la compañía es un año calendario normal, o empieza y termina en meses diferentes
    // al primero y último del año calendario

    // nótese como leemos solo los meses que se van a cerrar; puede ser 1 o varios ...

    let response = {};
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll(
            {
                attributes: [ 'mesFiscal', 'mes', 'nombreMes' ],
                where: { mesFiscal: { $in: mesesArray }, cia: cia },
                order: [['mesFiscal', 'ASC']],
                raw: true
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.count === 0)
        throw new Meteor.Error("tabla-mesesAnoFiscal-vacia",
        "Por favor revise esta tabla para la compañía Contab seleccionada; debe contener registros.");

    return response.result.rows;
};


function determinarCuentaContableGyP(ciaContab) {

    let response = null;
    response = Async.runSync(function(done) {
            ParametrosContab_sql.findAll({ where: { cia: ciaContab.numero },
                attributes: [ 'cuentaGyP', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (!response.result.length)
        throw new Meteor.Error('cuenta-gyp-indefinida', 'No se ha registrado una cuenta contable GyP para la compañía Contab.');

    return response.result[0].cuentaGyP;
};


function determinarFiltroCuentasIngresosGastos(ciaContab) {

    let response = null;
    response = Async.runSync(function(done) {
            ParametrosContab_sql.findAll({ where: { cia: ciaContab.numero },
                attributes: [ 'ingresos1', 'ingresos2', 'egresos1', 'egresos2', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (!response.result.length)
        throw new Meteor.Error('cuentas-ingresos-egresos', 'No se han registrado cuales son estas cuentas contables para para la compañía Contab.');

    let filtroCuentasIngresosEgresos = "";

    if (response.result.length && response.result[0].ingresos1) {
        let response2 = null;
        response2 = Async.runSync(function(done) {
            CuentasContables_sql.findAll({ where: { id: response.result[0].ingresos1 },
                attributes: [ 'cuenta', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
        });

        if (response2.error)
            throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());

        if (response2.result.length)
            filtroCuentasIngresosEgresos = `c.cuenta Like '${response2.result[0].cuenta}%'`;
    };

    if (response.result.length && response.result[0].ingresos2) {
        let response2 = null;
        response2 = Async.runSync(function(done) {
            CuentasContables_sql.findAll({ where: { id: response.result[0].ingresos2 },
                attributes: [ 'cuenta', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
        });

        if (response2.error)
            throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());

        if (response2.result.length)
            if (!filtroCuentasIngresosEgresos)
                filtroCuentasIngresosEgresos = `c.cuenta Like '${response2.result[0].cuenta}%'`;
            else
                filtroCuentasIngresosEgresos += ` Or c.cuenta Like '${response2.result[0].cuenta}%'`;
    };

    if (response.result.length && response.result[0].egresos1) {
        let response2 = null;
        response2 = Async.runSync(function(done) {
            CuentasContables_sql.findAll({ where: { id: response.result[0].egresos1 },
                attributes: [ 'cuenta', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
        });

        if (response2.error)
            throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());

        if (response2.result.length)
            if (!filtroCuentasIngresosEgresos)
                filtroCuentasIngresosEgresos = `c.cuenta Like '${response2.result[0].cuenta}%'`;
            else
                filtroCuentasIngresosEgresos += ` Or c.cuenta Like '${response2.result[0].cuenta}%'`;
    };

    if (response.result.length && response.result[0].egresos2) {
        let response2 = null;
        response2 = Async.runSync(function(done) {
            CuentasContables_sql.findAll({ where: { id: response.result[0].egresos2 },
                attributes: [ 'cuenta', ],
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
        });

        if (response2.error)
            throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());

        if (response.result.length && response2.result[0])
            if (!filtroCuentasIngresosEgresos)
                filtroCuentasIngresosEgresos = `c.cuenta Like '${response2.result[0].cuenta}%'`;
            else
                filtroCuentasIngresosEgresos += ` Or c.cuenta Like '${response2.result[0].cuenta}%'`;
    };

    return `(${filtroCuentasIngresosEgresos})`;
};


function determinarMonedasUsadasEnAsientos(primerDiaMes, ultimoDiaMes, ciaContab) {

    // leemos los asientos del período (siempre mes 12) y determinamos las combinaciones: Moneda/Moneda original

    let query = `Select Moneda As moneda, MonedaOriginal As monedaOriginal
                 From Asientos
                 Where Fecha Between ? And ? And Cia = ?
                 Group By Moneda, MonedaOriginal`;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                 replacements: [
                     moment(primerDiaMes).format('YYYY-MM-DD'),
                     moment(ultimoDiaMes).format('YYYY-MM-DD'),
                     ciaContab.numero,
                 ],
                 type: sequelize.QueryTypes.SELECT
             })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let monedasEnAsientosArray = [];

    response.result.forEach((item) => {
        monedasEnAsientosArray.push({ moneda: item.moneda, monedaOriginal: item.monedaOriginal });
    });

    return monedasEnAsientosArray;
};

function determinarNumeroContabAsientoAutomatico(moneda, primerDiaMes, ultimoDiaMes, ciaContab) {

    // leemos un asiento automático que ya exista; si existe, tomamos su número y lo eliminamos;
    // si no existe, determinamos un número de asientos Contab ...

    let response = null;
    response = Async.runSync(function(done) {
        AsientosContables_sql.findAll({
            where: {
                tipo: 'AUTO',
                asientoTipoCierreAnualFlag: { $eq: true },
                moneda: moneda.moneda,
                monedaOriginal: moneda.monedaOriginal,
                fecha: {
                    $gte: moment(primerDiaMes).subtract(TimeOffset, 'hours').toDate(),  // sequeliza globaliza; revertimos
                    $lte: moment(ultimoDiaMes).subtract(TimeOffset, 'hours').toDate(),  // sequeliza globaliza; revertimos
                },
                cia: ciaContab.numero,
            },
            attributes: [ 'numeroAutomatico', 'numero' ],
            raw: true,
        })
        .then(function(result) { done(null, result); })
        .catch(function (err) { done(err, null); })
        .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let numeroAsiento = null;

    if (response.result.length) {
        // el asiento automático ya existe; tomamos su número y lo eliminamos
        numeroAsiento = response.result[0].numero;

        let response2 = Async.runSync(function(done) {
            AsientosContables_sql.destroy({
                where: {
                    numeroAutomatico: response.result[0].numeroAutomatico,
                },
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
        });

        if (response2.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
    else {
        // el asiento automático no existe; determinamos un número de asiento Contab ...

        // TODO: (very important!!!) debemos revisar y cambiar esta función, para que permita determinar un número
        // de asiento para el mes 12, cuando este está cerrado. En realidad, estamos agrgando asientos de cierre y el
        // mes 12 debe estar cerrado, más no el mes 13 ...

        let asientoTipoCierreAnualFlag = true;

        // al pasar true como último parámetro, esta función permite registrar asientos de tipo 'cierre anual'
        // cuando el ultimo mes cerrado es 12 ...
        let numeroAsientoContab = ContabFunctions.determinarNumeroAsientoContab(ultimoDiaMes,
                                                                                'AUTO',
                                                                                ciaContab.numero,
                                                                                asientoTipoCierreAnualFlag);

        if (numeroAsientoContab.error) {
            throw new Meteor.Error("Error-asignar-numeroContab",
                                   `Error: ha ocurrido un error al intentar obtener un número de asiento Contab. <br />
                                   El mensaje específico del error es: <br />
                                   ${numeroAsientoContab.errMessage}`);

        };

        numeroAsiento = numeroAsientoContab.numeroAsientoContab;
    };

    return numeroAsiento;
};
