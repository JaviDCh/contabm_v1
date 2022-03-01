

import * as lodash from 'lodash';
import * as moment from 'moment'; 

import { CategoriasRetencion_sql } from '../../imports/sqlModels/bancos/categoriasRetencion'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'bancos.categoriasRetencion.leerDesdeSqlServer': function () {

        let response: any = null;
        response = Async.runSync(function(done) {
            CategoriasRetencion_sql.findAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let categoriasRetencion = {};

        let message = "";
        if (response.result.length) {
            
            response.result.forEach((x) => { 
                x.fechaAplicacion = x.fechaAplicacion ? moment(x.fechaAplicacion).add(TimeOffset, 'hours').toDate() : null;
            })
            
            categoriasRetencion = response.result;
            message = `Ok, las categorías de retención han sido leído desde la base de datos.`;
        } else {
            message = `<b>No existen</b> (no fueron encontrados) registros en esta tabla.
                      Por favor grabe los que considere necesarios mediante esta función.`;
        }

        return {
            error: false,
            message: message,
            categoriasRetencion: JSON.stringify(categoriasRetencion),
        };
    },


    "bancos.categoriasRetencion.grabarSqlServer": function (items) {

        check(items, Array);

        if (items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        }

        let inserts = lodash.chain(items).
                      filter(function (item: any) { return item.docState && item.docState == 1; }).
                      map(function (item: any) {
                          delete item.docState;
                          item.categoria = 0;               // la categoria es el pk; viene con un valor; ponemos en cero; sql server inicializará ...
                          return item;
                      }).
                      value();

        inserts.forEach(function (item) {

            item.fechaAplicacion = item.fechaAplicacion ? moment(item.fechaAplicacion).subtract(TimeOffset, 'hours').toDate() : null;

            let response: any = null;
            response = Async.runSync(function(done) {
                CategoriasRetencion_sql.create(item)
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

            item.fechaAplicacion = item.fechaAplicacion ? moment(item.fechaAplicacion).subtract(TimeOffset, 'hours').toDate() : null;

            let response: any = null;
            response = Async.runSync(function(done) {
                CategoriasRetencion_sql.update(item, {
                        where: { categoria: item.categoria
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
                CategoriasRetencion_sql.destroy({ where: { categoria: item.categoria } })
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
