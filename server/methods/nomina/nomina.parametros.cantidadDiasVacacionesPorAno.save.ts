

import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import * as lodash from 'lodash'; 
import { VacacPorAnoGenericas_sql, VacacPorAnoParticulares_sql } from '../../../server/imports/sqlModels/nomina/parametros/cantidadDiasVacacionesPorAno'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 

Meteor.methods(
{
    'nomina.parametros.cantidadDiasVacacionesPorAno.save': function (items, items2) {

        // recibimos los cambios (ediciones) a las tablas de definción de anticipo, en los arrays items y items2. Nótese que existe 
        // una relación de 1 a muchos entre ambas tablas ... 
        if ((!lodash.isArray(items) || items.length == 0) && (!lodash.isArray(items2) || items2.length == 0)) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        actualizar_cantidadDiasVacacionesGenericas(items); 
        actualizar_cantidadDiasVacacionesEmpleado(items2); 

        return "Ok, los registros han sido actualizados en la base de datos.";
    }
})


function actualizar_cantidadDiasVacacionesGenericas(items) {

    var inserts = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 1; }).
        map(function (item) { delete item.docState; return item; }).
        value();


    inserts.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            VacacPorAnoGenericas_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;
    })


    var updates = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 2; }).
        map(function (item) { delete item.docState; return item; }).                       // eliminamos docState del objeto
        map(function (item) { return { claveUnica: item.claveUnica, object: item }; }).    // separamos el _id del objeto
        map(function (item) { delete item.object.claveUnica; return item; }).              // eliminamos _id del objeto (arriba lo separamos)
        value();

    updates.forEach(function (item) {

        let response: any = null;

        // actualizamos el registro en sql ...
        response = Async.runSync(function (done) {
            VacacPorAnoGenericas_sql.update(item.object, { where: { claveUnica: item.claveUnica } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })

    var removes = lodash(items).filter((item: any) => { return item.docState && item.docState == 3; }).value();

    removes.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            VacacPorAnoGenericas_sql.destroy({ where: { claveUnica: item.claveUnica } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })
}




function actualizar_cantidadDiasVacacionesEmpleado(items) {

    var inserts = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 1; }).
        map(function (item) { delete item.docState; return item; }).
        value();


    inserts.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            VacacPorAnoParticulares_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;
    })


    var updates = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 2; }).
        map(function (item) { delete item.docState; return item; }).                       // eliminamos docState del objeto
        map(function (item) { return { claveUnica: item.claveUnica, object: item }; }).    // separamos el _id del objeto
        map(function (item) { delete item.object.claveUnica; return item; }).              // eliminamos _id del objeto (arriba lo separamos)
        value();

    updates.forEach(function (item) {

        let response: any = null;

        // actualizamos el registro en sql ...
        response = Async.runSync(function (done) {
            VacacPorAnoParticulares_sql.update(item.object, { where: { claveUnica: item.claveUnica } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })

    var removes = lodash(items).filter((item: any) => { return item.docState && item.docState == 3; }).value();

    removes.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            VacacPorAnoParticulares_sql.destroy({ where: { claveUnica: item.claveUnica } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })
}