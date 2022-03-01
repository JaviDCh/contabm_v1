
Meteor.methods(
{
    codificacionesContablesSave: function (codificacionesContables, codigosContables, codigosContables_cuentasContables) {

        if ((!_.isArray(codificacionesContables) || codificacionesContables.length == 0) &&
            (!_.isArray(codigosContables) || codigosContables.length == 0) &&
            (!_.isArray(codigosContables_cuentasContables) || codigosContables_cuentasContables.length == 0)) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        };

        actualizarCodificacionesContables(codificacionesContables);
        actualizarCodigosContables(codigosContables);
        actualizarCodigosContables_cuentasContables(codigosContables_cuentasContables);

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});



function actualizarCodificacionesContables(codificacionesContables) {

    var inserts = _.chain(codificacionesContables).
                  filter(function (item) { return item.docState && item.docState == 1; }).
                  map(function (item) { delete item.docState; return item; }).
                  value();


    inserts.forEach(function (item) {
        CodificacionesContables.insert(item, function (error, result) {
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });


    var updates = _.chain(codificacionesContables).
                    filter(function (item) { return item.docState && item.docState == 2; }).
                    map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                    map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                    map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                    value();

    updates.forEach(function (item) {
        CodificacionesContables.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
            //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });

    var removes = _.filter(codificacionesContables, function (item) { return item.docState && item.docState == 3; });

    removes.forEach(function (item) {
        // nótese como eliminamos los items relacinoados ...
        CodificacionesContables_codigos_cuentasContables.remove({ codificacionContable_ID: item._id });
        CodificacionesContables_codigos.remove({ codificacionContable_ID: item._id });
        CodificacionesContables.remove({ _id: item._id });
    });
};

function actualizarCodigosContables(codigosContables) {

    var inserts = _.chain(codigosContables).
                  filter(function (item) { return item.docState && item.docState == 1; }).
                  map(function (item) { delete item.docState; return item; }).
                  value();


    inserts.forEach(function (item) {
        CodificacionesContables_codigos.insert(item, function (error, result) {
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });


    var updates = _.chain(codigosContables).
                    filter(function (item) { return item.docState && item.docState == 2; }).
                    map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                    map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                    map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                    value();

    updates.forEach(function (item) {
        CodificacionesContables_codigos.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
            //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });

    var removes = _.filter(codigosContables, function (item) { return item.docState && item.docState == 3; });

    removes.forEach(function (item) {
        // nótese como eliminamos los items relacinoados ...
        CodificacionesContables_codigos_cuentasContables.remove({ codificacionContable_ID: item._id });
        CodificacionesContables_codigos.remove({ _id: item._id });
    });
};

function actualizarCodigosContables_cuentasContables(codigosContables_cuentasContables) {

    var inserts = _.chain(codigosContables_cuentasContables).
                  filter(function (item) { return item.docState && item.docState == 1; }).
                  map(function (item) { delete item.docState; return item; }).
                  value();


    inserts.forEach(function (item) {
        CodificacionesContables_codigos_cuentasContables.insert(item, function (error, result) {
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });


    var updates = _.chain(codigosContables_cuentasContables).
                    filter(function (item) { return item.docState && item.docState == 2; }).
                    map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                    map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                    map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                    value();

    updates.forEach(function (item) {
        CodificacionesContables_codigos_cuentasContables.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
            //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
            if (error)
                throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        });
    });

    var removes = _.filter(codigosContables_cuentasContables, function (item) { return item.docState && item.docState == 3; });

    removes.forEach(function (item) {
        CodificacionesContables_codigos_cuentasContables.remove({ _id: item._id });
    });
};
