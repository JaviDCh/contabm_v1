


import * as lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';
import { CajaChica_CajasChicas_sql } from '../../../../imports/sqlModels/bancos/cajasChicas'; 

Meteor.methods(
{
    'bancos.cajaChica.catalogos.cajasChicas.LeerDesdeSql': function (ciaContab) {

        new SimpleSchema({
            ciaContab: { type: Number, optional: false, },
        }).validate({ ciaContab });

        let response: any = null;
        response = Async.runSync(function(done) {
            CajaChica_CajasChicas_sql.findAll({ where: { ciaContab: ciaContab },
                    order: [ ['descripcion', 'ASC'] ],
                    raw: true,       
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let cajasChicas = response.result; 
        
        return JSON.stringify(cajasChicas);
    }, 

    'bancos.cajaChica.catalogos.cajasChicas.save': function(items) { 

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {

            item.cajaChica = 0; 

            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_CajasChicas_sql.create(item)
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
                CajaChica_CajasChicas_sql.update(item, { where: { cajaChica: item.cajaChica }})
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
                CajaChica_CajasChicas_sql.destroy({ where: { cajaChica: item.cajaChica }})
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
