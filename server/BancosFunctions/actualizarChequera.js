

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';

import { Chequeras } from '/imports/collections/bancos/chequeras'; 
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

let actualizarChequera = (chequeraID) => {

    new SimpleSchema({
        chequeraID: { type: SimpleSchema.Integer, optional: false, },
    }).validate({ chequeraID, });

    let errMessage = "";

    // ------------------------------------------------------------------------------------
    // lo primero que hacemos es leer la chequera
    response = Async.runSync(function(done) {
        Chequeras_sql.findAll({ where: { id: chequeraID, }, raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    if (!response.result.length) {
        errMessage = `Error: no hemos encontrado un registro en la tabla <em>Chequeras</em> (en <em>Bancos</em>)
            que corresponda a la chequera que se intenta leer.<br />
            Por favor revise y corrija esta situación.`;

        return { error: true, errMessage: errMessage };
    }

    let chequera = response.result[0];

    if (chequera.generica) {
        errMessage = `Error: la chequera es del tipo <em>genérica</em>; no tiene que ser actualizada
            como corresponde a chequeras <b>no</b> genéricas; es decir, chequeras reales.`;

        return { error: true, errMessage: errMessage };
    }

    if (!chequera.desde || !chequera.hasta) {
        errMessage = `Error: la chequera debe tener valores en los campos: desde y hasta, antes de poder ser corregida o actualizada.`;

        return { error: true, errMessage: errMessage };
    }

    // ------------------------------------------------------------------------------------
    // ahora que tenemos la chequera, leemos la cantidad de cheques usados para la misma
    query = `Select Count(*) as contaCheques From MovimientosBancarios Where ClaveUnicaChequera = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ chequeraID ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    let cantidadChequesUsados = response.result[0].contaCheques;

    // ------------------------------------------------------------------------------------
    // leemos el cheque cuyo número es mayor ...
    query = `Select Max(Transaccion) as ultimoChequeUsado From MovimientosBancarios
             Where ClaveUnicaChequera = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ chequeraID ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    let ultimoChequeUsado = null;

    if (response.result.length) { 
        ultimoChequeUsado = response.result[0].ultimoChequeUsado;
    }
        
    let agotada = false;

    let cantidadDeCheques = chequera.hasta - chequera.desde + 1;

    if (cantidadChequesUsados >= cantidadDeCheques) { 
        agotada = true;
    }
        
    let usuario = Meteor.users.findOne(Meteor.userId());

    // ------------------------------------------------------------------------------------
    // actualizamos la chequera en sql server
    query = `Update Chequeras Set
             AgotadaFlag = ?, CantidadDeChequesUsados = ?, UltimoChequeUsado = ?, cantidadDeCheques = ?, 
             Usuario = ?, UltAct = ?
             Where NumeroChequera = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
                replacements: [ agotada,
                                cantidadChequesUsados,
                                ultimoChequeUsado,
                                cantidadDeCheques, 
                                usuario.emails[0].address,
                                new Date(),
                                chequeraID,
                            ],
                type: sequelize.QueryTypes.UPDATE
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    // ---------------------------------------------------------------------------------------------------
    // finalmente, actualizamos la chequera en mongo para que el usuario vea los cambios en el cliente ...
    let document = {
        agotadaFlag: agotada,
        cantidadDeChequesUsados: cantidadChequesUsados,
        cantidadDeCheques: cantidadDeCheques, 
        ultimoChequeUsado: ultimoChequeUsado,
        usuario: usuario.emails[0].address,
        ultAct: new Date(),
    };
    Chequeras.update({ numeroChequera: chequeraID }, { $set: document });

    return { error: false, message: 'Ok, la chequera ha sido actualizada en forma satisfactoria.' };
}

BancosFunctions.actualizarChequera = actualizarChequera;
