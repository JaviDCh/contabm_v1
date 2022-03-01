

import moment from 'moment'; 
import lodash from 'lodash'; 
import { TimeOffset } from '/globals/globals'; 

import { Chequeras } from '/imports/collections/bancos/chequeras'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    'bancos.chequerasSave': function (items) {

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error(`Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.`);
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {

            // las chequeras no genéricas deben siempre traer el rango de cheques
            if (!item.generica && (!item.desde || !item.hasta)) {
                throw new Meteor.Error(`Error: Ud. debe indicar el rango de los cheques de la chequera, pues la misma no es genérica.
                                       `);
            }

            let response = null;

            if (item.generica) {
                // debe haber una sola chequera genérica por cuenta bancaria ...
                response = Async.runSync(function(done) {
                    Chequeras_sql.count({ where: { numeroCuenta: item.numeroCuenta, generica: true, }})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
                    
                if (response.result) {
                    throw new Meteor.Error(`Error: ya existe una chequera <b>genérica</b> para esta cuenta bancaria.<br />
                                            Una cuenta bancaria debe tener solo una chequera del tipo <b>genérica</b>.<br />
                                            Por favor revise.`);
                }
            }

            let usuario = Meteor.user();

            item.fechaAsignacion = moment(item.fechaAsignacion).subtract(TimeOffset, 'hours').toDate();
            item.usuario = usuario.emails[0].address;
            item.ingreso = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            item.ultAct = moment(new Date()).subtract(TimeOffset, 'hours').toDate();

            if (item.generica) {
                item.desde = null;
                item.hasta = null;
                item.agotadaFlag = null;
                item.cantidadDeChequesUsados = null;
                item.ultimoChequeUsado = null;
                item.cantidadDeCheques = null;
            } else {
                item.agotadaFlag = false;
                item.cantidadDeChequesUsados = 0;
                item.ultimoChequeUsado = null;
                item.cantidadDeCheques = item.hasta - item.desde + 1;
            }

            let item_sql = lodash.clone(item);
            delete item_sql._id; 

            response = Async.runSync(function(done) {
                Chequeras_sql.create(item_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            // recuperamos el id (pk) del item; pues se le asignó un valor en sql (la columna es Identity)...
            item.numeroChequera = savedItem.id;
            Chequeras.insert(item, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });
        });


        var updates = lodash.chain(items).
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { _id: item._id, object: item }; }).           // separamos el _id del objeto
                        map(function (item) { delete item.object._id; return item; }).             // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response = null;

            if (item.object.generica) {
                // debe haber una sola chequera genérica por cuenta bancaria ...
                response = Async.runSync(function(done) {
                    Chequeras_sql.count({ where: { id: { $ne: item.object.numeroChequera },
                                                         numeroCuenta: item.object.numeroCuenta,
                                                         generica: true, }})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }

                if (response.result) {
                    throw new Meteor.Error(`Error: ya existe una chequera <b>genérica</b> para esta cuenta bancaria.<br />
                                            Una cuenta bancaria debe tener solo una chequera del tipo <b>genérica</b>.<br />
                                            Por favor revise.`);
                }
            }

            if (item.object.generica) {
                // una chequera de tipo genérico no debe tener valores en estos fields
                item.object.agotadaFlag = null;
                item.object.cantidadDeChequesUsados = null;
                item.object.cantidadDeCheques = null;
                item.object.ultimoChequeUsado = null;
                item.object.desde = null;
                item.object.hasta = null;
            }

            if (!item.object.generica) {
                // una chequera de tipo no genérico (real) debe tener valores en estos fields
                if (!item.object.fechaAsignacion || !item.object.desde || !item.object.hasta || !item.object.asignadaA) {
                    throw new Meteor.Error(`Error: la chequera <b>${item.object.numeroChequera.toString()}</b> debe tener valores en
                                            los campos: 'fecha de asignación', 'desde', 'hasta' y 'asignada a', pues
                                            <b>no es del tipo genérica</b>.`);
                }
            }

            let item_sql = lodash.clone(item.object);
            delete item_sql._id;

            if (item_sql.fechaAsignacion) {
                item_sql.fechaAsignacion = moment(item_sql.fechaAsignacion).subtract(TimeOffset, 'hours').toDate();
            }

            let usuario = Meteor.user();
            item_sql.ultAct = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            item_sql.usuario = usuario.emails[0].address;

            response = Async.runSync(function(done) {
                Chequeras_sql.update(item_sql, { where: { id: item.object.numeroChequera }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }


            Chequeras.update({ _id: item._id }, { $set: item.object }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            });
        })


        // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
        // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
        // (y validamos) primero la cuenta 50101001 y luego 50101 ...
        var removes = lodash(items).
                      filter((item) => { return item.docState && item.docState == 3; }).
                      orderBy(['numNiveles'], ['desc']).
                      value();

        removes.forEach(function (item) {

            let response = null;

            // el usaurio no debe eliminar chequeras con movimientos bancarios asociados
            response = Async.runSync(function(done) {
                MovimientosBancarios_sql.count({ where: { claveUnicaChequera: item.numeroChequera }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            if (response.result.length) {
                throw new Meteor.Error(`Error: la chequera <b>${item.numeroChequera.toString()}</b> tiene movimientos
                                        bancarios asociados; no puede ser eliminada.`);
            }
                
            // finalmente, si la chequera no falla las validaciones, la eliminamos ...
            response = Async.runSync(function(done) {
                Chequeras_sql.destroy({ where: { id: item.numeroChequera }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            Chequeras.remove({ _id: item._id });
        })

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
