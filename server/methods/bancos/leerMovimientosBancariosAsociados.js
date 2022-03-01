
import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods({
   leerMovimientosBancariosAsociados: function (pagoID) {

       // leemos desde sql server los asientos contables asociados a una entidad; por ejemplo:
       // facturas, pagos, etc.

        new SimpleSchema({
           pagoID: { type: SimpleSchema.Integer, optional: false, },
       }).validate({ pagoID, });


         // ------------------------------------------------------------------------------------
         // ahora que tenemos la chequera, leemos la cantidad de cheques usados para la misma
         query = `Select m.ClaveUnica as claveUnica, m.Tipo as tipo,
                  m.Fecha as fecha, m.Transaccion as transaccion,
                  p.Abreviatura as nombreCompania, m.Beneficiario as beneficiario,
                  m.Concepto as concepto, m.Monto as monto, m.PagoID as pagoID
                  From MovimientosBancarios m Left Outer Join Proveedores p On m.ProvClte = p.Proveedor
                  Where m.PagoID = ?`;

         response = null;
         response = Async.runSync(function(done) {
             sequelize.query(query, {
                 replacements: [
                     pagoID,
                 ], type: sequelize.QueryTypes.SELECT })
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });

         if (response.error)
             throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

         let movimientosBancariosAsociados = response.result;

         movimientosBancariosAsociados.forEach((movimientoBancario) => {
             movimientoBancario.fecha = moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate();
         })

         return JSON.stringify(movimientosBancariosAsociados);
   }
})
