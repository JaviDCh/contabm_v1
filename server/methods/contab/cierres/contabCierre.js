
import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    contabCierre: function (mesesArray, anoFiscal, ciaContab) {

        Match.test(mesesArray, Match.Array);
        Match.test(anoFiscal, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // debemos leer la tabla de parámetros para determinar si el cierre puede ser ejecutado aún con asientos descuadrados ...
        query = `Select Top 1 CierreContabPermitirAsientosDescuadrados From ParametrosContab Where Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ ciaContab.numero ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result.length == 0) {
            errMessage = `Error: No hemos encontrado un registro en la tabla de <em>parámetros contab</em> para la
                         compañía Contab seleccionada.`;

            return { error: true, errMessage: errMessage };
        }

        let cierreContabPermitirAsientosDescuadrados = response.result[0].CierreContabPermitirAsientosDescuadrados;

        let mesesDelAnoFiscal = leerMesesDesdeTablaMesesDelAnoFiscal(mesesArray, ciaContab.numero);

        // para, en cierres de meses (ie: no cierre anual), notificar al usuario la existencia de asientos de tipo cierre anual ...
        let existenAsientosTipoCierreAnual = false;
        let mesesConAsientosDescuadrados = [];

        // nota: mesACerrar es un array que puede tener más de un mes a cerrar (ej: [ 01, 02, 03, 04, ...])
        // revisamos cada mes a cerrar, para saber si hay asientos descuadrados o asientos con montos con más de 2 decimales ...
        mesesArray.forEach((mesFiscal) => {

            // pasamos 12 cuando el mes fiscal es 13, pues debemos efectuar el cierre anual, pero el período calendario
            // es el mismo del mes 12 ...
            let periodoCalendario = ContabFunctions.construirPeriodoParaMesFiscal((mesFiscal === 13 ? 12 : mesFiscal),
                                                                                  anoFiscal,
                                                                                  ciaContab.numero);

            if (periodoCalendario.error) {
                throw new Meteor.Error(periodoCalendario.errMessage);
            }

            let primerDiaMes = periodoCalendario.desde;
            let ultimoDiaMes = periodoCalendario.hasta;
            let nombreMesCalendario = mesFiscal === 13 ? "anual" : periodoCalendario.nombreMes;

            // validamos que el mes a cerrar no contenga asientos descuadrados ...
            let asientosDescuadrados = ContabFunctions.verificarAsientosDescuadradosEnPeriodo(primerDiaMes,
                                                                                              ultimoDiaMes,
                                                                                              ciaContab);

            if (asientosDescuadrados.error) {
                if (cierreContabPermitirAsientosDescuadrados) {
                    // no fallamos pues se puede ejecutar el cierre con asientos descuadrados (según parametrosContab); la idea es,
                    // sin embargo, notificar cuales meses contienen asientos descuadrados ...
                    mesesConAsientosDescuadrados.push(nombreMesCalendario);
                } else {
                    throw new Meteor.Error("asientos-descuadrados",
                    `Existen asientos contables descuadrados en el mes <em><b>${nombreMesCalendario}</b></em>.
                     Por favor revise los asientos contables registrados para el mes mencionado y corrija
                     los que no estén cuadrados.<br /><br /> Luego regrese y ejecute nuevamente el cierre contable para este mes.`);
                }
            }

            // validamos que el mes a cerrar no contenga asientos con más de 2 decimales ...
            let verificarAsientosConMas2DecimalesEnPeriodo = ContabFunctions.verificarAsientosConMas2DecimalesEnPeriodo(primerDiaMes,
                                                                                                                        ultimoDiaMes,
                                                                                                                        ciaContab);

            if (verificarAsientosConMas2DecimalesEnPeriodo.error) {
                throw new Meteor.Error("asientos-conMas2Decimales",
                `Existen asientos contables con montos con <b>más de dos decimales</b> en el mes
                 <em><b>${nombreMesCalendario}</b></em>.
                 Por favor revise los asientos contables registrados para el mes mencionado y corrija esta situación.<br /><br />
                 Para corregir estos asientos, Ud. debe seleccionarlos en el <em>registro de asientos contables</em>, usando la
                 opción específica que existe para ello en el filtro. Luego: 1) abrir cada uno; 2) seleccionar una partida en la
                 lista y 3) hacer un <em>click</em> en el <em>link cuadrar asiento</em>.<br /><br />
                 Solo entonces debe regresar y continuar con el cierre contable del mes <em><b>${nombreMesCalendario}</b></em>.
                 `);
            }

            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            let numberOfItems = 1;
            let reportarCada = Math.floor(numberOfItems / 25);
            let reportar = 0;
            let cantidadRecs = 0;
            let numberOfProcess = 5;
            let currentProcess = 0;

            // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
            let eventName = "contab_cierreContab_reportProgress";
            let eventSelector = { myuserId: this.userId, app: 'contab', process: 'cierreContab' };
            let eventData = {
                              current: currentProcess, max: numberOfProcess, progress: '0 %',
                              message: `Cerrando el mes <b><em>${nombreMesCalendario}</em></b> ... `
                            };

            // sync call
            let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            // -------------------------------------------------------------------------------------------------------------




            // -------------------------------------------------------------------------------------------------------------
            // paso # 1: agregamos en SaldosContables aquellas cuentas que tengan asientos contables, pero no un registro
            // en SaldosContables (por CuentaContableID, moneda, monedaOriginal, cia y añoFiscal)
            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 1;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - agregando saldos que no existen `
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            agregarRegistrosNoEnSaldosSiEnAsientos(primerDiaMes, ultimoDiaMes, anoFiscal, ciaContab);
            // -------------------------------------------------------------------------------------------------------------
            // paso # 2) update en SaldosContables para poner el saldo del mes tal como el saldo del mes anterior
            // -------------------------------------------------------------------------------------------------------------
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 2;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '20 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - inicializando saldos `
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            inicializarSaldoActualConSaldoAnterior(mesFiscal, anoFiscal, ciaContab);
            // -------------------------------------------------------------------------------------------------------------






            // -------------------------------------------------------------------------------------------------------------
            // paso # 3) leemos los asientos contables del mes para actualizar los saldos
            // -------------------------------------------------------------------------------------------------------------
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 3;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '40 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - actualizando los saldos (con movimientos del mes) `
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            // intentamos determinar la existencia de asientos del tipo cierre anual en cierre normal de meses;
            // la idea es notificar al usuario, de haberlos ... (aunque el cierre se ejecute en forma normal)

            // en el mes 12 normalmente habrá asientos del tipo anual

            if (!existenAsientosTipoCierreAnual && mesFiscal != 13 && mesFiscal != 12)
                existenAsientosTipoCierreAnual = determinarExistenciaAsientosTipoCierreAnual(primerDiaMes, ultimoDiaMes, ciaContab);

            actualizarSaldosContables(primerDiaMes, ultimoDiaMes, mesFiscal, anoFiscal, ciaContab);
            // -------------------------------------------------------------------------------------------------------------






            // -------------------------------------------------------------------------------------------------------------
            // paso # 4) presupuesto: actualizamos los saldos de cuentas de presupuesto (puede no haber presuputeso definido)
            // -------------------------------------------------------------------------------------------------------------
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 4;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '60 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - actualizando saldos de presupuesto `
                        };

            // sync call
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            cerrarCodigosPresupuesto(primerDiaMes, ultimoDiaMes, mesFiscal, anoFiscal, ciaContab);




            // ---------------------------------------------------------------------------------------------
            // paso # 5) actualizamos el ultimo mes cerrado ...
            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 5;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '80 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - actualizando el Ultimo Mes Cerrado `
                        };
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

            response = {};
            let filter = { cia: ciaContab.numero };

            let ultimoMesCerrado = {
                mes: mesFiscal,
                ano: anoFiscal,
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


            // -------------------------------------------------------------------------------------------------------------
            // valores para reportar el progreso
            numberOfItems = 1;
            reportarCada = Math.floor(numberOfItems / 25);
            reportar = 0;
            cantidadRecs = 0;
            currentProcess = 5;

            eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '100 %',
                          message: `<b><em>${nombreMesCalendario}</em></b> - listo!! `
                        };
            methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

        })

        // solo cuando se permite cerrar con asientos descuadrados, construimos un mensaje que informe al usuario la existencia de
        // éstos ...
        let finalMessage = "";
        let mensajeAsientosDescuadrados = "";

        if (mesesConAsientosDescuadrados.length) {
            mensajeAsientosDescuadrados = `<br /><b>Nota:</b> existen asientos descuadrados en los meses: <b>`;

            let c = 1;
            mesesConAsientosDescuadrados.forEach((x) => {
                if (c === 1) {
                    mensajeAsientosDescuadrados += x;
                } else {
                    mensajeAsientosDescuadrados += `, ${x}`;
                }
                c++;
            })

            mensajeAsientosDescuadrados += "</b>. ";
            mensajeAsientosDescuadrados += `Sin embargo, el cierre se ha ejecutado en forma normal, pues así se ha indicado en la tabla
                                            <em>Parámetros Contab.</em>`;
        }



        if (mesesArray.length == 1)
            if (mesesArray[0] != 13) {
                finalMessage = `Ok, el cierre en <em>Contab</em> del mes <b><em>${mesesDelAnoFiscal[0].nombreMes}</em></b>,
                                se ha ejecutado en forma satisfactoria.`;
            }
            else {
                finalMessage = `Ok, el cierre en <em>Contab</em> para el año fiscal <b><em>${anoFiscal.toString()}</em></b>,
                                se ha ejecutado en forma satisfactoria.`;
            }
        else
            finalMessage = `Ok, el cierre en <em>Contab</em> de los meses <b><em>${mesesDelAnoFiscal[0].nombreMes}</em></b> a
                            <b><em>${mesesDelAnoFiscal[mesesArray.length - 1].nombreMes}</em></b>,
                            se ha ejecutado en forma satisfactoria.`;

        if (existenAsientosTipoCierreAnual)
            if (mesesArray.length == 1)
                finalMessage += `<br /><br /><b>Nota:</b> existen asientos de tipo <em>cierre anual</em>, registrados en el período
                                que corresponde al período del mes que se ha cerrado. <br />
                                El proceso de cierre ha, sin embargo, sido ejecutado en forma normal; pero sin leer el (los) asiento
                                de este tipo que se ha encontrado.`;
            else
                finalMessage += `<br /><br /><b>Nota:</b> existen asientos de tipo <em>cierre anual</em>, registrados en, al menos,
                                uno de los meses que se han cerrado. <br />
                                El proceso de cierre ha, sin embargo, sido ejecutado en forma normal; pero sin leer el (los) asiento
                                de este tipo que se ha encontrado.`;


        finalMessage += mensajeAsientosDescuadrados;
        return finalMessage;
    }
});


