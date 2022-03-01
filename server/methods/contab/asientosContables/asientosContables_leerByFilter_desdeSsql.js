
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'asientoContable.leerByFilter.desdeSql': function (filter) {

        // NOTA IMPORTANTE: este código no graba los asientos contables leídos desde sql server a mongo.
        // Tan solo los lee y regresa como tal; tal como vienen desde sql server ...
        // el objetivo inicial de este método es regresar algún asiento convertdo para imprimir ambos
        // cuando el usuario consulta un asiento y lo quiere imprimir
        // Posteriormente, podríamos usar este método para leer asientos contables, dado un filtro ...

        check(filter, Object);

        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({
                where: filter,
                include: [ { model: dAsientosContables_sql, as: 'partidas' } ],
                // raw: true,           // ya sabemos que raw no funciona cuando usamos 'include'
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let asientosContables = [];

        response.result.forEach((asientoContable) => {

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();
            asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
            asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

            asientosContables.push(asientoContable);
        });

        return {
            asientosContables: JSON.stringify(asientosContables)
        };
    }
});
