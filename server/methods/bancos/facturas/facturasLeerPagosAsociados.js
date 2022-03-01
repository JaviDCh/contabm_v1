
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods({
   facturasLeerPagosAsociados: function (claveUnicaFactura) {

        // leemos las facturas (en realidad las cuotas) asociadas a un pago en particular
        new SimpleSchema({
           claveUnicaFactura: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ claveUnicaFactura, });

        let query = "";
        let response = null;

         query = `Select p.ClaveUnica as claveUnicaPago, p.NumeroPago as numeroPago,
                  pr.Abreviatura as nombreProveedor,
                  p.Fecha as fecha, m.Simbolo as simboloMoneda, p.Concepto as concepto,
                  Case p.MiSuFlag When 1 Then 'Mi' When 2 Then 'Su' Else 'Indef' End as miSu,
                  p.Monto as monto
                  From Pagos p Inner Join dPagos d On p.ClaveUnica = d.ClaveUnicaPago
                  Inner Join CuotasFactura c On d.ClaveUnicaCuotaFactura = c.ClaveUnica
                  Inner Join Proveedores pr On p.Proveedor = pr.Proveedor
                  Inner Join Monedas m On p.Moneda = m.Moneda
                  Where c.ClaveUnicaFactura = ?
                  `;

         response = null;
         response = Async.runSync(function(done) {
             sequelize.query(query, {
                 replacements: [ claveUnicaFactura, ], type: sequelize.QueryTypes.SELECT })
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });

         if (response.error)
             throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

         let pagosAsociados = response.result;

         pagosAsociados.forEach((pago) => {
             // localizamos la fecha que viene desde sql server
             pago.fecha = moment(pago.fecha).add(TimeOffset, 'hours').toDate();
         })

         return JSON.stringify(pagosAsociados);
   }
})
