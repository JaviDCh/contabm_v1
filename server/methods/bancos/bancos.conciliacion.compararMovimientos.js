
import numeral from 'numeral';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';

import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from '/imports/collections/bancos/conciliacionesBancarias'; 

Meteor.methods(
{
    "bancos.conciliacion.compararMovimientos": function (conciliacion_ID,
                                                       criteriosSeleccionadosArray,
                                                       mantenerComparacionesAnteriores) {

        new SimpleSchema({
            conciliacion_ID: { type: String, optional: false },
            criteriosSeleccionadosArray: { type: String, optional: false },
            mantenerComparacionesAnteriores: { type: Boolean, optional: false }
        }).validate({ conciliacion_ID, criteriosSeleccionadosArray, mantenerComparacionesAnteriores, });

        criteriosSeleccionadosArray = JSON.parse(criteriosSeleccionadosArray);

        if (!criteriosSeleccionadosArray || !_.isArray(criteriosSeleccionadosArray) || !criteriosSeleccionadosArray.length) {
            let message = `Error: no se ha recibido ningún criterio de comparación.<br />
                           Este proceso no puede ser ejecutado si no se indica, al menos, un criterio de comparación.
                          `;
            return {
                error: true,
                message: message
            };
        }

        // lo primero que hacemos es limpiar alguna comparación anterior; el usuario puede indicar que se mantengan ...
        if (!mantenerComparacionesAnteriores) {
            ConciliacionesBancarias_movimientosPropios.update(
                { conciliacionID: conciliacion_ID },
                { $set: { conciliado: 'no', consecutivoMovBanco: null }},
                { multi: true }
            );

            ConciliacionesBancarias_movimientosCuentaContable.update(
                { conciliacionID: conciliacion_ID },
                { $set: { conciliado: 'no', consecutivoMovBanco: null }},
                { multi: true }
            );

            ConciliacionesBancarias_movimientosBanco.update(
                { conciliacionID: conciliacion_ID },
                { $set: { conciliado: 'no', consecutivoMovPropio: null, conciliadoContab: 'no', consecutivoMovContab: null, }},
                { multi: true }
            );
        }

        // PRIMERO conciliamos los movimientos bancarios propios - luego, lo haremos con los registros en la cuenta contable

        // leemos cada movimiento (propio) y lo buscamos en la otra tabla (del banco), según el
        // 'criterio de busqueda' que indicó el usuario (monto, fecha, etc.). Si existe, lo
        // actualizamos, en *ambas* tablas, para reflejar que fue encontrado
        let movimientosLeidos = 0;
        let movimientosEncontrados = 0;

        let recordCount = ConciliacionesBancarias_movimientosPropios.find({ conciliacionID: conciliacion_ID, conciliado: 'no' }).count();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = recordCount;
        let reportarCada = Math.floor(numberOfItems / 10);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 2;
        let currentProcess = 1;
        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "bancos_conciliacionBancaria_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `Comparando los movimientos bancarios ... `
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        ConciliacionesBancarias_movimientosPropios.find({
            conciliacionID: conciliacion_ID, conciliado: 'no'
        }).forEach((mov) => {

            // TODO: ahora tenemos que 'armar' el filtro para buscar en la otra tabla
            let filtro = construirFiltroComparacion(mov, criteriosSeleccionadosArray);

            // ahora intentamos encontrar en la otra tabla
            let movBanco = ConciliacionesBancarias_movimientosBanco.findOne(filtro);

            if (movBanco) {
                // encontramos el movimiento en la otra tabla; ahora lo actualizamos, en *ambas* tablas,
                // para reflejar que está 'conciliado'
                ConciliacionesBancarias_movimientosPropios.update(
                    { conciliacionID: conciliacion_ID, _id: mov._id, },
                    { $set: { conciliado: 'si', consecutivoMovBanco: movBanco.consecutivo }},
                    { multi: false }
                );

                ConciliacionesBancarias_movimientosBanco.update(
                    { conciliacionID: conciliacion_ID, _id: movBanco._id, },
                    { $set: { conciliado: 'si', consecutivoMovPropio: mov.consecutivo }},
                    { multi: false }
                );

                movimientosEncontrados++;
            }

            movimientosLeidos++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 10) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `Comparando los movimientos bancarios ... `
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `Comparando los movimientos bancarios ... `
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        });


        // -------------------------------------------------------------------------
        // ahora, conciliamos los registros en la cuenta contable

        // leemos cada registro en la cuenta contable (asientos contables) y lo buscamos en la otra tabla (del banco), según el
        // 'criterio de busqueda' que indicó el usuario (monto, fecha, etc.). Si existe, lo
        // actualizamos, en *ambas* tablas, para reflejar que fue encontrado
        // NOTESE que esta vez solo usamos los siguientes criterios: fecha, monto y concepto
        let movimientosLeidos_contab = 0;
        let movimientosEncontrados_contab = 0;

        recordCount = ConciliacionesBancarias_movimientosCuentaContable.find({ conciliacionID: conciliacion_ID, conciliado: 'no' }).count();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = recordCount;
        reportarCada = Math.floor(numberOfItems / 10);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;

        eventData = {
                      current: currentProcess, max: numberOfProcess,
                      progress: '0 %',
                      message: `Comparando los movimientos contables ... `
                    };
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        ConciliacionesBancarias_movimientosCuentaContable.find({
            conciliacionID: conciliacion_ID, conciliado: 'no'
        }).forEach((mov) => {

            // TODO: ahora tenemos que 'armar' el filtro para buscar en la otra tabla (movimientos del banco). NOTESE como, esta vez,
            // solo usamos los criterios: fecha, concepto y monto ...
            let filtro = construirFiltroComparacion_registroContab(mov, criteriosSeleccionadosArray);

            // ahora intentamos encontrar en la otra tabla
            let movBanco = ConciliacionesBancarias_movimientosBanco.findOne(filtro);

            if (movBanco) {
                // encontramos el movimiento en la otra tabla; ahora lo actualizamos, en *ambas* tablas,
                // para reflejar que está 'conciliado'
                ConciliacionesBancarias_movimientosCuentaContable.update(
                    { conciliacionID: conciliacion_ID, _id: mov._id, },
                    { $set: { conciliado: 'si', consecutivoMovBanco: movBanco.consecutivo }},
                    { multi: false }
                );

                ConciliacionesBancarias_movimientosBanco.update(
                    { conciliacionID: conciliacion_ID, _id: movBanco._id, },
                    { $set: { conciliadoContab: 'si', consecutivoMovContab: mov.consecutivo }},
                    { multi: false }
                );

                movimientosEncontrados_contab++;
            }

            movimientosLeidos_contab++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 10) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `Comparando los movimientos contables ... `
                            };
                methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `Comparando los movimientos contables ... `
                                };
                    methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        });


        let message = `Ok, la comparación de movimientos bancarios se ha efectuado en forma satisfactoria.<br /><br />
                       Los criterios de comparación recibidos fueron: ${criteriosSeleccionadosArray.toString()}.<br /><br />
                       <b>${movimientosLeidos.toString()}</b> movimientos <b><em>propios</em></b> fueron leídos; de los cuales,
                       <b>${movimientosEncontrados.toString()}</b> fueron encontrados en los movimientos del banco.<br /><br />
                       <b>${movimientosLeidos_contab.toString()}</b> movimientos <b><em>contables</em></b> fueron leídos; de los cuales,
                       <b>${movimientosEncontrados_contab.toString()}</b> fueron encontrados en los movimientos del banco.<br /><br />
                       `;

        return {
            error: false,
            message: message
        };
    }
});

