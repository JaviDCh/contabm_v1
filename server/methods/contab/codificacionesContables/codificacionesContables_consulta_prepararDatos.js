
import lodash from 'lodash';
import numeral from 'numeral';
import moment from 'moment';
import { Monedas } from '/imports/collections/monedas';

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

Meteor.methods(
{
    codificacionesContables_consulta_prepararDatos: function (filtro, ciaContabSeleccionada) {
        // debugger;
        // TODO: revisar tema del date offset ...
        // (recordar aquí que debemos tener el offset en un espacio 'global', para que, al cambiar, solo tengamos que cambiar allí ...)

        check(filtro, Object);
        check(filtro.codificacionSeleccionada, Object);
        check(ciaContabSeleccionada, Object);

        let codificacionContable = filtro.codificacionSeleccionada;

        // -------------------------------------------------------------------------------------------------------------
        // eliminamos todos los movimientos que corresponden a la codificación
        CodificacionesContables_movimientos.remove(
            {
                codificacionContable_ID: codificacionContable._id,
                user: this.userId,
            });

        // -------------------------------------------------------------------------------------------------------------
        // siempre 1er. día de la fecha inicial
        let ultimoDiaMesAnterior_InicioConsulta = new Date(filtro.periodo.desde.getFullYear(), filtro.periodo.desde.getMonth(), 1);

        // ahora restamos 1 día y obtenemos el último día del mes anterior ...
        // la idea es que podamos leer los saldos para el mes *anterior* a la fecha inicial del período indicado.
        // Además, esta fecha (día final del mes anterior al período) será usada como fecha de los saldos iniciales
        // para el proceso de consulta (más en la 'descripción' que otra cosa!)...
        ultimoDiaMesAnterior_InicioConsulta = moment(ultimoDiaMesAnterior_InicioConsulta).subtract(1, 'days').toDate();

        // con esta función determinamos el mes y año  fiscal para la fecha de inicio de la consulta
        let mesAnoFiscal = ContabFunctions.determinarMesFiscal(filtro.periodo.desde, ciaContabSeleccionada.numero);

        if (mesAnoFiscal.error) { 
            throw new Meteor.Error("error-determinar-mes-fiscal", mesAnoFiscal.errorMessage);
        }
            
        // determinamos el mes de saldos a leer, en base al mes y año fiscal indicado
        let mesFiscalAnterior = "";

        // esta función regresa el nombre de la columna en la tabla de saldos que corresponde al mes fiscal; por ejemplo:
        // si el mes fiscal es 5 - nombreMesFiscal = Mes05; nombreMesFiscalAnterior = mes04.
        let nombreMesFiscal = ContabFunctions.nombreMesFiscalTablaSaldos(mesAnoFiscal.mesFiscal);


        if (nombreMesFiscal.error) { 
            throw new Meteor.Error("error-determinar-nombre-mes-fiscal", nombreMesFiscal.errorMessage);
        }
            
        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = CodificacionesContables_codigos.
                                find({ codificacionContable_ID: codificacionContable._id, detalle: { $eq: true }, suspendido: { $ne: true } }).
                                count();

        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcesses = 1;
        let currentProcess = 1;

        EventDDP.matchEmit('contab_codificacionesContables_prepararDatos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'codificacionContable_prepararDatos' },
                            { current: currentProcess, max: numberOfProcesses, progress: '0 %',
                              message: 'Leyendo y actualizando saldos y movimientos para la codificación selecciondada ...'
                            });
        // -------------------------------------------------------------------------------------------------------------

        let cantidadCodigosContables = 0;
        let cantidadCuentasContables = 0;
        let query = '';

        let monedasArray = Monedas.find().fetch();

        // leemos cada código para la codificación contable
        CodificacionesContables_codigos.find(
                            {
                                codificacionContable_ID: codificacionContable._id,
                                detalle: { $eq: true },
                                suspendido: { $ne: true },
                            }).forEach((codigo) => {
            // leemos cada cuenta contable, para el código
            CodificacionesContables_codigos_cuentasContables.find(
                                        {
                                            codificacionContable_ID: codificacionContable._id,
                                            codigoContable_ID: codigo._id,
                                        }).
                                     forEach((cuenta) => {

                let movimiento = {};

                // leemos la cuenta contable pues debemos registrar su código y nombre en cada movimiento
                response = Async.runSync(function(done) {
                    CuentasContables_sql.findAll({ where: { id: cuenta.id },
                      attributes: ['cuenta', 'descripcion'],
                      raw: true,
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                let cuentaContable = response.result[0];

                // primero leemos y agregamos los saldos para cada cuenta
                // 'selector' contiene un posible filtro del usuario por moneda y moneda original; además,
                // user y cuentaID

                // selector.cuentaID = cuenta.id;

                // leemos los saldos que corresponden a la cuenta contable
                // preparamos el query para leer los saldos de las cuentas contables, para el *anterior* al mes de la consulta
                query = `Select ${nombreMesFiscal.nombreMesFiscalAnterior} As saldoInicial,
                        s.CuentaContableID,
                        s.Moneda as moneda, s.MonedaOriginal as monedaOriginal,
                        s.Cia as cia
                        From SaldosContables s
                        Where s.Ano = ${mesAnoFiscal.anoFiscal} And
                        s.CuentaContableID = ${cuenta.id}`;


                if (Array.isArray(filtro.moneda) && filtro.moneda.length) {
                    query += ` And s.Moneda = ${filtro.moneda[0].toString()}`;
                }

                if (Array.isArray(filtro.monedaOriginal) && filtro.monedaOriginal.length) {
                    query += ` And s.MonedaOriginal = ${filtro.monedaOriginal[0].toString()}`;
                }


                response = Async.runSync(function(done) {
                    sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
                    
                // guardamos el array de saldos; el usuario puede indicar que desea excluir cuentas sin saldos
                // ni movimientos; de esta forma, evaluamos más adelante ...
                let saldosArray = response.result;

                // --------------------------------------------------------------------------------
                // leemos los asientos para la cuenta contable
                query = `Select a.NumeroAutomatico as numeroAutomatico, a.Numero as numero,
                        a.Moneda as moneda, a.MonedaOriginal as monedaOriginal,
                        a.Fecha as fecha, a.Cia as cia,
                        d.CuentaContableID as cuentaContableID, d.Descripcion as descripcion,
                        d.Referencia as referencia, d.Debe as debe, d.Haber as haber
                        From Asientos a
                        Inner Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico
                        Where a.Fecha Between
                        '${moment(filtro.periodo.desde).format('YYYY-MM-DD')}' And
                        '${moment(filtro.periodo.hasta).format('YYYY-MM-DD')}' And
                        d.CuentaContableID = ${cuenta.id}`;

                if (Array.isArray(filtro.moneda) && filtro.moneda.length) {
                    query += ` And a.Moneda = ${filtro.moneda[0].toString()}`;
                }

                if (Array.isArray(filtro.monedaOriginal) && filtro.monedaOriginal.length) {
                    query += ` And a.MonedaOriginal = ${filtro.monedaOriginal[0].toString()}`;
                }


                response = Async.runSync(function(done) {
                    sequelize.query(query, { type: sequelize.QueryTypes.SELECT})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
                    
                // -------------------------------------------------------------------------------
                // primero imprimimos los saldos; la idea es no hacerlo si el usuario quiere
                // excluir cuentas sin saldos ni movimientos
                let noMostrarSaldoEnCero = filtro.excluir_sinSaldosNiMovimientosEnElPeriodo &&
                                           response.result.length == 0;

                saldosArray.forEach((x) => {
                    if (!(noMostrarSaldoEnCero && x.saldoInicial == 0)) {
                        // agregamos cada saldo como un movimiento (inicial) al collection de movimientos
                        movimiento = {
                            _id: new Mongo.ObjectID()._str,
                            codificacionContable_ID: codificacionContable._id,
                            simboloMoneda: lodash.find(monedasArray, (m) => { return m.moneda === x.moneda; }).simbolo,
                            codigoContable: codigo.codigo,
                            nombreCodigoContable: codigo.descripcion,
                            cuentaContable: cuentaContable ? cuentaContable.cuenta : 'Indefinido',
                            nombreCuentaContable: cuentaContable ? cuentaContable.descripcion : 'Indefinido',
                            fecha: ultimoDiaMesAnterior_InicioConsulta,
                            simboloMonedaOriginal: lodash.find(monedasArray, (m) => { return m.moneda === x.monedaOriginal; }).simbolo,
                            comprobante: "",
                            descripcion: `Saldo inicial - ${moment(ultimoDiaMesAnterior_InicioConsulta).format("DD-MM-YYYY")}`,
                            referencia: "",
                            saldoInicial: x.saldoInicial,
                            debe: 0,
                            haber: 0,
                            saldo: x.saldoInicial,
                            cia: x.cia,
                            user: this.userId,
                        };
                        CodificacionesContables_movimientos.insert(movimiento);
                    }
                })

                // ahora agregamos los movimientos; es normal que una cuenta no tenga movimientos en el
                // período indicado; el usuario puede indicar que quiere excluir cuentas sin saldos ni
                // movimientos ...
                response.result.forEach((x) => {
                    // agregamos cada asiento como un movimiento al collection de movimientos
                    movimiento = {
                        _id: new Mongo.ObjectID()._str,
                        codificacionContable_ID: codificacionContable._id,
                        simboloMoneda: lodash.find(monedasArray, (m) => { return m.moneda === x.moneda; }).simbolo,
                        codigoContable: codigo.codigo,
                        nombreCodigoContable: codigo.descripcion,
                        cuentaContable: cuentaContable ? cuentaContable.cuenta : 'Indefinido',
                        nombreCuentaContable: cuentaContable ? cuentaContable.descripcion : 'Indefinido',
                        fecha: x.fecha,
                        simboloMonedaOriginal: lodash.find(monedasArray, (m) => { return m.moneda === x.monedaOriginal; }).simbolo,
                        comprobante: x.numero,
                        descripcion: x.descripcion,
                        referencia: x.referencia,
                        saldoInicial: 0,
                        debe: x.debe,
                        haber: x.haber,
                        saldo: x.debe - x.haber,
                        cia: x.cia,
                        user: this.userId,
                    };
                    CodificacionesContables_movimientos.insert(movimiento);
                })

                cantidadCuentasContables++;
            })

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_codificacionesContables_prepararDatos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'codificacionContable_prepararDatos' },
                                    { current: currentProcess, max: numberOfProcesses, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: 'Leyendo y actualizando saldos y movimientos para la codificación selecciondada ...'
                                    });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_codificacionesContables_prepararDatos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'codificacionContable_prepararDatos' },
                                        { current: currentProcess, max: numberOfProcesses, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                          message: 'Leyendo y actualizando saldos y movimientos para la codificación selecciondada ...'
                                        });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------

            cantidadCodigosContables++;
        })

        return `Ok, los datos han sido actualizados en la base de datos.<br /><br />
                En total, se han leído movimientos para
                <b>${cantidadCuentasContables.toString()}</b> cuentas contables desde <em>Contab</em>, que corresponden a
                <b>${cantidadCodigosContables.toString()}</b> códigos contables en la codificación contable seleccionada.`;
    }
})
