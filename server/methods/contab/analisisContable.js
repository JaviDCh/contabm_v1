
Meteor.methods(
{
    analisisContableSave: function (analisisContable, analisisContableCuentasContables) {

        // debugger;

        if ((!_.isArray(analisisContable) || analisisContable.length == 0) && (!_.isArray(analisisContableCuentasContables) || analisisContableCuentasContables.length == 0)) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let someItemWithDocState = _.some(analisisContable, function(item) { return item.docState; });
        let someItemWithDocState2 = _.some(analisisContableCuentasContables, function(item) { return item.docState; });

        if (!someItemWithDocState && !someItemWithDocState2) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        // -----------------------------------------------------------------------------------------------------
        // grabamos los cambios en analiisContable

        let inserts = _.chain(analisisContable).
                      filter( (item) => { return item.docState && item.docState == 1; }).
                      map( (item) => { delete item.docState; return item; }).
                      value();

        inserts.forEach((item) => {
            AnalisisContable.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        let updates = _.chain(analisisContable).
                        filter( (item) => { return item.docState && item.docState == 2; }).
                        map( (item) => { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map( (item) => { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map( (item) => { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separoles)
                        value();

        updates.forEach( (item) => {
            AnalisisContable.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        let removes = _.filter(analisisContable, (item) => { return item.docState && item.docState == 3; });

        removes.forEach( (item) => {
            AnalisisContable.remove({ _id: item._id });
        });

        // -----------------------------------------------------------------------------------------------------
        // grabamos los cambios en AnalisisContableCuentasContables

        inserts = _.chain(analisisContableCuentasContables).
                      filter( (item) => { return item.docState && item.docState == 1; }).
                      map( (item) => { delete item.docState; return item; }).
                      value();

        inserts.forEach((item) => {
            AnalisisContableCuentasContables.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        updates = _.chain(analisisContableCuentasContables).
                        filter( (item) => { return item.docState && item.docState == 2; }).
                        map( (item) => { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map( (item) => { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map( (item) => { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separoles)
                        value();

        updates.forEach( (item) => {
            AnalisisContableCuentasContables.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        removes = _.filter(analisisContableCuentasContables, (item) => { return item.docState && item.docState == 3; });

        removes.forEach( (item) => {
            AnalisisContableCuentasContables.remove({ _id: item._id });
        });

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
