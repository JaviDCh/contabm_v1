

import { Monedas } from '../../../imports/collections/monedas';
import * as lodash from 'lodash';
declare const Async;                // pues no tenemos el 'type definition file' para 'meteorhacks:async' ...
import { Monedas_sql } from '../../imports/sqlModels/monedas';

Meteor.methods(
{
    'contab.monedasSave': function (items) {

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            // ej: _id, arrays de faltas y sueldos, etc.
            let response: any = null;

            let item_sql = lodash.clone(item);
            delete item_sql._id;

            response = Async.runSync(function(done) {
                Monedas_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            item.rubro = savedItem.rubro     // recuperamos el id (pk) de la cuenta; pues se le asignó un valor en sql ...
            Monedas.insert(item, function (error, result) {
                if (error) {
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            })
        })


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response: any = null;

            let item_sql = lodash.clone(item.object);
            delete item_sql._id;

            // actualizamos el registro en sql ...
            response = Async.runSync(function(done) {
                Monedas_sql.update(item_sql, { where: { moneda: item_sql.moneda }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // ahora actualizamos el registro en mongo ...
            Monedas.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            })
        })


        // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
        // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
        // (y validamos) primero la cuenta 50101001 y luego 50101 ...
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item) {

            let response: any = null;

            response = Async.runSync(function(done) {
                Monedas_sql.destroy({ where: { moneda: item.moneda }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            Monedas.remove({ _id: item._id });
        })

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
})
