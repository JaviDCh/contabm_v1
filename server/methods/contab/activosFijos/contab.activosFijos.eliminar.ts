


import * as lodash from 'lodash';
import { InventarioActivosFijos_sql } from '../../../imports/sqlModels/contab/inventarioActivosFijos'; 
import { Temp_Consulta_Contab_ActivosFijos } from '../../../../imports/collections/contab/temp.contab.consulta.activosFijos'; 

Meteor.methods(
{
    'contab.activosFijos.eliminar': function (items) {

        if (!Array.isArray(items) || items.length == 0) {
            throw new Meteor.Error(`Aparentemente, no se han marcado items en la lista para ser eliminados
                                    No hay nada que eliminar.`);
        }

        // nótese que *solo* eliminamos en este método
        var removes = items.filter(x => x.docState && x.docState === 3);

        let itemsEliminados = 0;

        removes.forEach(function (item) {

            let response: any = null;

            // finalmente, si la chequera no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                InventarioActivosFijos_sql.destroy({ where: { claveUnica: item.claveUnica }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // eliminamos el item de la tabla en mongo ...
            Temp_Consulta_Contab_ActivosFijos.remove({ claveUnica: item.claveUnica });
            itemsEliminados++;
        });

        return `Ok, <b>${itemsEliminados.toString()}</b> registros han sido eliminados de la base de datos.`;
    }
});