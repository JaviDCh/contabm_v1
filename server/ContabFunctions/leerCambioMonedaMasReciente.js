
import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

let leerCambioMonedaMasReciente = (fecha) => {

    let errorMessage = "";
    let sFecha = moment(fecha).format('YYYY-MM-DD') + ' 23:59:59';

    let query = `Select Top 1 FactorDeCambio as factorDeCambio From Asientos Where Fecha <= ? Order By Fecha Desc`;

    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ sFecha ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });


    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    let factorCambio = 0;
    if (Array.isArray(response.result) && response.result.length) {
        // los rows vienen como un array en response.result

        // nota: aparentente, como usamos un raw query, aunque indicamos el modelo, el query regresa un objeto con los nombres originales
        // de las columnas en sql (ie: en vez de 'cambio', 'Cambio') ...
        factorCambio = response.result[0].factorDeCambio;
    }

    return { 
        error: false, 
        factorCambio: factorCambio, 
    };
}

ContabFunctions.leerCambioMonedaMasReciente = leerCambioMonedaMasReciente;
