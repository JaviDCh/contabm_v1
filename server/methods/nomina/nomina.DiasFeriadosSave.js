
import lodash from 'lodash';
import moment from 'moment'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'nomina.diasFeriadosSave': function (items) {

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            // ej: _id, arrays de faltas y sueldos, etc.
            let response = null;

            let item_sql = lodash.clone(item);

            delete item_sql._id;
            item_sql.fecha = item_sql.fecha ? moment(item_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;

            response = Async.runSync(function(done) {
                DiasFeriados_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
        });


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response = null;

            let item_sql = lodash.clone(item.object);

            delete item_sql._id;
            item_sql.fecha = item_sql.fecha ? moment(item_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;

            // actualizamos el registro en sql ...
            response = Async.runSync(function(done) {
                DiasFeriados_sql.update(item_sql, { where: { claveUnica: item_sql.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });


        // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
        // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
        // (y validamos) primero la cuenta 50101001 y luego 50101 ...
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      orderBy(['numNiveles'], ['desc']).
                      value();

        removes.forEach(function (item) {

            let response = null;

            response = Async.runSync(function(done) {
                DiasFeriados_sql.destroy({ where: { claveUnica: item.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    },

    'nomina.diasFiestaNacionalSave': function (items) {

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            // ej: _id, arrays de faltas y sueldos, etc.
            let response = null;

            let item_sql = lodash.clone(item);

            delete item_sql._id;
            item_sql.fecha = item_sql.fecha ? moment(item_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;

            response = Async.runSync(function(done) {
                DiasFiestaNacional_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
        });


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response = null;

            let item_sql = lodash.clone(item.object);

            delete item_sql._id;
            item_sql.fecha = item_sql.fecha ? moment(item_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;

            // actualizamos el registro en sql ...
            response = Async.runSync(function(done) {
                DiasFiestaNacional_sql.update(item_sql, { where: { claveUnica: item_sql.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });


        // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
        // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
        // (y validamos) primero la cuenta 50101001 y luego 50101 ...
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      orderBy(['numNiveles'], ['desc']).
                      value();

        removes.forEach(function (item) {

            let response = null;

            response = Async.runSync(function(done) {
                DiasFiestaNacional_sql.destroy({ where: { claveUnica: item.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
