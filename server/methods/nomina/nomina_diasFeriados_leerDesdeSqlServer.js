
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    nomina_diasFeriados_LeerDesdeSql: function () {

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select ClaveUnica as claveUnica, Fecha as fecha, Tipo as tipo
                     From DiasFeriados Order By Fecha desc
                     `;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 2;
        let currentProcess = 1;
        EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        let diasFeriados = [];
        let diasFiestaNacional = [];

        response.result.forEach((item) => {

            item._id = new Mongo.ObjectID()._str,
            item.fecha = item.fecha ? moment(item.fecha).add(TimeOffset, 'hours').toDate() : null;

            diasFeriados.push(item);
            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        query = `Select ClaveUnica as claveUnica, Fecha as fecha, Tipo as tipo
                 From DiasFiestaNacional Order By Fecha
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {
            item._id = new Mongo.ObjectID()._str,
            item.fecha = item.fecha ? moment(item.fecha).add(TimeOffset, 'hours').toDate() : null;

            diasFiestaNacional.push(item);
            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_leerDiasFeriados_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return {
            message: "Ok, los días feriados han sido leídos desde sql server.",
            diasFiestaNacional: JSON.stringify(diasFiestaNacional),
            diasFeriados: JSON.stringify(diasFeriados),
        };
    }
});
