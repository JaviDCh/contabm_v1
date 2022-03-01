
import moment from 'moment';
import lodash from 'lodash';
import { TimeOffset } from '/globals/globals'; 

import { AsientosContables } from '/imports/collections/contab/asientosContables'; 

Meteor.methods(
{
    asientosContablesSave: function (asientoContable, fechaOriginalAsientoContable) {

        if (!asientoContable || !asientoContable.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = asientoContable.docState;

        // desde el cliente, viene la fecha original del asiento, cuando el asiento no era nuevo y fue editado. La idea
        // es poder validar que: 1) un asiento no cambie su fecha a un mes diferente; 2) el mes al cual corresponde
        // originalmente el asiento no esté cerrado ...
        if (fechaOriginalAsientoContable && lodash.isDate(fechaOriginalAsientoContable)) {
            if (fechaOriginalAsientoContable.getFullYear() != asientoContable.fecha.getFullYear())
                throw new Meteor.Error("meses-diferentes",
                    "La fecha de un asiento contable no puede ser cambiada a una que corresponda a un mes diferente.");

            if (fechaOriginalAsientoContable.getMonth() != asientoContable.fecha.getMonth())
                throw new Meteor.Error("meses-diferentes",
                    "La fecha de un asiento contable no puede ser cambiada a una que corresponda a un mes diferente.");

            let validarMesCerradoEnContab =
                ContabFunctions.validarMesCerradoEnContab(fechaOriginalAsientoContable,
                                                          asientoContable.cia,
                                                          asientoContable.asientoTipoCierreAnualFlag ?
                                                          asientoContable.asientoTipoCierreAnualFlag :
                                                          false);

            if (validarMesCerradoEnContab.error)
                throw new Meteor.Error("meses-cerrado-en-Contab", validarMesCerradoEnContab.errMessage);
        };

        let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(asientoContable.fecha,
                                                                                  asientoContable.cia,
                                                                                  asientoContable.asientoTipoCierreAnualFlag ?
                                                                                  asientoContable.asientoTipoCierreAnualFlag :
                                                                                  false);

        if (validarMesCerradoEnContab.error)
            throw new Meteor.Error("meses-cerrado-en-Contab", validarMesCerradoEnContab.errMessage);


        if (asientoContable.docState == 1) {
            delete asientoContable.docState;

            // debemos asignar algunos valores antes de agregar el asiento a mongo y a sql server
            asientoContable.mes = asientoContable.fecha.getMonth() + 1;
            asientoContable.ano = asientoContable.fecha.getFullYear();

            asientoContable.ingreso = new Date();
            asientoContable.ultAct = new Date();

            let determinarMesFiscal = ContabFunctions.determinarMesFiscal(asientoContable.fecha, asientoContable.cia);

            if (determinarMesFiscal.error)
                throw new Meteor.Error("error-determinar-mes-fiscal", determinarMesFiscal.errorMessage);

            asientoContable.mesFiscal = determinarMesFiscal.mesFiscal;
            asientoContable.anoFiscal = determinarMesFiscal.anoFiscal;

            let determinarNumeroAsientoContab = ContabFunctions.determinarNumeroAsientoContab(
                asientoContable.fecha, asientoContable.tipo, asientoContable.cia);

            if (determinarNumeroAsientoContab.error)
                throw new Meteor.Error("error-determinar-numero-Contab", determinarNumeroAsientoContab.errMessage);

            asientoContable.numero = determinarNumeroAsientoContab.numeroAsientoContab;

            asientoContable.convertirFlag = true;
            asientoContable.copiableFlag = true;

            asientoContable.partidas.forEach((partida) => { delete partida.docState; });

            // primero, registramos el asiento en mongo ...
            AsientosContables.insert(asientoContable, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });


            // ----------------------------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc; nuestro offset en ccs es -4.30; sequelize va a sumar
            // 4.30 para llevar a utc; restamos 4.30 para eliminar este efecto ...
            let asientoContable_sql = lodash.cloneDeep(asientoContable);

            asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'hours').toDate();

            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes; ej: _id, partidas, etc.
            response = Async.runSync(function(done) {
                AsientosContables_sql.create(asientoContable_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos las partidas del asiento contable
            asientoContable.partidas.forEach((partida) => {
                partida.numeroAutomatico = savedItem.numeroAutomatico;

                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partida)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            });

            // finalmente, actualizamos el asiento en mongo, para registrar el número automático (pk en sql server)
            AsientosContables.update({ _id: asientoContable._id }, { $set: { numeroAutomatico: savedItem.numeroAutomatico }},
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });

            asientoContable.numeroAutomatico = savedItem.numeroAutomatico;
        };


        if (asientoContable.docState == 2) {
            delete asientoContable.docState;

            lodash.remove(asientoContable.partidas, (p) => { return p.docState == 3; });
            asientoContable.partidas.forEach((partida) => { delete partida.docState; });

            asientoContable.ultAct = new Date();
            asientoContable.usuario = usuario.emails[0].address;

            AsientosContables.update({ _id: asientoContable._id }, { $set: asientoContable }, {}, function (error, result) {
                //The list of errors is available on `error.invalidKeys` or by calling Books.simpleSchema().namedContext().invalidKeys()
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });

            // -------------------------------------------------------------------------------------------------------------------------
            // ahora actualizamos el asiento contable; nótese como usamos el mismo objeto; sequelize ignora algunos fields que no
            // existan en el modelo ...

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            let asientoContable_sql = lodash.cloneDeep(asientoContable);
            asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'hours').toDate();
            asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'hours').toDate();

            response = Async.runSync(function(done) {
                AsientosContables_sql.update(asientoContable_sql, { where: { numeroAutomatico: asientoContable.numeroAutomatico }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // eliminamos las partidas; luego las registraremos nuevamente ...
            response = Async.runSync(function(done) {
                dAsientosContables_sql.destroy({ where: { numeroAutomatico: asientoContable.numeroAutomatico } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos las partidas del asiento contable
            asientoContable.partidas.forEach((partida) => {
                partida.numeroAutomatico = asientoContable.numeroAutomatico;

                response = Async.runSync(function(done) {
                    dAsientosContables_sql.create(partida)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            });
        };


        if (asientoContable.docState == 3) {
            AsientosContables.remove({ _id: asientoContable._id });

            // sql elimina (cascade delete) las partidas ...
            response = Async.runSync(function(done) {
                AsientosContables_sql.destroy({ where: { numeroAutomatico: asientoContable.numeroAutomatico } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        };


        // ---------------------------------------------------------------------------------------------------------
        // actualizamos el asiento en la tabla (mongo) Temp_Consulta_AsientosContables; ésto permitirá que la
        // lista que ve el usuario se actualice  (meteor reactivity)
        let temp_consulta_asientoContable = {
            _id: new Mongo.ObjectID()._str,
            numeroAutomatico: asientoContable.numeroAutomatico,
            numero: asientoContable.numero,
            tipo: asientoContable.tipo,
            fecha: asientoContable.fecha,
            descripcion: asientoContable.descripcion,
            moneda: asientoContable.moneda,
            monedaOriginal: asientoContable.monedaOriginal,
            provieneDe: asientoContable.provieneDe,
            asientoTipoCierreAnualFlag: asientoContable.asientoTipoCierreAnualFlag,
            factorDeCambio: asientoContable.factorDeCambio,
            cantidadPartidas: Array.isArray(asientoContable.partidas) ? asientoContable.partidas.length : 0,
            totalDebe: lodash.sumBy(asientoContable.partidas, 'debe'),
            totalHaber: lodash.sumBy(asientoContable.partidas, 'haber'),
            ingreso: asientoContable.ingreso,
            ultAct: asientoContable.ultAct,
            cia: asientoContable.cia,
            user: asientoContable.user,
        };

        if (docState == 1) {
            Temp_Consulta_AsientosContables.insert(temp_consulta_asientoContable, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            });
        }
        else if (docState == 2) {
            delete temp_consulta_asientoContable._id;

            Temp_Consulta_AsientosContables.update(
                { numeroAutomatico: asientoContable.numeroAutomatico, user: asientoContable.user },
                { $set: temp_consulta_asientoContable },
                { multi: false, upsert: false },
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
                });
        }
        else {
            Temp_Consulta_AsientosContables.remove({ numeroAutomatico: asientoContable.numeroAutomatico, user: this.userId },
                function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            });
        };

        return "Ok, los datos han sido actualizados en la base de datos.";
    }
});
