
import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 

import { AsientosContables } from '/imports/collections/contab/asientosContables'; 

Meteor.methods(
{
    asientoContable_leerByID_desdeSql: function (numeroAutomatico) {

        check(numeroAutomatico, Number);

        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({ where: { numeroAutomatico: numeroAutomatico }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!response.result.length) {
            let message = `Error inesperado: no hemos podido leer, en la base de datos, el asiento contable,
                           cuyo número automático (pk) es: <b>${numeroAutomatico.toString()}<b/>.`;

            throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
        };

        // eliminamos el asiento en mongo; al menos por ahora, para el current user
        AsientosContables.remove({ numeroAutomatico: numeroAutomatico, user: this.userId });

        let asientoContable = response.result[0];

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();
        asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
        asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

        if (asientoContable) {
            // nótese como, al menos hasta ahora, no hemos sido capa<ces de leer en una sola operación, un entity y sus
            // inner enities (ejemplo: asiento y partidas). Por ahora, simplemente, hacemos dos queries ...
            response = null;
            response = Async.runSync(function(done) {
                dAsientosContables_sql.findAndCountAll({ where: { NumeroAutomatico: numeroAutomatico }, raw: true })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            if (response.result.count > 0) {

                asientoContable.partidas = [];

                response.result.rows.forEach((partida) => {
                    partida._id =  new Mongo.ObjectID()._str;
                    asientoContable.partidas.push(partida);
                });
            };

            // finalmente, grabamos el asiento contable (y sus partidas) a mongo
            asientoContable._id = new Mongo.ObjectID()._str;
            asientoContable.user = Meteor.userId();

            AsientosContables.insert(asientoContable, function (error, result) {
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }   
            })
        }

        return {
            pkAsientoContale: asientoContable.numeroAutomatico,
            asientoContableMongoID: asientoContable._id
        };
    }
})
