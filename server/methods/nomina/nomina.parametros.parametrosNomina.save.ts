


import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import * as lodash from 'lodash'; 
import { ParametrosNomina_sql } from '../../../server/imports/sqlModels/nomina/parametros/parametrosNomina'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 

Meteor.methods(
{
    'nomina.parametros.parametrosNomina.save': function (item) {
        
        // en la tabla ParametrosNomina siempre habrá un registro. De no haberlo, al abrir la página, el método que lee 
        // el registro debe agregarlo. Por esa razón, este método solo asume que debe modificar y no eliminar ni agregar 

        if (!item || !item.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        if (item.docState != 2) {
            throw new Meteor.Error("Error inesperado: el registro debe siempre ser modificado, no agregado o eliminado. Por favor revise.");
        }

        // actualizamos el registro en sql ...
        let response: any = null; 
        response = Async.runSync(function(done) {
            ParametrosNomina_sql.update(item, { where: { cia: item.cia }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        return "Ok, los registros han sido actualizados en la base de datos.";
    }
});