function leerMesesDesdeTablaMesesDelAnoFiscal(mesesArray, cia) {

    // ahora leemos los registros que existen en la tabla MesesDelAnoFiscal; el contenido de esta tabla nos ayuda a
    // determinar si el año fiscal de la compañía es un año calendario normal, o empieza y termina en meses diferentes
    // al primero y último del año calendario

    // nótese como leemos solo los meses que se van a cerrar; puede ser 1 o varios ...

    // para el cierre del año (mes fiscal 13), leemos el último mes del año (los asientos son del mismo período)

    let mesesArrayFilter = _.clone(mesesArray);

    if (mesesArrayFilter.length == 1 && mesesArrayFilter[0] === 13)
        mesesArrayFilter.push(12);

    let response = {};
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll(
            {
                attributes: [ 'mesFiscal', 'mes', 'nombreMes' ],
                where: { mesFiscal: { $in: mesesArrayFilter }, cia: cia },
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

function mesTablaSaldos(mes) {
    // para determinar el nombre de la columna en la tabla Saldos, que corresponde al mes pasado ...
    let nombreColumnaTablaSaldos = "";

    switch(mes) {
        case 0:
            nombreColumnaTablaSaldos = "Inicial";
            break;
        case 1:
            nombreColumnaTablaSaldos = "Mes01";
            break;
        case 2:
            nombreColumnaTablaSaldos = "Mes02";
            break;
        case 3:
            nombreColumnaTablaSaldos = "Mes03";
            break;
        case 4:
            nombreColumnaTablaSaldos = "Mes04";
            break;
        case 5:
            nombreColumnaTablaSaldos = "Mes05";
            break;
        case 6:
            nombreColumnaTablaSaldos = "Mes06";
            break;
        case 7:
            nombreColumnaTablaSaldos = "Mes07";
            break;
        case 8:
            nombreColumnaTablaSaldos = "Mes08";
            break;
        case 9:
            nombreColumnaTablaSaldos = "Mes09";
            break;
        case 10:
            nombreColumnaTablaSaldos = "Mes10";
            break;
        case 11:
            nombreColumnaTablaSaldos = "Mes11";
            break;
        case 12:
            nombreColumnaTablaSaldos = "Mes12";
            break;
        case 13:
            nombreColumnaTablaSaldos = "Anual";
            break;
        default:
            nombreColumnaTablaSaldos = "Indefinido";
    };

    return nombreColumnaTablaSaldos;
};


function agregarRegistrosNoEnSaldosSiEnAsientos(primerDiaMes, ultimoDiaMes, anoFiscal, ciaContab) {

    // leemos los asientos del período; agregamos cualquier registro en la tabla de saldos que no exista allí,
    // pero tenga asientos en el período (mes)

    let query = `Select d.CuentaContableID as cuentaContableID, a.Moneda as moneda, a.MonedaOriginal as monedaOriginal
             From Asientos a Inner Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico
             Where a.Fecha Between ? And ? And a.Cia = ?
             Group By d.CuentaContableID, a.Moneda, a.MonedaOriginal`;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
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

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    response.result.forEach((asiento) => {
        // para cada registro leído desde asientos, intentamos leer un registro de saldos; lo agregamos si no existe
        query = `Select Count(*) as count
                 From SaldosContables
                 Where CuentaContableID = ? And Moneda = ? And MonedaOriginal = ? And Ano = ? And Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    asiento.cuentaContableID,
                    asiento.moneda,
                    asiento.monedaOriginal,
                    anoFiscal,
                    ciaContab.numero,
                ],
                type: sequelize.QueryTypes.SELECT
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result[0].count === 0) {
            // Ok, no encontramos un registro de saldos; lo agregamos ...
            response = {};
            response = Async.runSync(function(done) {
                SaldosContables_sql.create({
                    cuentaContableID: asiento.cuentaContableID,
                    ano: anoFiscal,
                    moneda: asiento.moneda,
                    monedaOriginal: asiento.monedaOriginal,
                    cia: ciaContab.numero,
                })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                // la cuenta puede existir en saldos, pero para *otra* compañía. Esto es un error de integridad referencial. 
                // Pero, para ayudar a corregir el problema, podemos indicar estos datos de la cuenta que existe: 
                // CuentaContableID, Cuenta, año, moneda, monedaOriginal y cia. 
                // Esto permitirá buscar el registro en la tabla de SaldosContables y, probablemente, eliminarla ... 

                // leemos la cuenta que existe, para mostrarla al usuario 
                query = `Select s.CuentaContableID as cuentaID, c.Cuenta as cuentaContable, s.Ano as ano, 
                        mon.Simbolo as simboloMoneda, monOrig.Simbolo as simboloMonedaOriginal, 
                        cias.NombreCorto as nombreCia 
                        From 
                        SaldosContables s Inner Join CuentasContables c on s.CuentaContableID = c.ID 
                        Inner Join Companias cias on cias.Numero = s.Cia 
                        Inner Join Monedas mon on mon.Moneda = s.Moneda 
                        Inner Join Monedas monOrig on monOrig.Moneda = s.MonedaOriginal 
                        Where CuentaContableID = ? and Ano = ? and s.Moneda = ? And s.MonedaOriginal = ?`;

                response = null;
                response = Async.runSync(function (done) {
                    sequelize.query(query, {
                        replacements: [
                            asiento.cuentaContableID,
                            anoFiscal,
                            asiento.moneda,
                            asiento.monedaOriginal,
                        ],
                        type: sequelize.QueryTypes.SELECT
                    })
                        .then(function (result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
                    

                if (response.result.length > 0) {
                    // Ok, la cuenta ya existía en saldos. Por alguna razón, existe para otra cia Contab. Informamos al usuario y 
                    // mostramos la cuenta para que intente resolver ... 
                    const cuentaQueExisteEnSaldos = response.result[0]; 

                    let errorMessage = `Se ha intentado agregar una cuenta contable a la tabla de saldos, pues existe en un asiento 
                    pero no en saldos.<br /> 
                    Sin embargo, la cuenta contable ya existe, pero para otra compañía contab.<br />
                    Por favor revise y determine por que existe esta situación; corríjala y vuelva a correr el cierre contable.<br /> 
                    Los datos de la cuenta contable que <b>ya existe</b> en saldos son los siguientes: 
                    cuenta-id: ${cuentaQueExisteEnSaldos.cuentaID} - cuenta: ${cuentaQueExisteEnSaldos.cuentaContable} -  
                    año: ${cuentaQueExisteEnSaldos.ano} - moneda: ${cuentaQueExisteEnSaldos.simboloMoneda} - 
                    moneda original: ${cuentaQueExisteEnSaldos.simboloMonedaOriginal} - cia contab: ${cuentaQueExisteEnSaldos.nombreCia}.
                    `; 

                    // para mejorar aún más el mensaje de error, buscamos un asiento en el cual exista la cuenta contable 
                    query = `Select a.Numero as numero From Asientos a Inner Join dAsientos d on a.NumeroAutomatico = d.NumeroAutomatico 
                             Where d.CuentaContableID = ? And a.Fecha Between ? And ? And a.Cia = ?
                             `;

                    response = null;
                    response = Async.runSync(function (done) {
                        sequelize.query(query, {
                            replacements: [
                                asiento.cuentaContableID,
                                moment(primerDiaMes).format('YYYY-MM-DD'),
                                moment(ultimoDiaMes).format('YYYY-MM-DD'),
                                ciaContab.numero,
                            ],
                            type: sequelize.QueryTypes.SELECT
                        })
                            .then(function (result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error) { 
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                    }

                    if (response.result.length > 0) {
                        let asientoContableConError = response.result[0]; 
                        errorMessage += `<br />Por ejemplo, revise el asiento contable número <b>${asientoContableConError.numero.toString()}</b>  
                                         en la compañía contab y el mes para el cual está ahora efectuando el cierre contable.`
                    }

                    throw new Meteor.Error("saldos-intentoAgregarCuentaQueNoExiste", errorMessage);
                }
            }    
        };
    });
};


function inicializarSaldoActualConSaldoAnterior(mesFiscal, anoFiscal, ciaContab) {

    // hacemos un update para asegurarnos que toodos los saldos del mes son iguales al saldo anterior
    // la idea es que, para saldos sin movimientos en el mes, el saldo actual sea, simplemente, el saldo anterior ...

    let nombreSaldoMesActual = mesTablaSaldos(mesFiscal);
    let nombreSaldoMesAnterior = mesTablaSaldos(mesFiscal - 1);

    // primero, y solo como precaución, ponemos los saldos anteriores en cero si son null (tal vez esto nunca ocurra) ...
    let query = `Update SaldosContables set ${nombreSaldoMesAnterior} = 0 Where ${nombreSaldoMesAnterior} Is Null And Ano = ? And Cia = ?`;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
            replacements: [
                anoFiscal,
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

    // ahora actualizamos el saldo actual para que sea igual al anterior ...

    query = `Update SaldosContables set ${nombreSaldoMesActual} = ${nombreSaldoMesAnterior} Where Ano = ? And Cia = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
            replacements: [
                anoFiscal,
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

    return;
};





function determinarExistenciaAsientosTipoCierreAnual(primerDiaMes, ultimoDiaMes, ciaContab) {
    let response = null;
    response = Async.runSync(function(done) {
        AsientosContables_sql.count({ where: {
            fecha: {
                $gte: moment(primerDiaMes).subtract(TimeOffset, 'hours').toDate(),  // sequeliza globaliza; revertimos
                $lte: moment(ultimoDiaMes).subtract(TimeOffset, 'hours').toDate(),  // sequeliza globaliza; revertimos
            },
            asientoTipoCierreAnualFlag: { $eq: true },
            cia: ciaContab.numero,
        }})
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result)
        return true;
    else
        return false;
};






function actualizarSaldosContables(primerDiaMes, ultimoDiaMes, mesFiscal, anoFiscal, ciaContab) {

    // leemos la sumatoria del monto de asientos para cada cuenta contable y actualizamos cada saldo ...
    // nótese como obviamos asientos del tipo cierre anual, pues estamos cerrando meses y no el año ...

    // al cerrar el año, debemos considerar asientos del tipo cierre anual ...

    let query = ``;


    if (mesFiscal === 13) {
        query = `Select d.CuentaContableID as cuentaContableID, a.Moneda as moneda, a.MonedaOriginal as monedaOriginal,
                 sum(d.debe - d.haber) As sumaMovimientosContables
                 From Asientos a Inner Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico
                 Where (a.AsientoTipoCierreAnualFlag = 1)
                 And a.Fecha Between ? And ? And a.Cia = ?
                 Group By d.CuentaContableID, a.Moneda, a.MonedaOriginal`;
    }
    else {
        query = `Select d.CuentaContableID as cuentaContableID, a.Moneda as moneda, a.MonedaOriginal as monedaOriginal,
                 sum(d.debe - d.haber) As sumaMovimientosContables
                 From Asientos a Inner Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico
                 Where (a.AsientoTipoCierreAnualFlag Is Null Or a.AsientoTipoCierreAnualFlag = 0)
                 And a.Fecha Between ? And ? And a.Cia = ?
                 Group By d.CuentaContableID, a.Moneda, a.MonedaOriginal`;
    };

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
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

    let nombreSaldoMesActual = mesTablaSaldos(mesFiscal);
    let nombreSaldoMesAnterior = mesTablaSaldos(mesFiscal - 1);


    response.result.forEach((asiento) => {

        // actualizamos el saldo contable que corresponde a la: cuenta contable, moneda, moneda original, año y cia ...
        query = `Update SaldosContables set ${nombreSaldoMesActual} = (${nombreSaldoMesAnterior} + ?)
                 Where CuentaContableID = ? And Moneda = ? And MonedaOriginal = ? And Ano = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    asiento.sumaMovimientosContables,
                    asiento.cuentaContableID,
                    asiento.moneda,
                    asiento.monedaOriginal,
                    anoFiscal,
                ],
                type: sequelize.QueryTypes.SELECT
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    });

    return;
};


function cerrarCodigosPresupuesto(primerDiaMes, ultimoDiaMes, mesFiscal, anoFiscal, ciaContab) {

    // debugger;
    // actualizamos el saldo del mes (ejecutado), en la tabla de montos de presuesto ...

    // ------------------------------------------------------------------------------------------------------------------
    // 1.- leemos los registros de montos del presupuesto, para la cia y el año del cierre

    let nombreSaldoMesActual = mesTablaSaldos(mesFiscal);
    nombreSaldoMesActual += '_Eje';

    if (mesFiscal === 13)
        nombreSaldoMesActual = "Mes12_Eje";

    let response = null;
    response = Async.runSync(function(done) {
        Presupuesto_Montos_sql.findAll({
            where: { ano: anoFiscal, ciaContab: ciaContab.numero, },
            attributes: [ 'codigoPresupuesto', 'moneda', nombreSaldoMesActual ],
            raw: true,
        })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


    response.result.forEach((presupuestoMonto) => {
        // ------------------------------------------------------------------------------------------------------------------
        // 2.- para cada código, moneda, leemos las cuentas contables asociadas, en Presupuesto_AsociacionCodigosCuentas_sql
        // y armamos el filtro necesario para leer los asientos (nota: tomar en cuenta la moneda al leer los asientos)
        response = null;
        response = Async.runSync(function(done) {
            Presupuesto_AsociacionCodigosCuentas_sql.findAll({
                where: { codigoPresupuesto: presupuestoMonto.codigoPresupuesto, ciaContab: ciaContab.numero, },
                attributes: [ 'cuentaContableID',  ],
                raw: true,
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let arrayCuentasContablesID = [-999];

        response.result.forEach((cuentaContableID) => {
            arrayCuentasContablesID.push(cuentaContableID.cuentaContableID);
        });


        // ------------------------------------------------------------------------------------------------------------------
        // 3.- leer la sumarización de asientos contables para el filtro que construímos arriba

        // NOTESE que no leemos asientos del tipo cierre anual para actualizar los saldos de cuentas de presupuesto
        // (ésto puede no estar del todo bien ...)

        // en realidad solo abviamos asientos automáticos (si leemos otros del tipo cierre anual que pueda haber agregado el usuario)

        let query = `Select sum(d.debe - d.haber) As sumaMovimientosContables, count(*) As countAsientos
                 From Asientos a Inner Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico
                 Where a.tipo <> 'AUTO' And
                 a.moneda = ? And d.cuentaContableID IN (?) And a.Fecha Between ? And ? And a.Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    presupuestoMonto.moneda,
                    arrayCuentasContablesID,
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

        let montoSumarizacionAsientosContables = response.result[0].sumaMovimientosContables ?
                                                 response.result[0].sumaMovimientosContables :
                                                 0;


        // ------------------------------------------------------------------------------------------------------------------
        // 4.- actualizar el saldo (ejecutado) del mes en el registro de montos de la cuenta de presupuesto
        query = `Update Presupuesto_Montos Set ${nombreSaldoMesActual} = ?
                 Where CodigoPresupuesto = ? And CiaContab = ? And Moneda = ? And Ano = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    montoSumarizacionAsientosContables,
                    presupuestoMonto.codigoPresupuesto,
                    ciaContab.numero,
                    presupuestoMonto.moneda,
                    anoFiscal,
                ],
                type: sequelize.QueryTypes.UPDATE
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    });

    return;
};
