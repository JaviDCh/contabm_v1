
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment'; 

let  fechaEsDiaFeriado = (fecha) => {

    if (!lodash.isDate(fecha)) {
        return {
            error: true,
            errMessage: `Error al intentar determinar si una fecha es día feriado: la fecha pasada no es válida.`
        };
    };


    let query = "";
    let cantDiasFeriados = 0;

    // --------------------------------------------------------------------------------------------
    // cantidad de sábados y domingos en el período
    query = `Select Count(*) as cantDiasFeriados From DiasFeriados Where Fecha = ?
            `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements:
            [
                moment(fecha).format('YYYY-MM-DD'),
            ],
            type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.length > 0) {
        cantDiasFeriados = response.result[0].cantDiasFeriados;
    };

    return {
        error: false,
        esFeriado: cantDiasFeriados > 0 ? true : false,
    };
};


NominaFunctions.fechaEsDiaFeriado = fechaEsDiaFeriado;
