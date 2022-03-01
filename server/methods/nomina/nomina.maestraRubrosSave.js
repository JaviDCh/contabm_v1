
import lodash from 'lodash'; 

Meteor.methods(
{
    'nomina.maestraRubrosSave': function (items) {

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

            let item_sql = lodash.clone(item);
            delete item_sql._id;

            response = Async.runSync(function(done) {
                MaestraRubros_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            item.rubro = savedItem.rubro     // recuperamos el id (pk) de la cuenta; pues se le asignó un valor en sql ...
            MaestraRubros.insert(item, function (error, result) {
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

            // actualizamos el registro en sql ...
            response = Async.runSync(function(done) {
                MaestraRubros_sql.update(item_sql, { where: { rubro: item_sql.rubro }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // ahora actualizamos el registro en mongo ...
            MaestraRubros.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
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

            // el usuario no debe eliminar rubros con rubros asignados asociados
            response = Async.runSync(function(done) {
                RubrosAsignados_sql.count({ where: { rubro: item.rubro }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            if (response.result > 0)
                throw new Meteor.Error(`Error: el rubro <b>${item.nombreCortoRubro}</b> tiene <b><em>rubros asignados</em></b>
                                        asociados; no puede ser eliminado.`);

            // finalmente, si la cuenta no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                MaestraRubros_sql.destroy({ where: { rubro: item.rubro }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            MaestraRubros.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
