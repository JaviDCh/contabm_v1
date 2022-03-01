
import lodash from 'lodash';

Meteor.methods(
{
    'contab.cuentasContablesSave': function (items) {

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
                CuentasContables_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                console.log("Error al intentar grabar a sql la cuenta: ", item_sql); 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            item.id = savedItem.id;     // recuperamos el id (pk) de la cuenta; pues se le asignó un valor en sql ...

            // actualizamos el collection en mongo ...
            CuentasContables.insert(item, function (error, result) {
                if (error) { 
                    console.log("Error al intentar grabar a mongo la cuenta: ", item); 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                } 
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

            // una cuenta de tipo total no debe tener asientos
            if (item.object && item.object.totDet && item.object.totDet == "T") {
                let cuentaContable = item.object;
                response = Async.runSync(function(done) {
                    dAsientosContables_sql.count({ where: { cuentaContableID: cuentaContable.id }})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


                if (response.result > 0)
                    throw new Meteor.Error(`Error: la cuenta contable <b>${cuentaContable.cuenta}</b> tiene asientos
                                            contables asociados; no puede ser de tipo <em><b>total</b></em>.`);
            };

            // una cuenta de tipo detalle no debe tener otras cuentas asociadas (ie: hijas) ...
            if (item.object && item.object.totDet && item.object.totDet == "D") {
                let cuentaContable = item.object;
                response = Async.runSync(function(done) {
                    CuentasContables_sql.count({ where: { $and:
                        [
                            { cuenta: { $like: `${cuentaContable.cuenta}%` }},
                            { cuenta: { $ne: cuentaContable.cuenta }},
                            { cia: cuentaContable.cia }
                        ] }})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


                if (response.result > 0)
                    throw new Meteor.Error(`Error: la cuenta contable <b>${cuentaContable.cuenta}</b> tiene cuentas
                                            contables asociadas; no puede ser de tipo <em><b>detalle</b></em>.`);
            };



            let item_sql = lodash.clone(item.object);
            delete item_sql._id;

            response = Async.runSync(function(done) {
                CuentasContables_sql.update(item_sql, { where: { id: item_sql.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            // actualizamos el collection en mongo ...
            CuentasContables.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
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

            // el usuario no debe eliminar cuentas con asientos contables asociados
            response = Async.runSync(function(done) {
                dAsientosContables_sql.count({ where: { cuentaContableID: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            if (response.result > 0)
                throw new Meteor.Error(`Error: la cuenta contable <b>${item.cuenta}</b> tiene asientos
                                        contables asociados; no puede ser eliminada.`);


            // el usuario no debe eliminar cuentas con cuentas contables asociadas ('hijas')
            response = Async.runSync(function(done) {
                CuentasContables_sql.count({ where: { $and:
                    [
                        { cuenta: { $like: `${item.cuenta}%` }},
                        { cuenta: { $ne: item.cuenta }},
                        { cia: item.cia }
                    ] }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            if (response.result > 0)
                throw new Meteor.Error(`Error: la cuenta contable <b>${item.cuenta}</b> tiene cuentas
                                        contables asociadas; no puede ser eliminada.`);

            // finalmente, si la cuenta no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                CuentasContables_sql.destroy({ where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // actualizamos el collection en mongo ...
            CuentasContables.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
