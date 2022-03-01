


import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import { ParametrosNomina_sql } from '../../../server/imports/sqlModels/nomina/parametros/parametrosNomina'; 
import { Parametros_Nomina_SalarioMinimo_sql } from '../../../server/imports/sqlModels/nomina/parametros/salarioMinimo'; 

import { CompaniaSeleccionada } from '../../../imports/collections/companiaSeleccionada';
import { Companias } from '../../../imports/collections/companias';

import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 

Meteor.methods(
{
    'nomina.parametros.parametrosNomina.leerDesdeSqlServer': function () {

        let ciaSeleccionada: any = null;
        let ciaContabSeleccionada: any = null;
    
        if (this.userId) {
            ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
            if (ciaSeleccionada) {
                ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
            }
        }
        
        // ---------------------------------------------------------------------------------------------------
        // leemos los registros que se han grabado en la tabla de salario mínimo ... 
        let response:any = null;
        response = Async.runSync(function(done) {
            ParametrosNomina_sql.findAll({ where: { cia: ciaContabSeleccionada.numero }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let parametrosNomina: any = {};

        if (!response.result.length) { 
            // si no existe un registro en la tala Parámetros, lo agregamos ahora; siempre esperamos que exista 
            // un registro en esta tabla
            parametrosNomina = { cia: ciaContabSeleccionada.numero }; 
            let done: any = null; 

            response = null;
            response = Async.runSync(function(done) {
            ParametrosNomina_sql.create(parametrosNomina)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
            })

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }


            response = null;
            response = Async.runSync(function(done) {
                ParametrosNomina_sql.findAll({ where: { cia: ciaContabSeleccionada.numero }, raw: true })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })
    
            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            response.result.forEach((item:any) => {
                parametrosNomina = item;
            })
        } else { 
            response.result.forEach((item:any) => {
                parametrosNomina = item;
            })
        }

        
        return {
            error: false, 
            message: `Ok, los valores para los parámetros de la nómina han sido leídos. Ahora Ud. puede modificarlos y hacer un click en Grabar.`,
            parametrosNomina: JSON.stringify(parametrosNomina),
        };
    }
})