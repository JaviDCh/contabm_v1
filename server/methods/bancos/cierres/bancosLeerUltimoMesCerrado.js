
import moment from 'moment'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    bancosLeerUltimoMesCerrado: function (ciaContab) {

        Match.test(ciaContab, Match.Object);
        Match.test(ciaContab.numero, Match.Integer);

        // cada vez que sequelize lee desde sql, crea instances con muchos methods, etc. Para evitar ésto cuando
        // no lo vamos a necesitar, y que todo sea más rápido, usamos 'raw', para que no se cree el 'instance'
        // y solo el 'raw data' que es lo que necesitamos ...

        let response = {};
        response = Async.runSync(function(done) {
            UltimoMesCerrado_sql.findAll({ where: { cia: ciaContab.numero }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!response.result.length) {
            // si no existe un registro en la tabla umc para la compañía Contab, intentamos agregar uno para una fecha muy futura ...
            response = {};
            response = Async.runSync(function(done) {
                UltimoMesCerrado_sql.create({
                    mes: 0,
                    ano: 2100,
                    ultAct: new Date,
                    manAuto: "A",
                    cia: ciaContab.numero,
                    usuario: Meteor.user().emails[0].address,
                })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            response = {};
            response = Async.runSync(function(done) {
                UltimoMesCerrado_sql.findAll({ where: { cia: ciaContab.numero }, raw: true })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            if (!response.result.length) {
                // ésto nunca debe ocurrir ...
                throw new Meteor.Error("no-ultimo-mes-cerrado",
                    `Error: aparentemente, la compañía seleccionada no tiene un registro en la tabla <em>último mes cerrado</em>`);
            };
        };

        // al leer desde sql, sequelize localiza; agregamos el offset (4.3) para revertir ...
        response.result.ultAct = moment(response.result[0].ultAct).add(TimeOffset, 'h').toDate();
        return JSON.stringify(response.result[0]);
    }
});
