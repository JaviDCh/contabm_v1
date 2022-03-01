



import * as lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';
import { sequelize } from '../../../../sqlModels/_globals/_loadThisFirst/_globals';

import { CajaChica_Parametros_sql } from '../../../../imports/sqlModels/bancos/cajasChicas'; 

Meteor.methods(
{
    'bancos.cajaChica.catalogos.parametros.LeerDesdeSql': function (ciaContab) {

        new SimpleSchema({
            ciaContab: { type: Number, optional: false, },
        }).validate({ ciaContab });

        let response: any = null;
        response = Async.runSync(function(done) {
            CajaChica_Parametros_sql.findAll({ where: { cia: ciaContab },
                    raw: true,       
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let cajaChica_parametros = {}; 

        if (response.result.length) { 
            cajaChica_parametros = response.result[0]; 
        } else { 
            // siempre debe haber un registro de parámetros; si no existe uno, lo agregamos para que el usuario lo complete y grabe 
            cajaChica_parametros = { 
                id: 0, 
                cia: ciaContab, 
                docState: 1, 
            }
        }

        return JSON.stringify(cajaChica_parametros);
    }, 

    'bancos.cajaChica.catalogos.parametros.save': function(item) { 

        if (lodash.isEmpty(item)) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        if (!item.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }


        if (item.docState === 1) { 
            item.id = 0; 

            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_Parametros_sql.create(item)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            item.id = savedItem.id     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
        }


        if (item.docState === 2) { 

            // actualizamos el registro en sql ...
            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_Parametros_sql.update(item, { where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }


        if (item.docState === 3) { 

            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_Parametros_sql.destroy({ where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})