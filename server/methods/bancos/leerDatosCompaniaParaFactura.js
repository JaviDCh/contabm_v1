

import moment from 'moment'; 
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    leerDatosCompaniaParaFactura: function (pk, companiaSeleccionadaID) {

        new SimpleSchema({
            pk: { type: Number, optional: false }, 
            companiaSeleccionadaID: { type: Number, optional: false }, 
          }).validate({ pk, companiaSeleccionadaID });

        let query = `Select Ciudad as ciudad, AplicaIvaFlag as aplicaIvaFlag,
                     ContribuyenteEspecialFlag as contribuyenteEspecialFlag,
                     SujetoARetencionFlag as sujetoARetencionFlag,
                     NuestraRetencionSobreIvaPorc as nuestraRetencionSobreIvaPorc, 
                     RetencionSobreIvaPorc as retencionSobreIvaPorc 
                     From Proveedores Where Proveedor = ?`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pk.toString(), ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!_.isArray(response.result) || !response.result.length) {
            return {
                error: true,
                message: `Error (inesperado): hemos obtenido un error al intentar leer la compañía desde la base de datos.<br /> 
                No hemos podido  leer la compañía en la base de datos. <br /> 
                Por favor revise.`,
            }
        }

        let proveedor = response.result[0];

        if (!proveedor.ciudad) {
            return {
                error: true,
                message: `Error: la compañía indicada no tiene una ciudad asociada en el registro
                          efectuado en la tabla de compañías.<br />
                          Ud. debe revisar los datos registrados para la compañía en
                          <em>Bancos / Catálogos / Proveedores - clientes</em> y asignar una ciudad a esta
                          compañía.`,
            }
        }

        // leemos los pagos de anticipo *sin facturas asociadas* (sin registros en dPagos) que pueda tener el proveedor 
        query = `Select Pagos.ClaveUnica as _id, NumeroPago as numeroPago, Fecha as fecha, Monto as monto, Concepto as concepto, 
                 dPagos.MontoPagado as montoPagado 
                 From Pagos Left Outer Join dPagos On Pagos.ClaveUnica = dPagos.ClaveUnicaPago 
                 Where Proveedor = ? And AnticipoFlag = 1 And Cia = ? and montoPagado Is Null`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ pk.toString(), companiaSeleccionadaID.toString(), ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let pagosAnticipoArray = []; 

        // TODO: aquí debemos leer solo pagos *sin* facturas asociadas ... 

        if (response.result.length) {
            for (let pago of response.result) { 
                pago.fecha = moment(pago.fecha).add(TimeOffset, 'hours').toDate();
                pagosAnticipoArray.push(pago); 
            }
        }

        return JSON.stringify({ datosProveedor: proveedor, 
                                pagosAnticipo: pagosAnticipoArray }); 
    }
});
