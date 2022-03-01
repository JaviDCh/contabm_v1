
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

Meteor.methods(
{
    contabDeterminarAnosCerrados: function (ciaContab) {

        Match.test(ciaContab, Match.Object);
        Match.test(ciaContab.numero, Match.Integer);

        query = `Select Distinct s.Ano as ano
                 From SaldosContables s
                 Where s.Cia = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ ciaContab.numero ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let anosSaldos = [];

        response.result.forEach((ano) => {
            anosSaldos.push(ano);
        });

        // si el array de saldos está vacío, es muy probablemente porque la compañía Contab es nueva y no hay registros de saldos,
        // pero tampoco un umc. Agregamos registros para los años 2000 al 2035 ...

        if (anosSaldos.length === 0) {
            anosSaldos = [ { ano: 2010 }, { ano: 2011 }, { ano: 2012 }, { ano: 2013 }, { ano: 2014 }, { ano: 2015 }, { ano: 2016 }, { ano: 2017 }, { ano: 2018 }, { ano: 2019 }, { ano: 2020 }, { ano: 2021 }, { ano: 2022 },
                           { ano: 2023 }, { ano: 2024 }, { ano: 2025 }, { ano: 2026 }, { ano: 2027 }, { ano: 2028 }, { ano: 2029 }, { ano: 2030 }, { ano: 2031 }, { ano: 2032 }, { ano: 2033 }, { ano: 2034 }, { ano: 2035 }, ];
        };

        return JSON.stringify(anosSaldos);
    }
});
