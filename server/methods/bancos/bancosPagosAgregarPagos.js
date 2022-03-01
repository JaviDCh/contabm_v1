
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import numeral from 'numeral';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    bancosPagosAgregarPagos: function (pagosArray) {

        new SimpleSchema({
            pagosArray: { type: String, optional: false, },
        }).validate({ pagosArray, });

        pagosArray = JSON.parse(pagosArray);

        let query = '';
        let response = null;
        let montoTotalPagado = 0;
        let cantidadPagos = 0;

        pagosArray.forEach((pago) => {

            // primero actualizamos el saldo y estado en la factura
            query = `Update Facturas Set Saldo = Saldo - ${pago.montoAPagar},
                         Estado = (Case When (Saldo = ${pago.montoAPagar}) Then 3 Else 2 End)
                         Where ClaveUnica = ?
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ pago.claveUnicaFactura ],
                        type: sequelize.QueryTypes.UPDATE,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // ----------------------------------------------------------------------------------------
            // en forma idéntica, actualizamos la cuota de la factura
            query = `Update CuotasFactura Set SaldoCuota = SaldoCuota - ${pago.montoAPagar},
                         EstadoCuota = (Case When (SaldoCuota = ${pago.montoAPagar}) Then 3 Else 2 End)
                         Where ClaveUnica = ?
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ pago.claveUnicaCuotaFactura ],
                        type: sequelize.QueryTypes.UPDATE,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            // ----------------------------------------------------------------------------------------
            // agregamos un registro a dPagos
            query = `Insert Into dPagos(ClaveUnicaPago, ClaveUnicaCuotaFactura, MontoPagado)
                            Values(?, ?, ?)
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ pago.claveUnicaPago, pago.claveUnicaCuotaFactura, pago.montoAPagar, ],
                        type: sequelize.QueryTypes.INSERT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            montoTotalPagado += pago.montoAPagar;
            cantidadPagos++;
        });

        // finalmente, actualizamos el pago con el monto total pagado; leemos el monto total pagado en dPagos,
        // pues así el usuario podrá regresar a un pago y agregar facturas más de una vez; ésto, por supuesto,
        // no se hará prácticamente nunca ...
        query = `Select Sum(MontoPagado) as montoTotalPagado From dPagos Where ClaveUnicaPago = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pagosArray[0].claveUnicaPago, ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let montoTotalPagadoEndPagos = response.result[0].montoTotalPagado;

        // ahora si actualizamos el monto pagado en el pago
        query = `Update Pagos Set Monto = ? Where ClaveUnica = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ montoTotalPagadoEndPagos, pagosArray[0].claveUnicaPago, ],
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
            message: `Ok, el pago ha sido efectuado en forma satisfactoria.<br />
                      <b>${cantidadPagos.toString()} facturas</b> han sido afectadas con este pago.<br />
                      El monto total del pago efectuado es <b>${numeral(montoTotalPagado).format('0,0.00')}</b>.`,
        };
    }
});
