

import { ParametrosBancos } from '/imports/collections/bancos/parametrosBancos'; 

Meteor.methods(
{
    parametrosBancosSave: function (parametrosBancos) {

        if (!_.isArray(parametrosBancos) || parametrosBancos.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let someItemWithDocState = _.some(parametrosBancos, function(item) { return item.docState; });

        if (!someItemWithDocState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        // -----------------------------------------------------------------------------------------------------
        // grabamos los cambios en analiisContable

        let inserts = _.chain(parametrosBancos).
                      filter( (item) => { return item.docState && item.docState == 1; }).
                      map( (item) => { delete item.docState; return item; }).
                      value();

        inserts.forEach((item) => {
            ParametrosBancos.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        let updates = _.chain(parametrosBancos).
                        filter( (item) => { return item.docState && item.docState == 2; }).
                        map( (item) => { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map( (item) => { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map( (item) => { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separoles)
                        value();

        updates.forEach( (item) => {
            ParametrosBancos.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        let removes = _.filter(parametrosBancos, (item) => { return item.docState && item.docState == 3; });

        removes.forEach( (item) => {
            ParametrosBancos.remove({ _id: item._id });
        });


        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
