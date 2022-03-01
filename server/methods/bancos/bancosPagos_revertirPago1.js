
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    bancosPagos_revertirPago1: function (claveUnicaPago) {

        new SimpleSchema({
            claveUnicaPago: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ claveUnicaPago, });

        let query = '';
        let response = null;

        // el pago debe tener registros en dPagos para poder ser revertido ...
        query = `Select Count(*) as contaPagos From dPagos Where ClaveUnicaPago = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!response.result[0].contaPagos) {
            return {
                error: true,
                message: `El pago no tiene facturas asociadas.<br />
                          Un pago sin facturas asociadas no puede ser revertido.`,
            };
        }


        // ahora revisamos si el pago tiene un movimiento bancario asociado. De ser así,
        // debemos informar al usuario
        query = `Select Count(*) as contaMovimientosBancarios From MovimientosBancarios Where PagoID = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result[0].contaMovimientosBancarios) {
            return {
                error: false,
                movimientoBancario: true,
                message: ``,
            };
        }

        return {
            error: false,
            message: ``,
        };
    }
});
