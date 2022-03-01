

import SimpleSchema from 'simpl-schema';
import { CajaChica_Rubros_sql, CajaChica_CajasChicas_sql } from '../../../imports/sqlModels/bancos/cajasChicas'; 
import { Proveedores_sql } from '../../../imports/sqlModels/bancos/proveedores'; 

// leemos los catálogos necesarios para el registro de proveedores desde sql server
// nota: algunos católogos existen siempre en mongo; éstos no y hay que leerlos siempre desde sql
Meteor.methods(
    {
        'bancos.cajaChica.leerTablasCatalogosDesdeSqlServer': function (ciaContab) {

            new SimpleSchema({
                ciaContab: { type: Number, optional: false, },
            }).validate({ ciaContab, });
    
            // cajas chicas 
            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_CajasChicas_sql.findAll({ 
                    where: { ciaContab: ciaContab }, 
                    order: [ ['descripcion', 'ASC'] ], 
                    raw: true, })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })
    
            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            let cajasChicas = response.result;

            // rubros de caja chica 
            response = null;
            response = Async.runSync(function(done) {
                CajaChica_Rubros_sql.findAll({ 
                    order: [ ['descripcion', 'ASC'] ], 
                    raw: true, })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })
    
            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
            
            let rubrosCajaChica = response.result; 

            // proveedores
            response = null;
            response = Async.runSync(function(done) {
                Proveedores_sql.findAll({ 
                    attributes: [ 'proveedor', 'abreviatura' ], 
                    order: [ ['abreviatura', 'ASC'] ], 
                    raw: true, })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })
    
            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
            
            let proveedores = response.result; 
    
            return JSON.stringify({
                cajasChicas: cajasChicas,
                rubrosCajaChica: rubrosCajaChica, 
                proveedores: proveedores, 
            });
        }
    })