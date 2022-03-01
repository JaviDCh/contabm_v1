
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods({
   'bancos.pagos.agregarMovimientoBancario': function (pagoID) {

       // agregamos el asiento que corresponde al registro de una entidad, por ejemplo: factura, pago, nómina,
       // movimiento bancario, etc.
        new SimpleSchema({
           pagoID: { type: SimpleSchema.Integer, optional: false, },
       }).validate({ pagoID });

       let currentUser = Meteor.user();

       let query = null;
       let response = null;

       // leemos el pago y, de paso, el beneficiario en el proveedor
       query = `Select pag.Fecha as fecha, pag.Concepto as concepto,
                pag.Monto as monto, prv.Beneficiario as beneficiario,
                pag.Proveedor as proveedor, pag.MiSuFlag as miSuFlag, pag.Cia as cia
                From Pagos pag Inner Join Proveedores prv
                On pag.Proveedor = prv.Proveedor
                Where pag.ClaveUnica = ?
               `;

       response = null;
       response = Async.runSync(function(done) {
           sequelize.query(query, { replacements: [ pagoID ], type: sequelize.QueryTypes.SELECT })
               .then(function(result) { done(null, result); })
               .catch(function (err) { done(err, null); })
               .done();
       })

       if (response.error) {
         throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
       }

       if (response.result.length == 0) {
           let message = `Error inesperado: no hemos podido leer, en la base de datos, la compañía que
                         corresponde al pago.`;

           return { error: true, message: message };
       }

       let pago = response.result[0];
       pago.fecha = moment(pago.fecha).add(TimeOffset, 'hours').toDate();

       // TODO: validar el UMC en bancos ...
       let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(pago.fecha, pago.cia);

       if (validarMesCerradoEnBancos.error) {
           // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
           let message = ` Error: la fecha del pago (<b>${moment(pago.fecha).format('DD-MM-YYYY')}</b>)
                            corresponde a un mes ya cerrado en Bancos.
                          `;
           return {
               error: true,
               message: message
           };
       }


       // TODO: eer una chequera genérica activa para asociar al movimiento bancario
       query = `Select chq.NumeroChequera as numeroChequera
                From Chequeras chq Inner Join CuentasBancarias ctas
                On chq.NumeroCuenta = ctas.CuentaInterna
                Where chq.Generica = 1 And chq.Activa = 1 And ctas.Cia = ?
               `;

       response = null;
       response = Async.runSync(function(done) {
           sequelize.query(query, { replacements: [ pago.cia ], type: sequelize.QueryTypes.SELECT })
               .then(function(result) { done(null, result); })
               .catch(function (err) { done(err, null); })
               .done();
       })

       if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
       }

       if (response.result.length == 0) {
           let message = `Error: no existe una chequera <em>genérica</em> para asignar al nuevo movimiento bancario.<br />
                         Por favor revise esta situación y corríjala antes de intentar ejecutar esta función para el pago.<br />
                         Debe existir, al menos, una chequera <em>genérica</em> registrada; además, debe estar <em>activa</em>.
                        `;

           return { error: true, message: message };
       }

       let chequeraGenerica = response.result[0];

       // crear un registro para agregar el movimiento bancario
       // el signo y el monto dependen del tipo de pago: mi/su
       let movimientoBancario = {
           transaccion: 9999,
           tipo: 'TR',
           fecha: pago.fecha,
           provClte: pago.proveedor,
           beneficiario: pago.beneficiario,
           concepto: pago.concepto,
           signo: pago.miSuFlag === 1 ? false : true,       // miSuFlag -> 1: pago a prov / 2: cobro a clientes
           montoBase: pago.miSuFlag === 1 ? (pago.monto * -1) : pago.monto,
           monto: pago.miSuFlag === 1 ? (pago.monto * -1) : pago.monto,
           ingreso: new Date(),
           ultMod: new Date,
           usuario: currentUser.emails[0].address,
           claveUnicaChequera: chequeraGenerica.numeroChequera,
           pagoID: pagoID,
       };

       // TODO: agregar el movimiento bancario a sql server
       movimientoBancario.fecha = moment(movimientoBancario.fecha).subtract(TimeOffset, 'hours').toDate();
       movimientoBancario.ingreso = moment(movimientoBancario.ingreso).subtract(TimeOffset, 'hours').toDate();
       movimientoBancario.ultMod = moment(movimientoBancario.ultMod).subtract(TimeOffset, 'hours').toDate();

       response = Async.runSync(function(done) {
           MovimientosBancarios_sql.create(movimientoBancario)
               .then(function(result) { done(null, result); })
               .catch(function (err) { done(err, null); })
               .done();
       })

       if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
       }

       // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
       let savedItem = response.result.dataValues;
       movimientoBancario.claveUnica = savedItem.claveUnica;

       return {
           error: false,
           message: "Ok, el movimiento bancario ha sido agregado ... ",
           pk: movimientoBancario.claveUnica,
       }
   }
})
