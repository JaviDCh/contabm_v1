
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

Meteor.methods(
{
    contab_leerAnosSaldosContables: function (ciaContabSeleccionada)
    {
        check(ciaContabSeleccionada, Match.Integer);

        // leemos los años para los cuales se han registrado saldos (contables) en Contab
        query = `Select Distinct Ano as ano From SaldosContables Where Cia = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ ciaContabSeleccionada ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });
        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let anosArray = [];

        response.result.forEach((ano) => {
            anosArray.push(ano.ano);
        });

        return anosArray;
    }
});
