


import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import { Nomina_DefinicionAnticipos_sql, Nomina_DefinicionAnticipos_Empleados_sql } from '../../../server/imports/sqlModels/nomina/parametros/definicionAnticipos1raQuincena'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'nomina.parametros.definicionAnticipos.leerDesdeSqlServer': function () {
        
        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        let response:any = null;
        response = Async.runSync(function(done) {
            Nomina_DefinicionAnticipos_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let definicionAnticipos: any[] = [];

        response.result.forEach((item:any) => {
            // localizamos la fecha ... 
            item.desde = item.desde ? moment(item.desde).add(AppGlobalValues.TimeOffset, 'hours').toDate() : null;
            definicionAnticipos.push(item);
        })

        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        response = null;
        response = Async.runSync(function(done) {
            Nomina_DefinicionAnticipos_Empleados_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let definicionAnticiposEmpleados: any[] = [];

        response.result.forEach((item:any) => {
            definicionAnticiposEmpleados.push(item);
        })


        return {
            error: false, 
            message: `Ok los registros de porcentajes de anticipo han sido leídos desde la base de datos.`,
            definicionAnticipos: JSON.stringify(definicionAnticipos),
            definicionAnticiposEmpleados: JSON.stringify(definicionAnticiposEmpleados),
        };
    }
})
