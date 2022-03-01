

import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import * as lodash from 'lodash'; 
import { Nomina_DefinicionAnticipos_sql, Nomina_DefinicionAnticipos_Empleados_sql } from '../../../server/imports/sqlModels/nomina/parametros/definicionAnticipos1raQuincena'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'nomina.parametros.definicionAnticipos1raQuincena.save': function (items, items2) {

        // recibimos los cambios (ediciones) a las tablas de definción de anticipo, en los arrays items y items2. Nótese que existe 
        // una relación de 1 a muchos entre ambas tablas ... 
        if ((!lodash.isArray(items) || items.length == 0) && (!lodash.isArray(items2) || items2.length == 0)) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        actualizar_definicionAnticipos(items, items2); 
        actualizar_definicionAnticipos_empleados(items2); 

        return "Ok, los registros han sido actualizados en la base de datos.";
    }
})


function actualizar_definicionAnticipos(items, items2) {

    var inserts = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 1; }).
        map(function (item) { delete item.docState; return item; }).
        value();


    inserts.forEach(function (item) {

        let response: any = null;

        // localizamos la fecha antes de actualizar en sql server 
        item.desde = item.desde ? moment(item.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;

        // el valor de la clave (pk) es un identity, y puede cambiar cuando el item es agregado (insert) en sql server 
        // por eso, intentamos cambiarlo en el 2do. array ... 
        // localizamos el item en el 2do array que corresponde a la clave original que tenía el registro nuevo; 
        // si lo encontramos, cambiamos su valor por el que regresa sql server luego del insert ... 
        let item2 = lodash.find(items2, (x: any) => { return x.definicionAnticiposID === item.id; }); 
        if (item2) { 
            item2.definicionAnticiposID = savedItem.id; 
        }
    })


    var updates = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 2; }).
        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
        map(function (item) { return { id: item.id, object: item }; }).             // separamos el _id del objeto
        map(function (item) { delete item.object.id; return item; }).              // eliminamos _id del objeto (arriba lo separamos)
        value();

    updates.forEach(function (item) {

        let response: any = null;

        // localizamos la fecha antes de actualizar en sql server 
        item.object.desde = item.object.desde ? moment(item.object.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

        // actualizamos el registro en sql ...
        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_sql.update(item.object, { where: { id: item.id } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })


    // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
    // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
    // (y validamos) primero la cuenta 50101001 y luego 50101 ...
    var removes = lodash(items).
        filter((item: any) => { return item.docState && item.docState == 3; }).
        value();

    removes.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_sql.destroy({ where: { id: item.id } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })
}




function actualizar_definicionAnticipos_empleados(items) {

    var inserts = lodash.chain(items).
        filter(function (item: any) { return item.docState && item.docState == 1; }).
        map(function (item) { delete item.docState; return item; }).
        value();


    inserts.forEach(function (item) {

        let response: any = null;

        // localizamos la fecha antes de actualizar en sql server 
        item.desde = item.desde ? moment(item.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_Empleados_sql.create(item)
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
        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
        map(function (item) { return { id: item.id, object: item }; }).             // separamos el _id del objeto
        map(function (item) { delete item.object.id; return item; }).              // eliminamos _id del objeto (arriba lo separamos)
        value();

    updates.forEach(function (item) {

        let response: any = null;

        // localizamos la fecha antes de actualizar en sql server 
        item.object.desde = item.object.desde ? moment(item.object.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

        // actualizamos el registro en sql ...
        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_Empleados_sql.update(item.object, { where: { id: item.id } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })


    // ordenamos por numNiveles (en forma descendente) para que siempre validemos primero las cuentas de más
    // niveles y luego las que las agrupan; ejemplo: si el usuario quiere eliiminar: 50101 y 50101001, leemos
    // (y validamos) primero la cuenta 50101001 y luego 50101 ...
    var removes = lodash(items).
        filter((item: any) => { return item.docState && item.docState == 3; }).
        value();

    removes.forEach(function (item) {

        let response: any = null;

        response = Async.runSync(function (done) {
            Nomina_DefinicionAnticipos_Empleados_sql.destroy({ where: { id: item.id } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })
}