
import lodash from 'lodash';
import { Proveedores_sql } from '/server/imports/sqlModels/bancos/proveedores'; 

Meteor.methods(
{
    'bancos.proveedores.eliminar': function (items) {

        if (!_.isArray(items) || items.length == 0) {
            throw new Meteor.Error(`Aparentemente, no se han marcado items en la lista para ser eliminados
                                    No hay nada que eliminar.`);
        }

        // nótese que *solo* eliminamos en este método
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        let itemsEliminados = 0;

        removes.forEach(function (item) {

            let response = null;

            // finalmente, si la chequera no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                Proveedores_sql.destroy({ where: { proveedor: item.proveedor }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // eliminamos el item de la tabla en mongo ...
            Temp_Consulta_Bancos_Proveedores.remove({ _id: item._id });
            itemsEliminados++;
        });

        return `Ok, <b>${itemsEliminados.toString()}</b> compañías han sido eliminadas de la base de datos.`;
    }
});
