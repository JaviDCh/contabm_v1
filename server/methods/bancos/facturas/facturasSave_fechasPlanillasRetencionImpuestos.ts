

import * as moment from 'moment';
import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from 'globals/globals'; 

Meteor.methods(
{
    facturasSave_fechasPlanillasRetencionImpuestos: function (impuestosRetenciones_array) {

        impuestosRetenciones_array.forEach((x) => { 
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            // x.fechaRecepcionPlanilla = x.fechaRecepcionPlanilla ? moment(x.fechaRecepcionPlanilla).subtract(TimeOffset, 'hours').toDate() : null;

            let query = `Update Facturas_Impuestos Set FechaRecepcionPlanilla = ? Where ID = ?`;

            let response: any = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ x.fechaRecepcionPlanilla, x.id ], type: sequelize.QueryTypes.UPDATE })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })

        return {
            message: `Ok, los cambios efectuados en las <em>fechas de recepción de planillas de retención de impuestos</em>,
                      han sido actualizados en la base de datos.`,
        }
    }
})
