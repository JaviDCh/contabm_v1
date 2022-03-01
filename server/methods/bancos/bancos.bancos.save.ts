

import * as lodash from 'lodash'; 
import SimpleSchema from 'simpl-schema';

import { Bancos_sql, Agencias_sql, CuentasBancarias_sql } from 'server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Bancos } from 'imports/collections/bancos/bancos';

Meteor.methods(
{
    'bancos.bancos.save': function(items) { 

        let bancosActualizados = 0; 
        let agenciasActualizadas = 0; 
        let cuentasBancariasActualizadas = 0; 

        // en items viene una relación de bancos --> agencias --> cuentas bancarias. Recorremos cada item en este graph 
        // y actualizamos los registros que el usuario haya editado ... 

        for (let banco of items) { 

            let banco_pk = banco.banco;     // al registrar agencias, si el banco es nuevo, este valor puede no venir ... 

            if (banco.docState) { 
                let item = lodash.clone(banco); 
                delete item.agencias;                      // en sql el banco no tiene un array de agencias 

                banco_pk = actualizarBancos(item); 
                bancosActualizados++;
            }

            for (let agencia of banco.agencias) { 
                // si el banco se ha recién agregado, debemos agregar el banco, como foreign key en agencias 
                agencia.banco = banco_pk; 

                let agencia_pk = agencia.agencia;   // al registrar cuentas, si la agencia es nueva, este valor puede no venir ... 

                if (agencia.docState) { 
                    let item = lodash.clone(agencia); 
                    delete item.cuentasBancarias;            // en sql la agencia no tiene un array de cuentas bancarias 

                    agencia_pk = actualizarAgencias(item); 
                    agenciasActualizadas++; 
                }

                for (let cuentaBancaria of agencia.cuentasBancarias) { 

                    cuentaBancaria.agencia = agencia_pk; 

                    if (cuentaBancaria.docState) { 
                        let item = lodash.clone(cuentaBancaria); 

                        let cuentaBancaria_pk = actualizarCuentasBancarias(item); 
                        cuentasBancariasActualizadas++; 
                    }
                }
            }

            // finalmente, actualizamos el banco en mongo, para que el usuario no tenga que hacer 'Copiar catálogos' ... 
            // solo si el banco es nuevo, debemos recuperar su pk en sql 
            banco.banco = banco_pk; 

            if (banco.docState && banco.docState === 3) { 
                // el banco fue eliminado; simplemente, lo eliminamos en mongo ...
                Bancos.remove({ banco: banco.banco });
            } else { 
                actualizarBancoEnMongoDesdeSql(banco.banco); 
            }
        }

        let message = `Ok, los datos han sido actualizados en la base de datos.<br />
        En total se han actualizado: <b>${bancosActualizados.toString()}</b> bancos; 
                                     <b>${agenciasActualizadas.toString()}</b> agencias; 
                                     <b>${cuentasBancariasActualizadas.toString()}</b> cuentas bancarias. 
        `;

        message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        return message; 
    }
})

