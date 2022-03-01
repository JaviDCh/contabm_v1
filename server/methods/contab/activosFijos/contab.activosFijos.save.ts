

import { sequelize } from '../../../sqlModels/_globals/_loadThisFirst/_globals';
import * as moment from 'moment';
import * as lodash from 'lodash';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '../../../../globals/globals'; 

import { InventarioActivosFijos_sql } from '../../../imports/sqlModels/contab/inventarioActivosFijos'; 

Meteor.methods(
{
    'contab.activosFijos.save': function (activoFijo) {

        new SimpleSchema({
            activoFijo: { type: Object, blackbox: true, optional: false, },
        }).validate({ activoFijo, });

        if (!activoFijo || !activoFijo.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la página. No hay nada que actualizar.");
        }

        let usuario = Meteor.users.findOne(Meteor.userId());

        if (activoFijo.docState == 1) {
            delete activoFijo.docState;

            activoFijo.ingreso = new Date(); 
            activoFijo.ultAct = new Date(); 

            activoFijo.fechaCompra = activoFijo.fechaCompra ? moment(activoFijo.fechaCompra).subtract(TimeOffset, 'hours').toDate() : null;
            activoFijo.fechaDesincorporacion = activoFijo.fechaDesincorporacion ? moment(activoFijo.fechaDesincorporacion).subtract(TimeOffset, 'hours').toDate() : null;
            activoFijo.ingreso = moment(activoFijo.ingreso).subtract(TimeOffset, 'hours').toDate();
            activoFijo.ultAct = moment(activoFijo.ultAct).subtract(TimeOffset, 'hours').toDate();
            
            let response: any = null; 

            response = Async.runSync(function(done) {
                InventarioActivosFijos_sql.create(activoFijo)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            activoFijo.claveUnica = savedItem.claveUnica;
        }


        if (activoFijo.docState == 2) {
            delete activoFijo.docState;

            activoFijo.ultAct = new Date(); 

            activoFijo.fechaCompra = activoFijo.fechaCompra ? moment(activoFijo.fechaCompra).subtract(TimeOffset, 'hours').toDate() : null;
            activoFijo.fechaDesincorporacion = activoFijo.fechaDesincorporacion ? moment(activoFijo.fechaDesincorporacion).subtract(TimeOffset, 'hours').toDate() : null;
            activoFijo.ingreso = moment(activoFijo.ingreso).subtract(TimeOffset, 'hours').toDate();
            activoFijo.ultAct = moment(activoFijo.ultAct).subtract(TimeOffset, 'hours').toDate();

            let response: any = null; 

            response = Async.runSync(function(done) {
                InventarioActivosFijos_sql.update(activoFijo, {
                        where: { claveUnica: activoFijo.claveUnica
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }


        if (activoFijo.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            let response: any = null; 
            response = Async.runSync(function(done) {
                InventarioActivosFijos_sql.destroy({ where: { claveUnica: activoFijo.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        }

        if (activoFijo && activoFijo.docState && activoFijo.docState === 3) {
            // ponemos el pk en -999 para que la página se refresque para el usuario y no se lea nada (desde sql)
            activoFijo.claveUnica = -999;
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: activoFijo.claveUnica,
        };
    }
})