


import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as moment from 'moment';
import * as lodash from 'lodash'; 
import { Parametros_Nomina_SalarioMinimo_sql } from '../../../server/imports/sqlModels/nomina/parametros/salarioMinimo'; 
import * as AppGlobalValues from '../../../imports/globals/globalValues'; 
import '../../../imports/globals/tsDeclares'; 
import { TimeOffset } from '../../../globals/globals'; 

Meteor.methods(
{
    'nomina.parametros.salarioMinimo.save': function (items) {
        

        if (!lodash.isArray(items) || items.length == 0) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        var inserts = lodash.chain(items).
                      filter(function (item) { return item.docState && item.docState == 1; }).
                      map(function (item) { delete item.docState; return item; }).
                      value();


        inserts.forEach(function (item) {

            let response: any = null;

            item.desde = item.desde ? moment(item.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

            response = Async.runSync(function(done) {
                Parametros_Nomina_SalarioMinimo_sql.create(item)
                    .then(function(result) { done(null, result); })
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
                        filter(function (item) { return item.docState && item.docState == 2; }).
                        map(function (item) { delete item.docState; return item; }).                // eliminamos docState del objeto
                        map(function (item) { return { id: item.id, object: item }; }).             // separamos el _id del objeto
                        map(function (item) { delete item.object.id; return item; }).              // eliminamos _id del objeto (arriba lo separamos)
                        value();

        updates.forEach(function (item) {

            let response: any = null;

            item.object.desde = item.object.desde ? moment(item.object.desde).subtract(AppGlobalValues.TimeOffset, 'hours').toDate() : null;

            // actualizamos el registro en sql ...
            response = Async.runSync(function(done) {
                Parametros_Nomina_SalarioMinimo_sql.update(item.object, { where: { id: item.id }})
                    .then(function(result) { done(null, result); })
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
                      filter((item) => { return item.docState && item.docState == 3; }).
                      value();

        removes.forEach(function (item) {

            let response: any = null;

            response = Async.runSync(function(done) {
                Parametros_Nomina_SalarioMinimo_sql.destroy({ where: { id: item.id }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        })

        return "Ok, los registros han sido actualizados en la base de datos.";
    }
})
