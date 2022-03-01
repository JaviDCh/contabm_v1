
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'administracion.utilitarios.eliminarDatosCompaniaContab': function (ciaContab) {

        new SimpleSchema({
            ciaContab: { type: Object, blackbox: true, optional: false, },
        }).validate({ ciaContab, });

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        // -------------------------------------------------------------------------------------------------------------
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 1;
        let numberOfProcess = 6;
        let currentProcess = 1;

        // -------------------------------------------------------------------------------------------------------------
        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "administracion_utilitarios_eliminarCompania_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'administracion', process: 'eliminarDatosCompaniaContab' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `eliminando pagos ...`
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        deleteFromSql_result = eliminarRegistrosSql('Pagos', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let pagos_count = deleteFromSql_result.recordCount;
        // -------------------------------------------------------------------------------------------------------------

        // valores para reportar el progreso
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 1;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `eliminando facturas ...`
                    }
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // ---------------------------------------------------------------------------------------------------
        // intentamos eliminar las facturas
        let deleteFromSql_result = eliminarRegistrosSql('Facturas', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let facturas_count = deleteFromSql_result.recordCount;

        // -------------------------------------------------------------------------------------------------------------
        // *** dAsientos: ponemos en nulls ConciliacionMovimientoID ***
        // -------------------------------------------------------------------------------------------------------------
        let query = `Update d Set d.ConciliacionMovimientoID = Null
                     From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                     Where a.Cia = ?
                    `;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
              replacements: [
                  ciaContab.numero,
              ],
              type: sequelize.QueryTypes.UPDATE
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
          let errorMessage = response.error && response.error.message ? response.error.message : response.error.toString();

          return {
            error: true,
            message: errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** MovimientosBancarios: ponemos en nulls ConciliacionMovimientoID ***
        // -------------------------------------------------------------------------------------------------------------
        query = `Update m Set m.ConciliacionMovimientoID = Null
                 From MovimientosBancarios m Inner Join Chequeras ch On m.ClaveUnicaChequera = ch.NumeroChequera
                 Inner Join CuentasBancarias cb on ch.NumeroCuenta = cb.CuentaInterna
                 Where cb.Cia = ?
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
              replacements: [
                  ciaContab.numero,
              ],
              type: sequelize.QueryTypes.UPDATE
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
          let errorMessage = response.error && response.error.message ? response.error.message : response.error.toString();

          return {
            error: true,
            message: errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** ConciliacionesBancarias ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('ConciliacionesBancarias', ciaContab.numero, 'CiaContab');

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------


        // -------------------------------------------------------------------------------------------------------------
        // *** cuentas bancarias ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('CuentasBancarias', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** ParametrosBancos ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('ParametrosBancos', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** SaldosCompanias ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('SaldosCompanias', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** tDefaultsImprimirCheque ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('tDefaultsImprimirCheque', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** UltimoMesCerrado ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('UltimoMesCerrado', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** BancosInfoTarjetas ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('BancosInfoTarjetas', ciaContab.numero, 'CiaContab');

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** OrdenesPago ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('OrdenesPago', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** OrdenesPagoId ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('OrdenesPagoId', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** tEmpleados ***
        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 1;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `eliminando empleados ...`
                    }
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

        deleteFromSql_result = eliminarRegistrosSql('tEmpleados', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let empleados_count = deleteFromSql_result.recordCount;
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** PrestacionesSocialesHeaders ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('PrestacionesSocialesHeaders', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** tCuentasContablesPorEmpleadoYRubro ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('tCuentasContablesPorEmpleadoYRubro', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** tGruposEmpleados ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('tGruposEmpleados', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** Asientos ***
        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 1;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `eliminando asientos contables ...`
                    }
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

        deleteFromSql_result = eliminarRegistrosSql('Asientos', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let asientos_count = deleteFromSql_result.recordCount;
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** AnalisisContable ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('AnalisisContable', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** MesesDelAnoFiscal ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('MesesDelAnoFiscal', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** NivelesAgrupacionContableMontosEstimados ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('NivelesAgrupacionContableMontosEstimados', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** Presupuesto_Codigos ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('Presupuesto_Codigos', ciaContab.numero, 'CiaContab');

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** SaldosContables ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('SaldosContables', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** UltimoMesCerradoContab ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('UltimoMesCerradoContab', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        // -------------------------------------------------------------------------------------------------------------
        // *** InventarioActivosFijos ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('InventarioActivosFijos', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** CajaChica_CajasChicas ***
        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 1;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `eliminando registros de caja chica ...`
                    }
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

        deleteFromSql_result = eliminarRegistrosSql('CajaChica_CajasChicas', ciaContab.numero, 'CiaContab');

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let cajaChica_count = deleteFromSql_result.recordCount;
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** CajaChica_Parametros ***
        // -------------------------------------------------------------------------------------------------------------
        deleteFromSql_result = eliminarRegistrosSql('CajaChica_Parametros', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }
        // -------------------------------------------------------------------------------------------------------------

        // -------------------------------------------------------------------------------------------------------------
        // *** CuentasContables ***
        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = 1;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 1;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `eliminando cuentas contables ...`
                    }
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);

        deleteFromSql_result = eliminarRegistrosSql('CuentasContables', ciaContab.numero);

        if (deleteFromSql_result.error) {
          return {
            error: true,
            message: deleteFromSql_result.errorMessage,
          }
        }

        let cuentasContables_count = deleteFromSql_result.recordCount;
        // -------------------------------------------------------------------------------------------------------------


        let finalMessage = `${numeral(facturas_count).format('#,#')} facturas se han eliminado en ${ciaContab.nombreCorto}; <br />
                            ${numeral(pagos_count).format('#,#')} pagos se han eliminado en ${ciaContab.nombreCorto}; <br />
                            ${numeral(empleados_count).format('#,#')} empleados se han eliminado en ${ciaContab.nombreCorto}; <br />
                            ${numeral(asientos_count).format('#,#')} asientos contables se han eliminado en ${ciaContab.nombreCorto}; <br />
                            ${numeral(cuentasContables_count).format('#,#')} cuentas contables se han eliminado en ${ciaContab.nombreCorto}; <br />
                            ${numeral(cajaChica_count).format('#,#')} registros de caja chica se han eliminado en ${ciaContab.nombreCorto}; <br />
        `;

        return {
          error: false,
          message: finalMessage,
        }
    }
})

// --------------------------------------------------------------------------------------------------
// para eliminar el contenido de una tabla sql, para una ciaContab determinada ...

function eliminarRegistrosSql(tableName, ciaContabID, ciaColumnName = 'Cia') {

  let errorMessage = "";
  let query = `Select Count(*) as recordCount From ${tableName} Where ${ciaColumnName} = ?`;

  let response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query, {
          replacements: [
              ciaContabID,
          ],
          type: sequelize.QueryTypes.SELECT
      })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  })

  if (response.error) {
    errorMessage = response.error && response.error.message ? response.error.message : response.error.toString();

    return {
      error: true,
      message: errorMessage,
    }
  }

  let recordCount = response.result[0].recordCount;

  query = `Delete From ${tableName} Where ${ciaColumnName} = ?`;

  response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query, {
        replacements: [
            ciaContabID,
        ],
        type: sequelize.QueryTypes.DELETE
      })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  })

  if (response.error) {

    if (response.error.message) {
      errorMessage = response.error.message;
    } else {
      errorMessage = response.error.toString();
    }

    return { error: true, errorMessage: errorMessage, };
  }

  return {
    error: false,
    recordCount: recordCount,
  }
}
