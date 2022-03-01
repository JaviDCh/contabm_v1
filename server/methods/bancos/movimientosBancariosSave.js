
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    movimientosBancariosSave: function (movimientoBancario, fechaOriginalMovimientoBancario, ciaContab) {

        new SimpleSchema({
            movimientoBancario: { type: Object, blackbox: true, optional: false, },
            fechaOriginalMovimientoBancario: { type: Date, optional: true, },
            ciaContab: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ movimientoBancario, fechaOriginalMovimientoBancario, ciaContab, });

        if (!movimientoBancario || !movimientoBancario.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        if (fechaOriginalMovimientoBancario) {
            // el usuario puede cambiar la fecha de un movimiento, por eso validamos el mes cerrado
            let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaOriginalMovimientoBancario, ciaContab);

            if (validarMesCerradoEnBancos.error)
                return { error: true, message: validarMesCerradoEnBancos.errMessage };
        }


        // ---------------------------------------------------------------------------------------------
        // validamos que la fecha no corresponda a un mes ya cerrado en Bancos ...
        if (!movimientoBancario.fecha) {
            return { error: true, message: 'Error: El movimiento bancario debe tener una fecha.' };
        }

        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(movimientoBancario.fecha, ciaContab);
        if (validarMesCerradoEnBancos.error) { 
            return { error: true, message: validarMesCerradoEnBancos.errMessage };
        }
        // ---------------------------------------------------------------------------------------------


        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = movimientoBancario.docState;

        if (movimientoBancario.docState == 1) {
            delete movimientoBancario.docState;

            // ---------------------------------------------------------------------------------
            // validamos que no se haya registrado un cheque con ese número antes ...
            let query = `Select Count(*) as contaCheques From MovimientosBancarios
                         Where ClaveUnicaChequera = ? And
                         Transaccion = ?`;

            let response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ movimientoBancario.claveUnicaChequera, movimientoBancario.transaccion ],
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            let cantidadChequesUsados = response.result[0].contaCheques;

            if (cantidadChequesUsados) { 
                return {
                    error: true,
                    message: `Error: ya existe un movimiento bancario con ese número y para esa chequera.
                              Por favor revise.`
                };
            }
                
            // ----------------------------------------------------------------------------------------
            let movimientoBancario_sql = _.clone(movimientoBancario);

            // ------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc (es decir, las globaliza); nuestro offset
            // en ccs es -4.00; sequelize va a sumar 4.0 para llevar a utc; restamos 4.0 para eliminar
            // este efecto ...
            movimientoBancario_sql.fecha = movimientoBancario_sql.fecha ? moment(movimientoBancario_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;
            movimientoBancario_sql.fechaEntregado = movimientoBancario_sql.fechaEntregado ? moment(movimientoBancario_sql.fechaEntregado).subtract(TimeOffset, 'hours').toDate() : null;
            movimientoBancario_sql.ingreso = movimientoBancario_sql.ingreso ? moment(movimientoBancario_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;

            let usuario = Meteor.users.findOne(this.userId);
            movimientoBancario_sql.ultMod = movimientoBancario_sql.ultMod ? moment(movimientoBancario_sql.ultMod).subtract(TimeOffset, 'hours').toDate() : null;
            movimientoBancario_sql.usuario = usuario.emails[0].address;

            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes;
            // ej: _id, arrays de faltas y sueldos, etc.
            response = Async.runSync(function(done) {
                MovimientosBancarios_sql.create(movimientoBancario_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            movimientoBancario.claveUnica = savedItem.claveUnica;
        };


        if (movimientoBancario.docState == 2) {
            delete movimientoBancario.docState;

            // -------------------------------------------------------------------------------------------------------------------------
            // ahora actualizamos el asiento contable; nótese como usamos el mismo objeto; sequelize ignora algunos fields que no
            // existan en el modelo ...

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            let movimientoBancario_sql = _.clone(movimientoBancario);

            movimientoBancario_sql.fecha = movimientoBancario_sql.fecha ? moment(movimientoBancario_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;
            movimientoBancario_sql.fechaEntregado = movimientoBancario_sql.fechaEntregado ? moment(movimientoBancario_sql.fechaEntregado).subtract(TimeOffset, 'hours').toDate() : null;
            movimientoBancario_sql.ingreso = movimientoBancario_sql.ingreso ? moment(movimientoBancario_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;

            let usuario = Meteor.users.findOne(this.userId);
            movimientoBancario_sql.ultMod = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            movimientoBancario_sql.usuario = usuario.emails[0].address;

            response = Async.runSync(function(done) {
                MovimientosBancarios_sql.update(movimientoBancario_sql, {
                        where: { claveUnica: movimientoBancario_sql.claveUnica
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        };


        if (movimientoBancario.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                MovimientosBancarios_sql.destroy({ where: { claveUnica: movimientoBancario.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        };

        let tempMovimientoBancario = null;

        if (docState != 3) {
            // leemos nuevamente para actualizar el collection 'temp' en mongo; la idea es que el
            // registro *también* se actualize (modifique/agregue) en la lista (ie: filter --> lista) ...
            let where = `ClaveUnica = ${movimientoBancario.claveUnica}`;

            let query = `Select mb.Transaccion as transaccion, mb.Tipo as tipo, mb.Fecha as fecha,
                        b.Abreviatura as banco, cb.CuentaBancaria as cuentaBancaria, mo.Simbolo as moneda,
                        mb.Beneficiario as beneficiario, mb.Concepto as concepto, mb.Monto as monto,
                        mb.FechaEntregado as fechaEntregado, mb.ClaveUnica as claveUnica,
                        cb.Cia as cia, mb.Usuario as usuario
                        From MovimientosBancarios mb  Inner Join Chequeras ch On mb.ClaveUnicaChequera = ch.NumeroChequera
                        Inner Join CuentasBancarias cb On ch.NumeroCuenta = cb.CuentaInterna
                        Inner Join Agencias a On cb.Agencia = a.Agencia
                        Inner Join Bancos b On a.Banco = b.Banco
                        Inner Join Monedas mo On cb.Moneda = mo.Moneda
                        Where ${where}
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            tempMovimientoBancario = _.isArray(response.result) && response.result.length ? response.result[0] : null;


            tempMovimientoBancario._id = new Mongo.ObjectID()._str;
            tempMovimientoBancario.user = Meteor.userId();

            // al leer de sql, sequelize intenta 'localizar' los dates; como sequelize resta el offset
            // para localizar, nosotros lo sumamos para contrarestar este efecto
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            tempMovimientoBancario.fecha = tempMovimientoBancario.fecha ? moment(tempMovimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
            tempMovimientoBancario.fechaEntregado = tempMovimientoBancario.fechaEntregado ? moment(tempMovimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
        };


        if (docState == 1) {
            Temp_Consulta_Bancos_MovimientosBancarios.insert(tempMovimientoBancario, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            });
        }
        else if (docState == 2) {
            delete tempMovimientoBancario._id;
            Temp_Consulta_Bancos_MovimientosBancarios.update(
                { claveUnica: tempMovimientoBancario.claveUnica, user: this.userId, },
                { $set: tempMovimientoBancario },
                { multi: false, upsert: false },
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
                });
        }
        else if (docState == 3) {
            // eliminamos el movimiento en mongo, para que se elimine de la lista
            // (en filter --> list ...)
            Temp_Consulta_Bancos_MovimientosBancarios.remove({
                user: this.userId,
                claveUnica: movimientoBancario.claveUnica
            });
        };


        // ---------------------------------------------------------------------------------
        // finalmente, actualizamos la chequera solo si el movimiento bancario es un cheque ...
        if (movimientoBancario.tipo === "CH") {
            let actualizarChequera = BancosFunctions.actualizarChequera(movimientoBancario.claveUnicaChequera);
            if (actualizarChequera.error)
                return { error: true, message: actualizarChequera.errMessage };
        };


        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: movimientoBancario.claveUnica.toString()
        };
    }
});
