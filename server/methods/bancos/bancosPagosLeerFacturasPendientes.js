
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    bancosPagosLeerFacturasPendientes: function (proveedor, moneda, fecha, anticipoFlag, cia) {

        new SimpleSchema({
            proveedor: { type: SimpleSchema.Integer, optional: false, },
            moneda: { type: SimpleSchema.Integer, optional: false, },
            fecha: { type: Date, optional: false, },
            anticipoFlag: { type: Boolean, optional: false, },
            cia: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ proveedor, moneda, fecha, anticipoFlag, cia, });

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select f.claveUnica as claveUnicaFactura, c.claveUnica as claveUnicaCuotaFactura,
            	     f.NumeroFactura as numeroFactura, f.NcNdFlag as ncNdFlag,
            	     f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion,
            	     c.FechaVencimiento as fechaVencimiento, c.NumeroCuota as numeroCuota,
                     c.MontoCuota as montoCuota, c.Iva as iva,
            	     c.RetencionSobreIva as retencionSobreIva, c.RetencionSobreISLR as retencionSobreIslr,
                     c.Anticipo as anticipo,
            	     c.TotalCuota as totalCuota, c.SaldoCuota as saldoCuota
                     From CuotasFactura c Inner Join Facturas f On c.ClaveUnicaFactura = f.ClaveUnica
                     Where c.SaldoCuota <> 0 And c.EstadoCuota <> 4 And
                     f.Proveedor = ? And f.Moneda = ? and f.Cia = ?
                    `;

        if (!anticipoFlag) {
            // el usuario puede asociar facturas 'futuras' a pagos de anticipo ...
            query += ` And f.FechaRecepcion <= '${moment(fecha).format("YYYY-MM-DD")}'`;
        }

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ proveedor, moneda, cia ],
                    type: sequelize.QueryTypes.SELECT,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        if (response.result.length == 0) {
            return {
                error: true,
                message: `No hemos podido leer facturas pendientes para la compañía indicada en el pago.`,
            };

        };

        let facturasPendientesArray = [];

        response.result.forEach((item) => {
            item._id = new Mongo.ObjectID()._str;

            item.fechaEmision = item.fechaEmision ? moment(item.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            item.fechaRecepcion = item.fechaRecepcion ? moment(item.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;
            item.fechaVencimiento = item.fechaVencimiento ? moment(item.fechaVencimiento).add(TimeOffset, 'hours').toDate() : null;
            item.montoAPagar = null;

            // leemos el monto que se pudo haber pagado antes para cada cuota (casi nunca hay uno)
            query = `Select Sum(MontoPagado) as montoPagadoAntes From dPagos Where ClaveUnicaCuotaFactura = ?`;
            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ item.claveUnicaCuotaFactura ],
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            let montoPagadoAntes = 0;
            if (response.result.length && response.result[0].montoPagadoAntes) {
                montoPagadoAntes = response.result[0].montoPagadoAntes;
            };

            item.montoPagadoAntes = montoPagadoAntes;

            facturasPendientesArray.push(item);
        });

        return {
            error: false,
            message: `<b>${facturasPendientesArray.length.toString()}</b> facturas pendientes leídas
                      para la compañía indicada en el pago.`,
            facturasPendientes: JSON.stringify(facturasPendientesArray),
        };
    }
});
