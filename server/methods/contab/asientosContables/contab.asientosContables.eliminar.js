

import * as lodash from 'lodash';

Meteor.methods(
{
    'contab.asientosContables.eliminar': function (items) {

        if (!Array.isArray(items) || items.length == 0) {
            throw new Meteor.Error(`Aparentemente, no se han marcado items en la lista para ser eliminados.<br />
                                    No hay nada que eliminar.`);
        }

        // nótese que *solo* eliminamos en este método
        var removes = items.filter(x => x.docState && x.docState === 3);

        for (let asiento of removes) { 
            let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(asiento.fecha,
                                                                                      asiento.cia,
                                                                                      asiento.asientoTipoCierreAnualFlag ?
                                                                                      asiento.asientoTipoCierreAnualFlag :
                                                                                      false);
    
            if (validarMesCerradoEnContab.error) { 
                throw new Meteor.Error("meses-cerrados-en-Contab", 
                `Al menos uno de los asientos contables seleccionados para ser eliminados, correponde a un mes <b>ya cerrado</b> en <em>contab</em>. <br />
                 Por favor revise esta situación.<br />
                 Ningún asiento contable ha sido eliminado.`);
            }
        }

        
        let itemsEliminados = 0;

        removes.forEach(function (item) {

            let response = null;

            // finalmente, si la chequera no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                AsientosContables_sql.destroy({ where: { numeroAutomatico: item.numeroAutomatico }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // eliminamos el item de la tabla en mongo ...
            Temp_Consulta_AsientosContables.remove(item._id);
            itemsEliminados++;
        });

        return `Ok, <b>${itemsEliminados.toString()}</b> registros han sido eliminados de la base de datos.`;
    }
});