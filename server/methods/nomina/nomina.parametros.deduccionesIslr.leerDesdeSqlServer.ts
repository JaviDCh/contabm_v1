

import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import { DeduccionesIslr_sql } from '../../../server/imports/sqlModels/nomina/parametros/deduccionesIslr'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'nomina.parametros.deduccionesIslr.leerDesdeSqlServer': function () {
        

        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        let response:any = null;
        response = Async.runSync(function(done) {
            DeduccionesIslr_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let deduccionesIslr: any[] = [];

        response.result.forEach((item:any) => {
            // localizamos la fecha ... 
            item.desde = item.desde ? moment(item.desde).add(AppGlobalValues.TimeOffset, 'hours').toDate() : null;
            deduccionesIslr.push(item);
        })

        return {
            error: false, 
            cantRecs: deduccionesIslr.length, 
            message: `Ok ${deduccionesIslr.length.toString()} registros de deducciones de Islr han sido leídos desde la base de datos.`,
            deduccionesIslr: JSON.stringify(deduccionesIslr),
        };
    }
})
