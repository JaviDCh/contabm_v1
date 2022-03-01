
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    bancosUpdateUMC: function (ultimoMesCerrado) {

        Match.test(ultimoMesCerrado, Match.Object);

        let response = {};
        let filter = { cia: ultimoMesCerrado.cia };

        // al actualizar (insert/update), sequelize grobaliza las fechas; revertimos ...
        ultimoMesCerrado.ultAct = moment(ultimoMesCerrado.ultAct).subtract(TimeOffset, 'h').toDate();

        response = Async.runSync(function(done) {
            UltimoMesCerrado_sql.update(ultimoMesCerrado, { where: filter })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // result es 'affectedRows' ...
        if (response.result === null)
            throw new Meteor.Error("no-ultimo-mes-cerrado",
                `Error: aparentemente, la compañía seleccionada no tiene un registro en la tabla <em>último mes cerrado</em>`);

        return JSON.stringify(response.result);
    }
});
