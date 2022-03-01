
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods({
   leerAsientosContablesAsociados: function (provieneDe, provieneDe_ID, ciaContabSeleccionada_ID) {

        new SimpleSchema({
            provieneDe: { type: String, optional: false, },
            provieneDe_ID: { type: SimpleSchema.Integer, optional: false, },
            ciaContabSeleccionada_ID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ provieneDe, provieneDe_ID, ciaContabSeleccionada_ID, });

        // leemos desde sql server los asientos contables asociados a una entidad; por ejemplo:
        // facturas, pagos, etc.

        // cada vez que un asiento contable es asociado a una entidad (ej: factura), se registra la descripción en ProvieneDe
        // (ej: 'Facturas') y el id (pk) de la entidad en ProvieneDe_ID ... 

        let query = ""; 

        // los asienttos contables de retenciones son siempre asociados a la factura; de esta forma, cuando se consultan los 
        // asientos asociados a la factura, se muestran los de sus retenciones. Por esa razón, leemos la factura asociada 
        // a la retención aquí ... 
        if (provieneDe === "Facturas - Retenciones de impuesto") { 
            let facturaID = leerFactura(provieneDe_ID); 

            provieneDe = "Facturas"; 
            provieneDe_ID = facturaID; 
        }

        query = `Select a.NumeroAutomatico as numeroAutomatico, a.Numero as numero, a.Fecha as fecha,
                m.Simbolo as simboloMoneda, a.Descripcion as descripcion,
                Count(d.Partida) As cantPartidas,
                Sum(d.Debe) As sumOfDebe, Sum(d.haber) As sumOfHaber
                From Asientos a Left Outer Join dAsientos d
                On a.NumeroAutomatico = d.NumeroAutomatico
                Inner Join Monedas m On a.Moneda = m.Moneda
                Where ProvieneDe = ? And ProvieneDe_ID = ? And a.Cia = ?
                Group By a.NumeroAutomatico, a.Numero, a.Fecha, m.Simbolo, a.Descripcion `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, {
                replacements: [
                    provieneDe,
                    provieneDe_ID,
                    ciaContabSeleccionada_ID,
                ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let asientosAsociados = response.result;

        asientosAsociados.forEach((asiento) => {
            asiento.fecha = moment(asiento.fecha).add(TimeOffset, 'hours').toDate();
        })

        return JSON.stringify(asientosAsociados);
   }
})

function leerFactura(retencionID) { 
    // leemos la factura a la cual corresponde la retención 
    let query = `Select Top 1 FacturaID as facturaID 
                From Facturas_Impuestos  
                Where ID = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
            replacements: [
                retencionID,
            ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result[0].facturaID; 
}
