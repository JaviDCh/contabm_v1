
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    'contab.parametrosContab.leerDesdeSqlServer': function (ciaContabId) {

        new SimpleSchema({
            ciaContabId: { type: Number, optional: false },
        }).validate({ ciaContabId, });

        let response = null;
        response = Async.runSync(function(done) {
            ParametrosContab_sql.findAll({ where: { cia: ciaContabId }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let parametrosContab = {};

        let message = "";
        if (response.result.length) {
            // el registro puede no existir para la compañía contab seleccionada
            parametrosContab = response.result[0];
            message = `Ok, parámetros contab ha sido leído desde la base de datos.`;
        } else {
            message = `<b>No existe</b> un registro de parámetros para la compañía seleccionada.
                      Por favor grabe uno mediante esta función.`;
        }

        return {
            error: false,
            message: message,
            parametrosContab: JSON.stringify(parametrosContab),
        };
    },


    "contab.parametrosContab.save": function (item) {

        check(item, Object);

        // para regresar el _id; sobre todo del item recién agregado ...
        let itemID = "-999";

        if (item.docState && item.docState == 1) {

            response = Async.runSync(function(done) {
                ParametrosContab_sql.create(item)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
        }


        if (item.docState && item.docState == 2) {

            response = Async.runSync(function(done) {
                ParametrosContab_sql.update(item, {
                        where: { cia: item.cia
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }


        if (item.docState && item.docState == 3) {

            response = Async.runSync(function(done) {
                ParametrosContab_sql.destroy({ where: { cia: item.cia } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        return {
            message: `Ok, los datos han sido actualizados en la base de datos.`,
        };
    }
});
