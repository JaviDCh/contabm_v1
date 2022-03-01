
import moment from 'moment';
import numeral from 'numeral';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    importarAsientosContablesDesdeArchivoTexto: function (asientosArrayJson, mantenerNumerosAsientosContables, ciaContab) {

        new SimpleSchema({
            asientosArrayJson: { type: String, optional: false, },
            mantenerNumerosAsientosContables: { type: Boolean, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ asientosArrayJson, mantenerNumerosAsientosContables, ciaContab, });

        let asientosContablesArray = null;

        try {
            asientosContablesArray = JSON.parse(asientosArrayJson);
        } catch(e) {
            throw new Meteor.Error(`Error: Aparentemente, el archivo pasado a esta función no es correcto.<br />
                                    Recuerde que Ud. debe seleccionar un archivo que contenga asientos contables
                                    exportados con la función <em><b>Exportar</b></em> del menú <em><b>Copiar</b></em>
                                    que existe en esta página.
            `);
        }

        if (!_.isArray(asientosContablesArray) || !asientosContablesArray.length) {
            throw new Meteor.Error(`Error: no se han recibido asientos contables para importarlos a la base de datos.<br />
                                    Aparentemente, no se han pasado asientos contables a esta función.<br />
                                    Ud. debe seleccionar un archivo que contenga asientos contables exportados
                                    con la función <em><b>Exportar</b></em> del menú <em><b>Copiar</b></em>
                                    que existe en esta página.
            `);
        }

        // recorremos el asiento para validar que todos correspondan al mismo mes ...
        if (!asientosContablesArray[0].mesFiscal || !asientosContablesArray[0].anoFiscal ||
            !asientosContablesArray[0].mes || !asientosContablesArray[0].ano) {
            throw new Meteor.Error(`Error: Aparentemente, el archivo pasado a esta función no es correcto.<br />
                                    Recuerde que Ud. debe seleccionar un archivo que contenga asientos contables
                                    exportados con la función <em><b>Exportar</b></em>.
            `);
        }

        let mesFiscal = asientosContablesArray[0].mesFiscal;
        let anoFiscal = asientosContablesArray[0].anoFiscal;

        asientosContablesArray.forEach((asiento) => {

            if (!asiento.mesFiscal || !asiento.anoFiscal) {
                throw new Meteor.Error(`Error: Aparentemente, el archivo pasado a esta función no es correcto.<br />
                                        Recuerde que Ud. debe seleccionar un archivo que contenga asientos contables
                                        exportados con la función <em><b>Exportar</b></em>.
                `);
            }

            if (asiento.mesFiscal != mesFiscal || asiento.anoFiscal != anoFiscal) {
                throw new Meteor.Error(`Error: los asientos contables a importar no corresponden a un mismo mes.<br />
                                        Los asientos contables que Ud. intente importar mediante esta función, deben
                                        corresponder todos al mismo mes.
                `);
            }
        })





        // ------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = asientosContablesArray.length;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        let currentProc = 1;
        let cantidadProcs = 3;
        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                            { myuserId: this.userId, app: 'contab',
                              process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                            { current: currentProc, max: cantidadProcs, progress: '0 %' });
        // ------------------------------------------------------------------------------------------
        let response = null;

        // ------------------------------------------------------------------------------------------------------
        // ahora validamos que las cuentas contables existan en la compañía contab seleccionada
        // nótese que no buscamos por ID de la cuenta; más bien, por la cuenta como tal, pues su ID
        // cambia para cada compañía y los asientos se pueden importar a compañías diferentes ...
        asientosContablesArray.forEach((asiento) => {

            asiento.partidas.forEach((partida) => {

                if (!partida.cuentaContable) {
                    throw new Meteor.Error(`Error: Aparentemente, el archivo pasado a esta función no es correcto.<br />
                                            Recuerde que Ud. debe seleccionar un archivo que contenga asientos contables
                                            exportados con la función <em><b>Exportar</b></em>.
                    `);
                }

                response = null;
                response = Async.runSync(function(done) {
                    CuentasContables_sql.count({
                        where: { cuenta: { $eq: partida.cuentaContable }, cia: { $eq: ciaContab }},
                        attributes: [ 'cuenta' ],
                        raw: true,
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                if (response.result === 0) {
                    throw new Meteor.Error(`Error: al menos una de las cuentas contables en los asientos contables
                                            a importar, no existe en la compañía <em><b>Contab</b></em> seleccionada.<br />
                                            En particular, la cuenta contable ${partida.cuentaContable} no fue encontrada
                                            en la compañía <em><b>Contab</b></em> seleccionada.<br />
                                            Por favor revise.
                    `);
                }

            })

            // ------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                    { myuserId: this.userId, app: 'contab',
                                      process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                    { current: currentProc, max: cantidadProcs,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                        { myuserId: this.userId, app: 'contab',
                                          process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                        { current: currentProc, max: cantidadProcs,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // ------------------------------------------------------------------------------------------
        })


        // ------------------------------------------------------------------------------------------------------
        // ahora determinamos el mes fiscal de los asientos a cargar; aunque viene uno con cada asiento,
        // puede ser diferente para la compañía seleccionada
        let mesCalendario = asientosContablesArray[0].mes;
        let anoCalendario = asientosContablesArray[0].ano;

        // al serializar, las fechas vienen como strings ...
        let f = moment(asientosContablesArray[0].fecha).toDate();
        let fechaAsiento = new Date(f.getFullYear(), f.getMonth(), 1);

        let result = {};

        result = ContabFunctions.determinarMesFiscal(fechaAsiento, ciaContab);

        if (!result) {
            throw new Meteor.Error(result.errorMessage);
        }

        let mesFiscalCiaContabSeleccionada = result.mesFiscal;
        let anoFiscalCiaContabSeleccionada = result.anoFiscal;

        // validamos que el mes no esté cerrado en la compañía Contab seleccionada ...
        result = {};
        result = ContabFunctions.validarMesCerradoEnContab(fechaAsiento, ciaContab, false);

        if (result.error) {
            throw new Meteor.Error(result.errMessage);
        }


        // ------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = asientosContablesArray.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProc++;
        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                            { myuserId: this.userId, app: 'contab',
                              process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                            { current: currentProc, max: cantidadProcs, progress: '0 %' });
        // ------------------------------------------------------------------------------------------


        // ------------------------------------------------------------------------------------------------------
        // si el usuario desea mantener los números de cada asiento en la compañía seleccionada, debemos validar
        // que no existan; de otra forma, a cada asisento se le asigna un número antes de ser grabado ...
        if (mantenerNumerosAsientosContables) {

            asientosContablesArray.forEach((asiento) => {

                response = null;
                response = Async.runSync(function(done) {
                    AsientosContables_sql.count({
                        where: { numero: { $eq: asiento.numero },
                                 mesFiscal: { $eq: mesFiscalCiaContabSeleccionada },
                                 anoFiscal: { $eq: anoFiscalCiaContabSeleccionada },
                                 cia: { $eq: ciaContab }
                               },
                        attributes: [ 'numero' ],
                        raw: true,
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                if (response.result > 0) {
                    throw new Meteor.Error(`Error: existen asientos contables en la compañía <em><b>Contab</b></em>
                                            seleccionada y el mes de los asientos a importar,
                                            cuyo número corresponde al número de los asientos contables
                                            a importar. Por ejemplo, el asiento contable número
                                            <b>${asiento.numero.toString()}.</b><br />
                                            Esto no debe ocurrir, pues Ud. indicó que deseaba
                                            <em>mantener los números</em> de
                                            los asientos a importar.<br />
                                            Por favor revise.
                    `);
                }


                // ------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 20) {
                    // hay menos de 20 registros; reportamos siempre ...
                    EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                        { myuserId: this.userId, app: 'contab',
                                          process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                        { current: currentProc, max: cantidadProcs,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                            { myuserId: this.userId, app: 'contab',
                                              process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                            { current: currentProc, max: cantidadProcs,
                                              progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                        reportar = 0;
                    };
                };
                // ------------------------------------------------------------------------------------------

            })
        }

        let currentUser = Meteor.user();



        // ------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = asientosContablesArray.length;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProc++;
        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                            { myuserId: this.userId, app: 'contab',
                              process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                            { current: currentProc, max: cantidadProcs, progress: '0 %' });
        // ------------------------------------------------------------------------------------------

        // ------------------------------------------------------------------------------------------------------
        // finalmente, recorremos el array y grabamos cada asiento a la compañía seleccionada
        asientosContablesArray.forEach((asiento) => {

            // si el usuario no quiere mantener el número de cada asiento, debemos asignar uno
            // nótese que existe una función para ello ...
            if (!mantenerNumerosAsientosContables) {
                let fechaAsiento = moment(asiento.fecha).toDate();
                result = ContabFunctions.determinarNumeroAsientoContab(fechaAsiento, asiento.tipo, ciaContab, false);

                if (result.error) {
                    throw new Meteor.Error(result.errMessage);
                }
                asiento.numero = result.numeroAsientoContab;
            }

            // asignamos el mes y año fiscal que corresponde a la cia contab seleccionada
            asiento.mesFiscal = mesFiscalCiaContabSeleccionada;
            asiento.anoFiscal = anoFiscalCiaContabSeleccionada;

            // para compensar la conversión que ocurre en las fechas al grabar a sql server
            asiento.fecha = moment(asiento.fecha).subtract(TimeOffset, 'h').toDate();
            asiento.ingreso = moment(new Date()).subtract(TimeOffset, 'h').toDate();
            asiento.ultAct = moment(new Date()).subtract(TimeOffset, 'h').toDate();
            asiento.usuario = currentUser.emails[0].address;

            // asignamos la cia contab seleccionada
            asiento.cia = ciaContab;

            // eliminamos el pk del asiento; al insertar, sql server asignará un nuevo pk ...
            delete asiento.numeroAutomatico;

            response = null;
            response = Async.runSync(function(done) {
                AsientosContables_sql.create(asiento)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            let asientoAgregado = response.result.dataValues;

            // TODO: para grabar cada partida, debemos obtener el ID de la cuenta contable; la razón es que
            // la cia contab no es, necesariamente, la misma ...
            asiento.partidas.forEach((partida) => {
                // leer el id de cada cuenta contable para la cia contab seleccionada
                response = null;
                response = Async.runSync(function(done) {
                    CuentasContables_sql.findAll({
                        where: { cuenta: { $eq: partida.cuentaContable }, cia: { $eq: ciaContab }},
                        attributes: [ 'id' ],
                        raw: true,
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                if (!_.isArray(response.result) || !response.result.length || !response.result[0].id) {
                    throw new Meteor.Error(`Error: no hemos podido leer la cuenta contable
                                            <em><b>${partida.cuentaContable}</b></em>
                                            en la compañía <em><b>Contab</b></em> que está ahora seleccionada.<br />
                                            Las cuentas contables usadas en los asientos contables a importar,
                                            <b>deben existir</b> en la compañía <em><b>Contab</b></em> seleccionada.<br />
                                            Por favor revise.
                    `);
                }

                partida.numeroAutomatico = asientoAgregado.numeroAutomatico;
                partida.cuentaContableID = response.result[0].id;

                // TODO: grabar cada partida ,...
                let response = null;
                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partida)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            })

            // ------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                    { myuserId: this.userId, app: 'contab',
                                      process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                    { current: currentProc, max: cantidadProcs,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress',
                                        { myuserId: this.userId, app: 'contab',
                                          process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto' },
                                        { current: currentProc, max: cantidadProcs,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // ------------------------------------------------------------------------------------------
        })

        return `Ok, se han recibido y se han cargado
                <b>${asientosContablesArray.length.toString()} asientos contables</b> a la base de datos.<br />
                Los asientos contables han sido cargados a la compañía <em><b>Contab</b></em> que está
                ahora seleccionada.
        `;
    }
});
