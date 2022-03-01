
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods({
   pagosLeerFacturasAsociadas: function (claveUnicaPago) {

        // leemos las facturas (en realidad las cuotas) asociadas a un pago en particular
        new SimpleSchema({
           claveUnicaPago: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ claveUnicaPago, });

        let query = "";
        let response = null;

         query = `Select f.ClaveUnica as claveUnicaFactura, f.NumeroFactura as numeroFactura,
                  f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion,
                  f.Proveedor as proveedorID, f.Concepto as concepto, c.NumeroCuota as numeroCuota,
                  c.TotalCuota as totalCuota, c.SaldoCuota as saldoCuota,
                  c.EstadoCuota as estadoCuota
                  From CuotasFactura c Inner Join dPagos d On c.ClaveUnica = d.ClaveUnicaCuotaFactura
                  Inner Join Facturas f On c.ClaveUnicaFactura = f.ClaveUnica
                  Where d.ClaveUnicaPago = ?`;

         response = null;
         response = Async.runSync(function(done) {
             sequelize.query(query, {
                 replacements: [ claveUnicaPago, ], type: sequelize.QueryTypes.SELECT })
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });

         if (response.error)
             throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

         let facturasAsociadas = response.result;

         facturasAsociadas.forEach((cuotaFactura) => {
             cuotaFactura.fechaEmision = moment(cuotaFactura.fechaEmision).add(TimeOffset, 'hours').toDate();
             cuotaFactura.fechaRecepcion = moment(cuotaFactura.fechaRecepcion).add(TimeOffset, 'hours').toDate();
         })

         return JSON.stringify(facturasAsociadas);
   }
})
