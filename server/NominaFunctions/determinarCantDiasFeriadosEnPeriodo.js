

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment'; 

let  cantDiasFeriadosEnPeriodo = (desde, hasta) => {

    // debugger;

    if (!lodash.isDate(desde) || !lodash.isDate(hasta)) {
        return {
            error: true,
            errMessage: `Error al intentar determinar días feriados: fechas invalidas.`
        };
    };

    if (desde > hasta) {
        return {
            error: true,
            errMessage: `Error al intentar determinar días feriados: aunque las fechas
                         son válidas, el período es inválido.`
        };
    };

    let errMessage = "";
    let numeroAsientoContab = 0;

    let query = "";

    let cantSabDom = 0;
    let cantDiasFeriados = 0;

    // --------------------------------------------------------------------------------------------
    // cantidad de sábados y domingos en el período
    query = `Select Count(*) as contaSabDom From DiasFeriados Where Fecha Between ? and ? and
             Tipo In (0, 1)
            `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements:
            [
                moment(desde).format('YYYY-MM-DD'),
                moment(hasta).format('YYYY-MM-DD'),
            ],
            type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.length > 0) {
        cantSabDom = response.result[0].contaSabDom;
    };


    // --------------------------------------------------------------------------------------------
    // cantidad de días feriados en el período
    query = `Select Count(*) as contaFeriados From DiasFeriados Where Fecha Between ? and ? and
             Tipo Not In (0, 1)
            `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements:
            [
                moment(desde).format('YYYY-MM-DD'),
                moment(hasta).format('YYYY-MM-DD'),
            ],
            type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.length > 0) {
        cantDiasFeriados = response.result[0].contaFeriados;
    };


    return {
        error: false,
        cantSabDom: cantSabDom,
        cantDiasFeriados: cantDiasFeriados,
    };
};


NominaFunctions.cantDiasFeriadosEnPeriodo = cantDiasFeriadosEnPeriodo;
