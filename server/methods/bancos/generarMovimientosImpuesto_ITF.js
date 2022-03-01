

import moment from 'moment'; 
import numeral from 'numeral'; 

import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    // movimientosSeleccionados contiene los _ids de los movimientos 'marcados' por el usuario
    bancos_itf_generarMovimientosITF: function (movimientosSeleccionados) {

        // debugger;

        // lo primero que hacemos es leer el porcentaje de itf, en parametros global bancos ...

        let parametrosGlobalBancos = ParametrosGlobalBancos.findOne();

        if (!parametrosGlobalBancos || !parametrosGlobalBancos.porcentajeITF)
            throw new Meteor.Error("ITF%-indefinido", "Error: Ud. debe registrar un porcentaje de itf en <em>Parámetros Global (bancos)</em>.");

        // más adelante vamos a actualizar este field en los movimientos bancarios que corresponden al usuario; lo limpiamos para todos aquí ...
        // guao, pareciera que el $unset no funciona en Meteor (???!!!)
        // MovimientosBancarios.update({ user: this.userId }, { $unset: { agregarITF: "" }});
        MovimientosBancarios.update({ user: this.userId, agregarITF: true }, { $set: { agregarITF: false }});

        // leemos los movimientos que corresponden al usuario y generamos un movimiento itf para cada movimiento ...
        let cantidadMovimientosBancarios = 0;
        let cantidadMovimientosBancariosConITF = 0;
        let cantidadMovimientosITFAgregados = 0;

        let userID = this.userId;

        // nótese como los movimientos para los cuales se debe generar ITF fueron 'marcados' antes ...

        MovimientosBancarios.find({ user: this.userId, _id: { $in: movimientosSeleccionados } }).forEach( (movimiento) => {

            // el movimiento puede ya tener un itf; de ser así, descartamos ...
            let movimientoITF = MovimientosBancarios.findOne({
                user: userID,
                tipo: { $eq: 'IT' },
                transaccion: movimiento.transaccion });

            if (!movimientoITF) {
                // ---------------------------------------------------------------------------------------------------------------
                // leemos la cuenta bancaria para el movimiento; luego, la chequera 'genérica' de esta cuenta
                let response = null;
                response = Async.runSync(function(done) {
                    MovimientosBancarios_sql.findAll({ where: { claveUnica: movimiento.claveUnica },
                        attributes: [ 'claveUnica', 'transaccion', 'fecha', 'monto' ],
                        include: [
                            { model: Chequeras_sql,
                              attributes: [ 'id' ],
                              as: 'chequera',
                              include: [
                                  { model: CuentasBancarias_sql,
                                    attributes: [ 'id', 'cuentaBancaria' ],
                                    as: 'cuentaBancaria' }] },
                        ],
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                let cuentaBancaria = response.result[0].dataValues.chequera.cuentaBancaria.dataValues;
                // ---------------------------------------------------------------------------------------------------------------

                // leemos la chequera 'genérica' para la cuenta bancaria; luego usar su pk en el movimiento abajo ...
                // attributes: ['id'],      // TODO: luego, cuando veamos el contenido del object ...
                // NOTA: aparentemente, 'findOne' genera un sql select que sql server no entiende (???)
                response = Async.runSync(function(done) {
                    Chequeras_sql.findAndCountAll({
                        where: { numeroCuenta: cuentaBancaria.id, generica: true },
                        attributes: [ 'id' ],
                    })
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                if (response.result.count == 0)
                    throw new Meteor.Error("cuenta-bancaria-sin-chequera-generica",
                        `Error: aparentemente, la cuenta bancaria ${cuentaBancaria.cuentaBancaria} no tiene una <em>chequera genérica</em> registrada. `);

                let chequeraGenerica = response.result.rows[0].dataValues;


                let movimientoBancario = {
                    _id: new Mongo.ObjectID()._str,
                    transaccion: movimiento.transaccion,
                    tipo: "IT",
                    fecha: movimiento.fecha,
                    provClte: null,
                    beneficiario: "Tesorería Nacional",
                    concepto: `Impuesto transacciones financieras - por monto ${numeral(movimiento.monto).format("0,0.00")}`,

                    signo: false,               // nota: el signo puede ser: null, false (negativo), true (positivo)
                    montoBase: null,
                    comision: null,
                    impuestos: null,

                    monto: movimiento.monto * parametrosGlobalBancos.porcentajeITF / 100,
                    ingreso: new Date(),
                    ultMod: new Date(),
                    usuario: Meteor.user().emails[0].address,
                    claveUnica: null,       // un mov banc que no se ha grabado en sql no tiene pk; es requiered en sql server, no en mongo
                    claveUnicaChequera: chequeraGenerica.id,
                    fechaEntregado: null,
                    user: userID,
                    docState: 1,            // para mostrar en la lista como nuevo y luego agregar solo éstos a sql server

                    agregarITF: true,
                    banco: movimiento.banco,                        // redundante; solo para mostrar fácilmente al usuario
                    cuentaBancaria: movimiento.cuentaBancaria,      // redundante; solo para mostrar fácilmente al usuario
                };

                MovimientosBancarios.insert(movimientoBancario);
                cantidadMovimientosITFAgregados++;
            }
            else {
                cantidadMovimientosBancariosConITF++;
            };

            cantidadMovimientosBancarios++;
        });

        return `Ok, los movimientos del tipo ITF han sido construidos. <br /><br />
            En general, <b>se han leído ${cantidadMovimientosBancarios} movimientos bancarios, 'marcados' para generar 'ITF'.</b><br />
            <b>${cantidadMovimientosITFAgregados}</b> movimientos del tipo 'ITF' han sido agregados, para movimientos 'marcados' para ello.<br />
            <b>${cantidadMovimientosBancariosConITF}</b> movimientos 'marcados' ya tenían un registro ITF y fueron obviados.
            `
        ;
    }
});
