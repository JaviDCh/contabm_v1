


import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import { VacacPorAnoGenericas_sql, VacacPorAnoParticulares_sql } from '../../../server/imports/sqlModels/nomina/parametros/cantidadDiasVacacionesPorAno'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 

Meteor.methods(
{
    'nomina.parametros.vacacionesPorAno.leerDesdeSqlServer': function () {
        
        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        let response:any = null;
        response = Async.runSync(function(done) {
            VacacPorAnoGenericas_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let vacacionesPorAnoGenericas: any[] = [];

        response.result.forEach((item:any) => {
            vacacionesPorAnoGenericas.push(item);
        })

        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        response = null;
        response = Async.runSync(function(done) {
            VacacPorAnoParticulares_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let vacacionesPorAnoParticulares: any[] = [];

        response.result.forEach((item:any) => {
            vacacionesPorAnoParticulares.push(item);
        })


        return {
            error: false, 
            message: `Ok los registros de cantidad de días de vacaciones han sido leídos desde la base de datos.`,
            vacacionesPorAno_genericos: JSON.stringify(vacacionesPorAnoGenericas),
            vacacionesPorAno_empleado: JSON.stringify(vacacionesPorAnoParticulares),
        };
    }
})
