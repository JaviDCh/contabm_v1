

import moment from 'moment';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 


import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';


Meteor.methods(
{
    "bancos.conciliacion.LeerMovtosContables": function (conciliacionID) {

        new SimpleSchema({
            conciliacionID: { type: String, optional: false }
          }).validate({ conciliacionID });

          // TODO: leemos la conciliación; no existe: error
          let conciliacionBancaria = ConciliacionesBancarias.findOne(conciliacionID);

          if (!conciliacionBancaria) {
              let message = `Error inesperado: no hemos podido leer la conciliación bancaria indicada.`;
              return {
                  error: true,
                  message: message
              };
          }

          if (!conciliacionBancaria.cuentaContable) {
              let message = `Error: para que Ud. pueda ejecutar esta función, la conciliación bancaria debe tener una cuenta contable asociada.`;
              return {
                  error: true,
                  message: message
              };
          }


        // ---------------------------------------------------------------------------------------------------
        // TODO: leemos los movimientos bancarios para la cuenta y el período en la conciliación leída
        let query = `Select a.Numero as numero, d.Partida as partida, a.Fecha as fecha,
                     a.Descripcion as descripcionComprobante, d.Descripcion as descripcionPartida,
                     d.Referencia as referencia, d.Debe as debe, d.Haber as haber
                    From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                    Where d.CuentaContableID = ? And a.Fecha Between ? And ?
                    Order By a.Fecha, a.Numero
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    conciliacionBancaria.cuentaContable,
                    moment(conciliacionBancaria.desde).format('YYYY-MM-DD'),
                    moment(conciliacionBancaria.hasta).format('YYYY-MM-DD'),
                ],
                type: sequelize.QueryTypes.SELECT
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.length == 0) {
            let message = `Error inesperado: no hemos podido leer ningún movimiento contable para la cuenta
                    contable asociada a la cuenta bancaria y el período indicados para la conciliación bancaria.`;
            return {
                error: true,
                message: message
            };
        };

        // eliminamos los items en la tabla en mongo
        ConciliacionesBancarias_movimientosCuentaContable.remove({ conciliacionID: conciliacionID });

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 10);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        // para identificar cada movimiento con un simple número local al proceso...
        let consecutivo = 1;
        response.result.forEach((item) => {

            let asientoContable = {};

            asientoContable._id = new Mongo.ObjectID()._str;
            asientoContable.conciliacionID = conciliacionBancaria._id;
            asientoContable.consecutivo = consecutivo;
            asientoContable.comprobante = item.numero;
            asientoContable.partida = item.partida;
            asientoContable.fecha = item.fecha ? moment(item.fecha).add(TimeOffset, 'hours').toDate() : null;
            asientoContable.descripcionComprobante = item.descripcionComprobante;
            asientoContable.descripcionPartida = item.descripcionPartida;
            asientoContable.referencia = item.referencia;
            asientoContable.monto = item.haber != 0 ? item.haber * -1 : item.debe;

            asientoContable.conciliado = 'no';

            ConciliacionesBancarias_movimientosCuentaContable.insert(asientoContable);
            consecutivo++;

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 10) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_conciliacionBancaria_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'conciliacionesBancarias' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        let message = `Ok, <b>${response.result.length.toString()}</b> movimientos contables han sido leídos
                       desde la base de datos, para la <b>cuenta contable</b> y el <b>período</b> indicados.`;

        return {
            error: false,
            message: message
        };
    }
});
