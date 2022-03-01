
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'pago.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: SimpleSchema.Integer, optional: false, }
          }).validate({ pk });

        let response = null;
        response = Async.runSync(function(done) {
            Pagos_sql.findAll(
                {
                    where: { claveUnica: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!response.result.length) {
            return null;
        };

        let pago = response.result[0];

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        pago.fecha = pago.fecha ? moment(pago.fecha).add(TimeOffset, 'hours').toDate() : null;
        pago.ingreso = pago.ingreso ? moment(pago.ingreso).add(TimeOffset, 'hours').toDate() : null;
        pago.ultAct = pago.ultAct ? moment(pago.ultAct).add(TimeOffset, 'hours').toDate() : null;

        return JSON.stringify(pago);
    }
});
