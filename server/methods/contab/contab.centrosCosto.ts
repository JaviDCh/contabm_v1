

import * as lodash from 'lodash';
import * as moment from 'moment'; 

import { CentrosCosto_sql } from '../../imports/sqlModels/contab/centrosCosto'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'contab.centrosCosto.leerDesdeSqlServer': function () {

        let response: any = null;
        response = Async.runSync(function(done) {
            CentrosCosto_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let centrosCosto = []; 

        let message = "";
        if (response.result.length) {
            centrosCosto = response.result;
            message = `Ok, los registros han sido leído desde la base de datos.`;
        } else {
            message = `<b>No existen</b> (no fueron encontrados) registros en esta tabla.
                      Por favor grabe los que considere necesarios mediante esta función.`;
        }

        return {
            error: false,
            message: message,
            centrosCosto: JSON.stringify(centrosCosto),
        };
    },


    "contab.centrosCosto.grabarSqlServer": function (items) {

        check(items, Array);

        if (items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        }

        let inserts = lodash.chain(items).
                      filter(function (item: any) { return item.docState && item.docState == 1; }).
                      map(function (item: any) {
                          delete item.docState;
                          item.centroCosto = 0;               // la centroCosto es el pk; viene con un valor; ponemos en cero; sql server inicializará ...
                          return item;
                      }).
                      value();

        inserts.forEach(function (item) {

            let response: any = null;
            response = Async.runSync(function(done) {
                CentrosCosto_sql.create(item)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
        })


        var updates = lodash.chain(items).
                        filter(function (item: any) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        value();

        updates.forEach(function (item) {

            let response: any = null;
            response = Async.runSync(function(done) {
                CentrosCosto_sql.update(item, {
                        where: { centroCosto: item.centroCosto
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })


        var removes = lodash(items).
                      filter((item: any) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item: any) {

            let response: any = null;
            response = Async.runSync(function(done) {
                CentrosCosto_sql.destroy({ where: { centroCosto: item.centroCosto } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })

        return {
            message: `Ok, los datos han sido actualizados en la base de datos.`,
        };
    }
})
