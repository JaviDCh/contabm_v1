


declare const Async;                // pues no tenemos el 'type definition file' para 'meteorhacks:async' ...
import { CentrosCosto_sql } from '../../imports/sqlModels/contab/centrosCosto';

Meteor.methods(
{
    'contab.leerCentrosCostro.desdeSqlServer': function () {

        let response: any = null;

        // ---------------------------------------------------------------------------------------------------
        // Compañías (empresas usuarias) - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function (done) {
            CentrosCosto_sql.findAndCountAll({ order: [ [ 'descripcion', 'ASC' ] ], raw: true, })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let centrosCostoArray = []; 

        centrosCostoArray = response.result && response.result.rows && Array.isArray(response.result.rows) ? response.result.rows : []; 
        
        return JSON.stringify(centrosCostoArray);
    }
})