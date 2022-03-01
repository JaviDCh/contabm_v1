
import moment from 'moment';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';

Meteor.methods(
{
    bancos_conciliacion_LeerMovtosPropios: function (conciliacionID) {

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
          };

        // ---------------------------------------------------------------------------------------------------
        // TODO: leemos los movimientos bancarios para la cuenta y el período en la conciliación leída

        let query = `Select mb.Transaccion as transaccion, mb.Tipo as tipo, mb.Fecha as fecha,
                    mb.Beneficiario as beneficiario, mb.Concepto as concepto, mb.Monto as monto,
                    mb.FechaEntregado as fechaEntregado
                    From MovimientosBancarios mb Inner Join Chequeras ch On mb.ClaveUnicaChequera = ch.NumeroChequera
                    Inner Join CuentasBancarias cb On ch.NumeroCuenta = cb.CuentaInterna
                    Where cb.CuentaInterna = ? And mb.Fecha Between ? And ?
                    Order By mb.Fecha, mb.Transaccion
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    conciliacionBancaria.cuentaBancaria,
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
            let message = `Error inesperado: no hemos leído ningún movimiento para la cuenta
                    bancaria y el período indicados para la conciliación bancaria.`;
            return {
                error: true,
                message: message
            };
        };

        // eliminamos los items en la tabla en mongo
        ConciliacionesBancarias_movimientosPropios.remove({ conciliacionID: conciliacionID });

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

            let movimientoBancario = {};

            movimientoBancario._id = new Mongo.ObjectID()._str;
            movimientoBancario.conciliacionID = conciliacionBancaria._id;
            movimientoBancario.consecutivo = consecutivo;
            movimientoBancario.numero = parseInt(item.transaccion);
            movimientoBancario.tipo = item.tipo;
            movimientoBancario.fecha = item.fecha ? moment(item.fecha).add(TimeOffset, 'hours').toDate() : null;
            movimientoBancario.beneficiario = item.beneficiario;
            movimientoBancario.concepto = item.concepto;
            movimientoBancario.monto = item.monto;
            movimientoBancario.fechaEntregado = item.fechaEntregado ? moment(item.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
            movimientoBancario.conciliado = 'no';

            ConciliacionesBancarias_movimientosPropios.insert(movimientoBancario);
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

        let message = `Ok, <b>${response.result.length.toString()}</b> movimientos bancarios han sido leídos
                       desde la base de datos, para la <b>cuenta bancaria</b> y el <b>período</b> indicados.`;

        return {
            error: false,
            message: message
        };
    }
});
