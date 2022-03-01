
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

let  determinarDiasVacacionesYBono = (empleadoID, anoVacaciones) => {

    // debugger;
    // nota: esta función determina la cantidad de días de bono y de vacaciones, en base al 'año de vacaciones'
    // del empleado. El año de
    // vacaciones es la cantidad de años que el empleado tiene en la empresa y a la cual corresponden
    // las vacaciones; por ejemplo: un empleado
    // puede estar en su 4to. año en la empresa (actual) y tomarse las vacaciones en para su 3er. año
    // (cumplido). En este ejemplo, la variable
    // 'añoVacaciones' sería 3.

    let query = "";

    let cantDiasBono = 0;
    let cantDiasVacacionesSegunTabla = 0;

    // --------------------------------------------------------------------------------------------
    // cantidad de sábados y domingos en el período
    query = `Select Dias, DiasBono, DiasAdicionales From VacacPorAnoParticulares
             Where Ano = ? And Empleado = ?
            `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements:
            [
                anoVacaciones,
                empleadoID,
            ],
            type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.length > 0) {
        cantDiasBono = response.result[0].DiasBono;;
        cantDiasVacacionesSegunTabla = response.result[0].Dias;

        if (response.result[0].DiasAdicionales)
            cantDiasVacacionesSegunTabla += response.result[0].DiasAdicionales;
    }
    else {
        query = `Select Dias, DiasBono, DiasAdicionales From VacacPorAnoGenericas
                 Where Ano = ?
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements:
                [
                    anoVacaciones,
                ],
                type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.length > 0) {
            cantDiasBono = response.result[0].DiasBono;;
            cantDiasVacacionesSegunTabla = response.result[0].Dias;

            if (response.result[0].DiasAdicionales)
                cantDiasVacacionesSegunTabla += response.result[0].DiasAdicionales;
        }
    }

    return {
        error: false,
        cantDiasBono: cantDiasBono,
        cantDiasVacacionesSegunTabla: cantDiasVacacionesSegunTabla,
    };
};


NominaFunctions.determinarDiasVacacionesYBono = determinarDiasVacacionesYBono;
