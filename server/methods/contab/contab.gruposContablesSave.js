

import { GruposContables } from '/imports/collections/contab/gruposContables'; 

Meteor.methods(
{
    'contab.gruposContablesSave': function (items) {

        if (!_.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = _.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            // ej: _id, arrays de faltas y sueldos, etc.
            let response = null;
            let item_sql = {
                grupo: item.grupo,
                descripcion: item.descripcion,
                ordenBalanceGeneral: item.ordenBalanceGeneral,
            };
            response = Async.runSync(function(done) {
                GruposContables_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;


            GruposContables.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        var updates = _.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response = null;

            let item_sql = {
                descripcion: item.object.descripcion,
                ordenBalanceGeneral: item.object.ordenBalanceGeneral,
            };

            response = Async.runSync(function(done) {
                GruposContables_sql.update(item_sql, { where: { grupo: item.grupo }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            GruposContables.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        var removes = _.filter(items, function (item) { return item.docState && item.docState == 3; });

        removes.forEach(function (item) {

            let response = null;

            response = Async.runSync(function(done) {
                GruposContables_sql.destroy({ where: { grupo: item.grupo }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            GruposContables.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
