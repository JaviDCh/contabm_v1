
import lodash from 'lodash'; 

Meteor.methods(
{
    'nomina.cuentasContablesEmpleadoRubroSave': function (items) {

        if (!_.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = _.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {
            let response = null;

            let item_sql = lodash.clone(item);

            delete item_sql._id;
            delete item_sql.user;

            response = Async.runSync(function(done) {
                tCuentasContablesPorEmpleadoYRubro_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            item.claveUnica = savedItem.claveUnica;     // recuperamos el id (pk) de la cuenta; pues se le asignó un valor en sql ...
            Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.insert(item, function (error, result) {
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

            let item_sql = lodash.clone(item.object);

            delete item_sql._id;
            delete item_sql.user;

            response = Async.runSync(function(done) {
                tCuentasContablesPorEmpleadoYRubro_sql.update(item_sql, { where: { claveUnica: item_sql.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item) {
            let response = null;

            response = Async.runSync(function(done) {
                tCuentasContablesPorEmpleadoYRubro_sql.destroy({ where: { claveUnica: item.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