// para construir el criterio que será usado para buscar un movimiento del banco que
// corresponda al movimiento propio; el usuario puede indicar los criterios de comparación
// que desea usar (fecha, tipo, monto, etc.), en la combinación que desee ...
function construirFiltroComparacion(mov, criteriosSeleccionadosArray) {
    let filtro = {};

    filtro.conciliacionID = mov.conciliacionID;
    filtro.conciliado = 'no';

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'numero'; })) {
        filtro.numero = mov.numero;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'beneficiario'; })) {
        filtro.beneficiario = mov.beneficiario;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'tipo'; })) {
        filtro.tipo = mov.tipo;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'concepto'; })) {
        filtro.concepto = mov.concepto;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'fecha'; })) {
        filtro.fecha = mov.fecha;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'monto'; })) {
        filtro.monto = mov.monto;
    }

    return filtro;
}


// aquí construimos un filtro para buscar en los movimientos del banco, pero el registro contable
// es decir, el asiento contable. NOTESE como solo usamos los criterios: fecha, concepto y monto ...
function construirFiltroComparacion_registroContab(mov, criteriosSeleccionadosArray) {
    let filtro = {};

    filtro.conciliacionID = mov.conciliacionID;
    filtro.conciliadoContab = 'no';

    // if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'numero'; })) {
    //     filtro.numero = mov.numero;
    // }
    //
    // if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'beneficiario'; })) {
    //     filtro.beneficiario = mov.beneficiario;
    // }
    //
    // if (_.find(criteriosSeleccionadosArray, (x) => { return x === 'tipo'; })) {
    //     filtro.tipo = mov.tipo;
    // }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'concepto'; })) {
        filtro.concepto = mov.descripcionPartida;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'fecha'; })) {

        filtro.fecha = mov.fecha;
    }

    if (lodash.find(criteriosSeleccionadosArray, (x) => { return x === 'monto'; })) {
        filtro.monto = mov.monto;
    }

    return filtro;
};
