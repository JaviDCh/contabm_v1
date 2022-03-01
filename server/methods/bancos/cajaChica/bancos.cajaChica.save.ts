

import { sequelize } from '../../../sqlModels/_globals/_loadThisFirst/_globals';
import * as moment from 'moment';
import * as lodash from 'lodash';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '../../../../globals/globals'; 

import { CajaChica_Reposiciones_sql, CajaChica_Reposiciones_Gastos_sql } from '../../../imports/sqlModels/bancos/cajasChicas'; 

Meteor.methods(
{
    'bancos.cajaChica.save': function (reposicion) {

        new SimpleSchema({
            reposicion: { type: Object, blackbox: true, optional: false, },
        }).validate({ reposicion, });

        if (!reposicion || !reposicion.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        }

        let usuario = Meteor.users.findOne(Meteor.userId());

        // algunos valores son opcionales; sin embargo, si vienen en '' la validación va a fallar. Ponemos en Nulls 
        if (reposicion.observaciones && reposicion.observaciones === '') { 
            reposicion.observaciones = null; 
        }

        reposicion.cajaChica_reposicion_gastos.forEach((g) => { 
            g.numeroDocumento = g.numeroDocumento === '' ? null : g.numeroDocumento; 
            g.numeroControl = g.numeroControl === '' ? null : g.numeroControl; 
            g.nombre = g.nombre === '' ? null : g.nombre; 
            g.rif = g.rif === '' ? null : g.rif; 
        })


        if (reposicion.docState == 1) {
            delete reposicion.docState;

            if (!Array.isArray(reposicion.cajaChica_reposicion_gastos)) { 
                reposicion.cajaChica_reposicion_gastos = [];
            }
                
            reposicion.cajaChica_reposicion_gastos.forEach((x) => { delete x.docState; });

            // ------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc (es decir, las globaliza); nuestro offset
            // en ccs es -4.00; sequelize va a sumar 4.0 para llevar a utc; restamos 4.0 para eliminar
            // este efecto ...
            reposicion.fecha = reposicion.fecha ? moment(reposicion.fecha).subtract(TimeOffset, 'hours').toDate() : null;
            
            reposicion.cajaChica_reposicion_gastos.forEach((x) => {
                x.fechaDocumento = x.fechaDocumento ? moment(x.fechaDocumento).subtract(TimeOffset, 'hours').toDate() : null;
            })

            let response: any = null; 

            response = Async.runSync(function(done) {
                CajaChica_Reposiciones_sql.create(reposicion)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            reposicion.reposicion = savedItem.reposicion;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos el array de gastos
            reposicion.cajaChica_reposicion_gastos.forEach((gasto) => {
                gasto.reposicion = savedItem.reposicion;
                gasto.id = 0; 

                response = Async.runSync(function(done) {
                    CajaChica_Reposiciones_Gastos_sql.create(gasto)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })
        }


        if (reposicion.docState == 2) {
            delete reposicion.docState;

            reposicion.fecha = reposicion.fecha ? moment(reposicion.fecha).subtract(TimeOffset, 'hours').toDate() : null;

            reposicion.cajaChica_reposicion_gastos.forEach((x) => {
                x.fechaDocumento = x.fechaDocumento ? moment(x.fechaDocumento).subtract(TimeOffset, 'hours').toDate() : null;
            })

            let response: any = null; 

            response = Async.runSync(function(done) {
                CajaChica_Reposiciones_sql.update(reposicion, {
                        where: { reposicion: reposicion.reposicion
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // ---------------------------------------------------------------------
            // recorremos los items que el usuario editó en el array; agregamos de
            // acuerdo a 'docState' ...
            if (!Array.isArray(reposicion.cajaChica_reposicion_gastos)) { 
                reposicion.cajaChica_reposicion_gastos = [];
            }

            lodash(reposicion.cajaChica_reposicion_gastos).filter((x: any) => { return x.docState; }).forEach((x: any) => {
                response = null;

                if (x.docState == 1) {
                    x.id = 0;               // identity; sql lo calculará en forma automática 
                    response = Async.runSync(function(done) {
                        CajaChica_Reposiciones_Gastos_sql.create(x)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }
                else if (x.docState == 2) {
                    response = Async.runSync(function(done) {
                        CajaChica_Reposiciones_Gastos_sql.update(x, { where: { id: x.id, }})
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }
                else if (x.docState == 3) {
                    response = Async.runSync(function(done) {
                        CajaChica_Reposiciones_Gastos_sql.destroy({ where: { id: x.id, } })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    })
                }

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })
        }


        if (reposicion.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            let response: any = null; 
            response = Async.runSync(function(done) {
                CajaChica_Reposiciones_sql.destroy({ where: { reposicion: reposicion.reposicion } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        if (reposicion && reposicion.docState && reposicion.docState === 3) {
            // ponemos el pk en -999 para que la página se refresque para el usuario y no se lea nada (desde sql)
            reposicion.reposicion = -999;
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: reposicion.reposicion,
        };
    }
})