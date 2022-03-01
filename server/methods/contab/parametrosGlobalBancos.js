

import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 

Meteor.methods(
{
    parametrosGlobalBancosSave: function (parametrosGlobalBancos) {

        if (!_.isArray(parametrosGlobalBancos) || parametrosGlobalBancos.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let someItemWithDocState = _.some(parametrosGlobalBancos, function(item) { return item.docState; });

        if (!someItemWithDocState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        // -----------------------------------------------------------------------------------------------------
        // grabamos los cambios en analiisContable

        let inserts = _.chain(parametrosGlobalBancos).
                      filter( (item) => { return item.docState && item.docState == 1; }).
                      map( (item) => { delete item.docState; return item; }).
                      value();

        inserts.forEach((item) => {
            ParametrosGlobalBancos.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        let updates = _.chain(parametrosGlobalBancos).
                        filter( (item) => { return item.docState && item.docState == 2; }).
                        map( (item) => { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map( (item) => { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map( (item) => { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separoles)
                        value();

        updates.forEach( (item) => {
            ParametrosGlobalBancos.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });

        let removes = _.filter(parametrosGlobalBancos, (item) => { return item.docState && item.docState == 3; });

        removes.forEach( (item) => {
            ParametrosGlobalBancos.remove({ _id: item._id });
        });


        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
