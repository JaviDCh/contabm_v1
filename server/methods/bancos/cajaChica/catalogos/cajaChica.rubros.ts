



import * as lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';
import { CajaChica_Rubros_sql } from '../../../../imports/sqlModels/bancos/cajasChicas'; 

Meteor.methods(
{
    'bancos.cajaChica.catalogos.rubros.LeerDesdeSql': function () {

        let response: any = null;
        response = Async.runSync(function(done) {
            CajaChica_Rubros_sql.findAll({ 
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

        let rubros = response.result; 
        
        return JSON.stringify(rubros);
    }, 

    'bancos.cajaChica.catalogos.rubros.save': function(items) { 

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
                CajaChica_Rubros_sql.create(item)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            item.rubro = savedItem.rubro     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
        })


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        value();

        updates.forEach(function (item) {

            // actualizamos el registro en sql ...
            let response: any = null;
            response = Async.runSync(function(done) {
                CajaChica_Rubros_sql.update(item, { where: { rubro: item.rubro }})
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
                CajaChica_Rubros_sql.destroy({ where: { rubro: item.rubro }})
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
