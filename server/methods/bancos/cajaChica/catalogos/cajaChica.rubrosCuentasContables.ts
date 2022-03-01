


import * as lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';
import { sequelize } from '../../../../sqlModels/_globals/_loadThisFirst/_globals';

import { CajaChica_RubrosCuentasContables } from '../../../../imports/sqlModels/bancos/cajasChicas'; 

Meteor.methods(
{
    'bancos.cajaChica.catalogos.rubrosCuentasContables.LeerDesdeSql': function (ciaContab) {

        new SimpleSchema({
            ciaContab: { type: Number, optional: false, },
        }).validate({ ciaContab });

        let query = `Select rc.ID as id, rc.Rubro as rubro, rc.CuentaContableID as cuentaContableID 
                     From CajaChica_RubrosCuentasContables rc Inner Join CuentasContables cc 
                     On rc.CuentaContableID = cc.ID 
                     Where cc.Cia = ?`;

        let response: any = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ ciaContab ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // lo primero que hacemos es determinar si el número se genera de acuerdo al tipo del asiento
        let numeracionAsientosSeparadaFlag = response.result[0].NumeracionAsientosSeparadaFlag;

        let rubrosCuentasContables = response.result; 
        
        return JSON.stringify(rubrosCuentasContables);
    }, 

    'bancos.cajaChica.catalogos.rubrosCuentasContables.save': function(items) { 

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {

            item.cajaChica = 0; 
            item.id = 0; 

            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_RubrosCuentasContables.create(item)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            item.cajaChica = savedItem.cajaChica     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
        })


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        value();

        updates.forEach(function (item) {

            // actualizamos el registro en sql ...
            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_RubrosCuentasContables.update(item, { where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })


        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item) {

            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_RubrosCuentasContables.destroy({ where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})
