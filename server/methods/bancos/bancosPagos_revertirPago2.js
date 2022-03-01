
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    bancosPagos_revertirPago2: function (claveUnicaPago) {

        new SimpleSchema({
            claveUnicaPago: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ claveUnicaPago, });

        let query = '';
        let response = null;

        // lo primero que hacemos es leer los registros en dPagos
        query = `Select ClaveUnicaCuotaFactura as claveUnicaCuotaFactura,
                 MontoPagado as montoPagado From dPagos Where ClaveUnicaPago = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago, ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let registrosEndPagos = 0;

        response.result.forEach((pago) => {

            // revertimos el saldo y estado en la cuota - nótese que tenemos que leer la cuota para obtener
            // el pk de la factura ...
            query = `Select ClaveUnicaFactura as claveUnicaFactura,
                     TotalCuota as totalCuota,
                     SaldoCuota as saldoCuota,
                     EstadoCuota as estadoCuota
                     From CuotasFactura Where ClaveUnica = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ pago.claveUnicaCuotaFactura ],
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            let cuotaFactura = response.result[0];

            cuotaFactura.saldoCuota += pago.montoPagado;

            if (cuotaFactura.saldoCuota === cuotaFactura.totalCuota) {
                cuotaFactura.estadoCuota = 1;       // pendiente
            } else {
                // debe ser parcial, pues nunca será pagada (3)
                cuotaFactura.estadoCuota = 2;       // parcial
            }

            // ok, actualizamos la cuota con el saldo y estado determinados arriba
            query = `Update CuotasFactura Set SaldoCuota = ?, EstadoCuota = ? Where ClaveUnica = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ cuotaFactura.saldoCuota, cuotaFactura.estadoCuota, pago.claveUnicaCuotaFactura ],
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // revertimos el saldo y estado en la factura; nótese que su pk fue leído al leer la cuota
            // si el total a pagar es igual al monto pagado (en dPagos), al sumar este monto quedará en en saldo original,
            // ponemos Pendiente, de otra forma, quedará un saldo, ponemos Parcial ...
            query = `Update Facturas Set Saldo = Saldo + ${pago.montoPagado},
                         Estado = (Case When (TotalAPagar = (Saldo + ${pago.montoPagado})) Then 1 Else 2 End)
                         Where ClaveUnica = ?
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ cuotaFactura.claveUnicaFactura ],
                        type: sequelize.QueryTypes.UPDATE,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            registrosEndPagos++;
        })

        // eliminamos los registros en dPagos
        query = `Delete From dPagos Where ClaveUnicaPago = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago, ],
                    type: sequelize.QueryTypes.DELETE,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // ponemos el monto del pago en Nulls
        query = `Update Pagos Set Monto = null Where ClaveUnica = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ claveUnicaPago, ],
                    type: sequelize.QueryTypes.UPDATE,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        return {
            error: false,
            message: `Ok, el pago fue revertido en forma satisfactoria.<br />
                      <b>${registrosEndPagos.toString()} facturas</b> que estaban asociadas a este pago,
                      han quedado como estaban antes de haber sido aplicado el mismo.
                     `,
        };
    }
});