// -------------------------------------------------------------------
// actualizarBancos() 
// ------------------------------------------------------------------- 
let actualizarBancos = function (item: any): number {

    // para actualizar los bancos, antes que agencias y cuentas bancarias 

    let docState = item.docState; 
    
    if (docState === 1) {

        let response: any = null;
        response = Async.runSync(function (done) {
            Bancos_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;
        item.banco = savedItem.banco     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
    }

    if (docState === 2) {

        // actualizamos el registro en sql ...
        let response: any = null;
        response = Async.runSync(function (done) {
            Bancos_sql.update(item, { where: { banco: item.banco } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    if (docState === 3) {

        let response: any = null;
        response = Async.runSync(function (done) {
            Bancos_sql.destroy({ where: { banco: item.banco } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    return item.banco; 
}

// -------------------------------------------------------------------
// actualizarAgencias() 
// ------------------------------------------------------------------- 
let actualizarAgencias = function (item: any): number {

    // para actualizar agencias antes que cuentas bancarias 

    let docState = item.docState; 
    
    if (docState === 1) {

        delete item.docState; 

        let response: any = null;
        response = Async.runSync(function (done) {
            Agencias_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;
        item.agencia = savedItem.agencia     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
    }

    if (docState === 2) {

        delete item.docState; 

        // actualizamos el registro en sql ...
        let response: any = null;
        response = Async.runSync(function (done) {
            Agencias_sql.update(item, { where: { agencia: item.agencia } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    if (docState === 3) {

        let response: any = null;
        response = Async.runSync(function (done) {
            Agencias_sql.destroy({ where: { agencia: item.agencia } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    return item.agencia; 
}

// -------------------------------------------------------------------
// actualizarCuentasBancarias() 
// ------------------------------------------------------------------- 
let actualizarCuentasBancarias = function(item: any): number { 
    // para actualizar agencias antes que cuentas bancarias 

    let docState = item.docState;

    if (docState === 1) {

        delete item.docState;

        let response: any = null;
        response = Async.runSync(function (done) {
            CuentasBancarias_sql.create(item)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
        let savedItem = response.result.dataValues;
        item.cuentaInterna = savedItem.cuentaInterna     // recuperamos el id (pk) del registro; pues se le asignó un valor en sql ...
    }

    if (docState === 2) {

        delete item.docState;

        // actualizamos el registro en sql ...
        let response: any = null;
        response = Async.runSync(function (done) {
            CuentasBancarias_sql.update(item, { where: { cuentaInterna: item.cuentaInterna } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    if (docState === 3) {

        let response: any = null;
        response = Async.runSync(function (done) {
            CuentasBancarias_sql.destroy({ where: { cuentaInterna: item.cuentaInterna } })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    return item.cuentaInterna; 
}


// -------------------------------------------------------------------
// actualizarBancoEnMongoDesdeSql() 
// ------------------------------------------------------------------- 
let actualizarBancoEnMongoDesdeSql = function(bancoID) { 

    // leemos el banco recién actualizado en sql y lo copiamos a mongo, para que el usuario no tenga que hacer 
    // Copiar catálogos ... 

    // ---------------------------------------------------------------------------------------------------
    // Bancos - copiamos a mongo desde sql
    // ---------------------------------------------------------------------------------------------------
    let response = Async.runSync(function(done) {
        Bancos_sql.findAll({ where: { banco: bancoID }, raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    response.result.forEach((item) => {
        // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

        let itemExisteID = Bancos.findOne({ banco: item.banco }, { fields: { _id: true }});

        let document = {
            _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,

            banco: item.banco,
            nombre: item.nombre,
            nombreCorto: item.nombreCorto,
            abreviatura: item.abreviatura,
            codigo: item.codigo,
            agencias: []
        };

        // leemos las agencias, cuentas bancarias y agencias, y las agregamos a mongo ...
        let response_Agencias = Async.runSync(function(done) {
            Agencias_sql.findAll({ where: { banco: item.banco }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response_Agencias.error) { 
            throw new Meteor.Error(response_Agencias.error && response_Agencias.error.message ? response_Agencias.error.message : response_Agencias.error.toString());
        }

        response_Agencias.result.forEach((agencia) => {

            let agenciaMongo = {
                _id: new Mongo.ObjectID()._str,
                agencia: agencia.agencia,
                banco: agencia.banco, 
                nombre: agencia.nombre,
                direccion: agencia.direccion,
                telefono1: agencia.telefono1,
                telefono2: agencia.telefono2,
                fax: agencia.fax,
                contacto1: agencia.contacto1,
                contacto2: agencia.contacto2,
                cuentasBancarias: [],
            } as never;

            let response_CuentasBancarias = Async.runSync(function(done) {
                CuentasBancarias_sql.findAll({ where: { agencia: agencia.agencia }, raw: true })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response_CuentasBancarias.error) { 
                throw new Meteor.Error(response_CuentasBancarias.error && response_CuentasBancarias.error.message ? response_CuentasBancarias.error.message : response_CuentasBancarias.error.toString());
            }

            response_CuentasBancarias.result.forEach((cuentaBancaria) => {

                let cuentaBancariaMongo = {
                    _id: new Mongo.ObjectID()._str,
                    cuentaInterna: cuentaBancaria.cuentaInterna,
                    agencia: cuentaBancaria.agencia, 
                    cuentaBancaria: cuentaBancaria.cuentaBancaria,
                    tipo: cuentaBancaria.tipo,
                    moneda: cuentaBancaria.moneda,
                    lineaCredito: cuentaBancaria.lineaCredito,
                    estado: cuentaBancaria.estado,
                    cuentaContable: cuentaBancaria.cuentaContable,
                    cuentaContableGastosIDB: cuentaBancaria.cuentaContableGastosIDB,
                    numeroContrato: cuentaBancaria.numeroContrato,
                    cia: cuentaBancaria.cia,
                    chequeras: [],
                };

                // solo para eliminar (TS): property 'cuentasBancarias' does not exist on type never (sorry) ... 
                // en:  agenciaMongo.cuentasBancarias.push(cuentaBancariaMongo);
                agenciaMongo['cuentasBancarias'].push(cuentaBancariaMongo);
            });

            document.agencias.push(agenciaMongo);
        });

        // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
        if (itemExisteID && itemExisteID._id) {
            // eliminamos las agencias y las registramos nuevamente, con sus cuentas y chequeras ...
            Bancos.update({ _id: itemExisteID._id }, { $unset: { agencias: true } });
            Bancos.update({ _id: itemExisteID._id }, { $set: document });
        }
        else { 
            Bancos.insert(document);
        }
    })
}
