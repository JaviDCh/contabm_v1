
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    pagosSave: function (pago, fechaOriginal, ciaContabID) {

        new SimpleSchema({
            pago: { type: Object, blackbox: true, optional: false, },
            fechaOriginal: { type: Date, optional: true, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ pago, fechaOriginal, ciaContabID, });

        if (!pago || !pago.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        // un pago con con registros en dPagos no puede ser eliminado
        if (pago.docState === 3) {
            let pagoAplicado = validarPagoAplicado(pago.claveUnica);

            if (pagoAplicado.error) {
                return {
                    error: true,
                    message: pagoAplicado.message,
                }
            }
        }

        // si el pago es modificado, esta función valida *también* la fecha original del mismo
        let validarUMCBancos = validarUMC_Bancos(pago.docState,
                                                 pago.fecha,
                                                 fechaOriginal,
                                                 ciaContabID);

        if (validarUMCBancos.error) {
            return {
                error: true,
                message: validarUMCBancos.message,
            }
        }


        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = pago.docState;

        if (pago.docState == 1) {
            delete pago.docState;

            let pago_sql = _.clone(pago);
            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            pago_sql.fecha = pago_sql.fecha ? moment(pago_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;
            pago_sql.ingreso = pago_sql.ingreso ? moment(pago_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;
            pago_sql.ultAct = pago_sql.ultAct ? moment(pago_sql.ultAct).subtract(TimeOffset, 'hours').toDate() : null;

            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes;
            // ej: _id, arrays de faltas y sueldos, etc.
            response = Async.runSync(function(done) {
                Pagos_sql.create(pago_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            pago.claveUnica = savedItem.claveUnica;
        };


        if (pago.docState == 2) {
            delete pago.docState;

            let pago_sql = _.clone(pago);

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            pago_sql.fecha = pago_sql.fecha ? moment(pago_sql.fecha).subtract(TimeOffset, 'hours').toDate() : null;
            pago_sql.ingreso = pago_sql.ingreso ? moment(pago_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;

            let usuario = Meteor.users.findOne(this.userId);
            pago_sql.ultAct = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            pago_sql.usuario = usuario.emails[0].address;

            response = Async.runSync(function(done) {
                Pagos_sql.update(pago_sql, {
                        where: { claveUnica: pago_sql.claveUnica
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        };


        if (pago.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                Pagos_sql.destroy({ where: { claveUnica: pago.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        };

        let tempPago = null;

        if (docState != 3) {
            // leemos nuevamente para actualizar el collection 'temp' en mongo; la idea es que el
            // registro *también* se actualize (modifique/agregue) en la lista (ie: filter --> lista) ...
            let query = `Select p.ClaveUnica as claveUnica, p.NumeroPago as numeroPago,
                        p.Fecha as fecha,
                	    prov.Abreviatura as nombreCompania, m.Simbolo as simboloMoneda,
                        p.Concepto as concepto,
                	    Case p.MiSuFlag When 1 Then 'Mi' When 2 Then 'Su' Else 'Indef' End As miSuFlag,
                        p.Monto as monto
                        From Pagos p Inner Join Proveedores prov on p.Proveedor = prov.Proveedor
                        Inner Join Monedas m on p.Moneda = m.Moneda
                        Where p.ClaveUnica = ?
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ pago.claveUnica, ],
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            tempPago = _.isArray(response.result) && response.result.length ? response.result[0] : null;

            tempPago._id = new Mongo.ObjectID()._str;
            tempPago.user = Meteor.userId();

            // al leer de sql, sequelize intenta 'localizar' los dates; como sequelize resta el offset
            // para localizar, nosotros lo sumamos para contrarestar este efecto
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            tempPago.fecha = tempPago.fecha ? moment(tempPago.fecha).add(TimeOffset, 'hours').toDate() : null;
        };


        if (docState == 1) {
            Temp_Consulta_Bancos_Pagos.insert(tempPago, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            })
        }
        else if (docState == 2) {
            delete tempPago._id;
            Temp_Consulta_Bancos_Pagos.update(
                { claveUnica: tempPago.claveUnica, user: this.userId, },
                { $set: tempPago },
                { multi: false, upsert: false },
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
                });
        }
        else if (docState == 3) {
            // eliminamos el movimiento en mongo, para que se elimine de la lista (en filter --> list ...)
            Temp_Consulta_Bancos_Pagos.remove({
                user: this.userId,
                claveUnica: pago.claveUnica
            });

            // ponemos el pk en -999 para que la página se refresque para el usuario y no se lea nada (desde sql)
            pago.claveUnica = -999;
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: pago.claveUnica.toString(),
        };
    }
});


function validarUMC_Bancos (docState,
                            fecha,
                            fechaOriginal,
                            ciaContabID) {

    if (docState != 1) {
        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaOriginal, ciaContabID);

        if (validarMesCerradoEnBancos.error) {
            // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
            let errorMessage = ` Error: la fecha del pago
                                 (${moment(fechaOriginal).format('DD-MM-YYYY')}) corresponde
                                 a un mes ya cerrado en Bancos.
                               `;
            return {
                error: true,
                message: errorMessage
            };
        };
    };

    // arriba validamos las fechas 'originales' cuando el usuario modifica; ahora validamos las fechas indicadas
    // para la pago, al agregar o modificar
    let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fecha, ciaContabID);

    if (validarMesCerradoEnBancos.error) {
        // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
        let errorMessage = ` Error: la fecha del pago
                             (${moment(fecha).format('DD-MM-YYYY')}) corresponde
                             a un mes ya cerrado en Bancos.
                           `;
        return {
            error: true,
            message: errorMessage
        };
    };

    return {
        error: false
    };
};


function validarPagoAplicado(claveUnicaPago) {

    // el usuario no puede eliminar un pago aplicado; es decir, con registros en dPagos.
    // debe revertirlo antes ...
    let query = `Select Count(*) as contaPagos From dPagos d
                 Where d.ClaveUnicaPago = ?
                 `;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ claveUnicaPago ],
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (response.result && response.result.length) {
        let contaPagos = response.result[0].contaPagos;
        if (contaPagos) {
            let errorMessage = ` Error: el pago ha sido <b><em>aplicado</em></b>.
                                 Es decir, se han asociado facturas al mismo.<br />
                                 Ud. debe <em>revertirlo</em> antes de intentar eliminarlo.
                               `;
            return {
                error: true,
                message: errorMessage
            };
        }
    }

    return {
        error: false
    }
}
