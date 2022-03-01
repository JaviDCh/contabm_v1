
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 
import { Proveedores_sql, Personas_sql } from '/server/imports/sqlModels/bancos/proveedores'; 

Meteor.methods(
{
    proveedoresSave: function (proveedor) {

        new SimpleSchema({
            proveedor: { type: Object, blackbox: true, optional: false, },
        }).validate({ proveedor, });

        if (!proveedor || !proveedor.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        };

        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = proveedor.docState;

        if (proveedor.docState == 1) {
            delete proveedor.docState;

            if (!_.isArray(proveedor.personas))
                proveedor.personas = [];

            proveedor.personas.forEach((x) => { delete x.docState; });
            // let proveedor = lodash.cloneDeep(proveedor);
            // ------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc (es decir, las globaliza); nuestro offset
            // en ccs es -4.00; sequelize va a sumar 4.0 para llevar a utc; restamos 4.0 para eliminar
            // este efecto ...
            proveedor.ingreso = proveedor.ingreso ? moment(proveedor.ingreso).subtract(TimeOffset, 'hours').toDate() : null;
            proveedor.ultAct = proveedor.ultAct ? moment(proveedor.ultAct).subtract(TimeOffset, 'hours').toDate() : null;

            proveedor.personas.forEach((x) => {
                x.ingreso = x.ingreso ? moment(x.ingreso).subtract(TimeOffset, 'hours').toDate() : null;
                x.ultAct = x.ultAct ? moment(x.ultAct).subtract(TimeOffset, 'hours').toDate() : null;
                x.usuario = usuario.emails[0].address;
            });

            response = Async.runSync(function(done) {
                Proveedores_sql.create(proveedor)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            proveedor.proveedor = savedItem.proveedor;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos el array de personas
            proveedor.personas.forEach((persona) => {
                persona.compania = savedItem.proveedor;
                delete persona.persona;

                response = Async.runSync(function(done) {
                    Personas_sql.create(persona)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            });

            // --------------------------------------------------------------------------------------------------------------------
            // actualizamos el proveedor en el collection en mongo, para que el usuario no tenga que hacer 'copiar catalogos'
            let document = {
                _id: new Mongo.ObjectID()._str,
                proveedor: proveedor.proveedor,
                nombre: proveedor.nombre,
                abreviatura: proveedor.abreviatura,
                rif: proveedor.rif ? proveedor.rif : 'Indefinido',
                beneficiario: proveedor.beneficiario ? proveedor.beneficiario : '',
                concepto: proveedor.concepto ? proveedor.concepto : '',
                montoCheque: proveedor.montoCheque ? proveedor.montoCheque : 0.00,
                monedaDefault: proveedor.monedaDefault,
                formaDePagoDefault: proveedor.formaDePagoDefault,
                tipo: proveedor.tipo,
                proveedorClienteFlag: proveedor.proveedorClienteFlag,
            };

            Proveedores.insert(document);
        };


        if (proveedor.docState == 2) {
            delete proveedor.docState;

            // let proveedor_sql = lodash.cloneDeep(proveedor);

            proveedor.ingreso = proveedor.ingreso ? moment(proveedor.ingreso).subtract(TimeOffset, 'hours').toDate() : null;

            proveedor.ultAct = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            proveedor.usuario = usuario.emails[0].address;

            proveedor.personas.forEach((x) => {
                x.ingreso = x.ingreso ? moment(x.ingreso).subtract(TimeOffset, 'hours').toDate() : null;
                x.ultAct = x.ultAct ? moment(x.ultAct).subtract(TimeOffset, 'hours').toDate() : null;
                x.usuario = usuario.emails[0].address;
            });

            response = Async.runSync(function(done) {
                Proveedores_sql.update(proveedor, {
                        where: { proveedor: proveedor.proveedor
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // ---------------------------------------------------------------------
            // recorremos los items que el usuario editó en el array; agregamos de
            // acuerdo a 'docState' ...
            if (!_.isArray(proveedor.personas))
                proveedor.personas = [];

            lodash(proveedor.personas).filter((x) => { return x.docState; }).forEach((x) => {
                let response = null;

                if (x.docState == 1) {
                    x.persona = 0;
                    response = Async.runSync(function(done) {
                        Personas_sql.create(x)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                }
                else if (x.docState == 2) {
                    response = Async.runSync(function(done) {
                        Personas_sql.update(x, { where: { persona: x.persona, }})
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                }
                else if (x.docState == 3) {
                    response = Async.runSync(function(done) {
                        Personas_sql.destroy({ where: { persona: x.persona, } })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                };

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            });

            // --------------------------------------------------------------------------------------------------------------------
            // actualizamos el proveedor en el collection en mongo, para que el usuario no tenga que hacer 'copiar catalogos'
            let document = {
                nombre: proveedor.nombre,
                abreviatura: proveedor.abreviatura,
                rif: proveedor.rif ? proveedor.rif : 'Indefinido',
                beneficiario: proveedor.beneficiario ? proveedor.beneficiario : '',
                concepto: proveedor.concepto ? proveedor.concepto : '',
                montoCheque: proveedor.montoCheque ? proveedor.montoCheque : 0.00,
                monedaDefault: proveedor.monedaDefault,
                formaDePagoDefault: proveedor.formaDePagoDefault,
                tipo: proveedor.tipo,
                proveedorClienteFlag: proveedor.proveedorClienteFlag,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            Proveedores.update({ proveedor: proveedor.proveedor }, { $set: document });
        };


        if (proveedor.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                Proveedores_sql.destroy({ where: { proveedor: proveedor.proveedor } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // eliminamos el proveedor del collection en mongo ...
            Proveedores.remove({ proveedor: proveedor.proveedor });
        };

        let tempProveedor = null;

        if (docState != 3) {
            // leemos nuevamente para actualizar el collection 'temp' en mongo; la idea es que el
            // registro *también* se actualize (modifique/agregue) en la lista (ie: filter --> lista) ...
            let where = `p.Proveedor = ${proveedor.proveedor}`;

            let query = `Select p.Proveedor as proveedor, p.Nombre as nombre, c.Descripcion as ciudad,
                         Case p.ProveedorClienteFlag When 1 Then 'Proveedor' When 2 Then 'Cliente' When 3 Then 'Ambos' When 4 Then 'Relacionado' Else 'Indefinido' End as proveedorCliente,
                         t.Descripcion as tipoProveedor, p.Rif as rif,
                         Case p.NacionalExtranjeroFlag When 1 Then 'Nacional' When 2 Then 'Extranjero' Else 'Indefinido' End as nacionalExtranjero,
                         Case p.NatJurFlag When 1 Then 'Natural' When 2 Then 'Juridico' Else 'Indefinido' End as naturalJuridico,
                         f.Descripcion as formaPago, p.Ingreso as ingreso, p.UltAct as ultAct, p.Usuario as usuario, p.Lote as numeroLote
                         From Proveedores p
                         Left Outer Join tCiudades c On p.Ciudad = c.Ciudad
                         Left Outer Join FormasDePago f On p.FormaDePagoDefault = f.FormaDePago
                         Inner Join TiposProveedor t On p.Tipo = t.Tipo
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

            tempProveedor = _.isArray(response.result) && response.result.length ? response.result[0] : null;

            tempProveedor._id = new Mongo.ObjectID()._str;
            tempProveedor.user = usuario._id;
        }

        // eliminamos el registro en mongo, para que se elimine de la lista (en filter --> list ...)
        Temp_Consulta_Bancos_Proveedores.remove({ proveedor: proveedor.proveedor, user: this.userId, });

        if (docState != 3) {
            Temp_Consulta_Bancos_Proveedores.insert(tempProveedor, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            })
        }
        else if (docState == 3) {
            // ponemos el pk en -999 para que la página se refresque para el usuario y no se lea nada (desde sql)
            proveedor.proveedor = -999;
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: proveedor.proveedor,
        };
    }
});
