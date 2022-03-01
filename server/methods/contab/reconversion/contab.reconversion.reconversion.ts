


import * as moment from 'moment';
import { TimeOffset } from '../../../../globals/globals'; 
import { sequelize } from '../../../sqlModels/_globals/_loadThisFirst/_globals';

import SimpleSchema from 'simpl-schema';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

// Según documentación de simpl-schema: 
// Validate a Meteor Method Argument and Satisfy audit-argument-checks
// To avoid errors about not checking all arguments when you are using SimpleSchema to validate Meteor method arguments, 
// you must pass check as an option when creating your SimpleSchema instance.

SimpleSchema.defineValidationErrorTransform(error => {
    const ddpError = new Meteor.Error(error.message);
    ddpError.error = 'validation-error';
    ddpError.details = error.details;
    return ddpError;
});

const meteorMethodArgsValidate_Schema = new SimpleSchema({
    moneda: { type: Array, label: 'Moneda', optional: false, minCount: 1, },
    'moneda.$': { type:  SimpleSchema.Integer },
    cuentaContable: { type: Array, label: 'Cuenta contable', optional: false, minCount: 1, maxCount: 1, },
    'cuentaContable.$': { type:  SimpleSchema.Integer },
    ano: { type: Array, label: 'Año', optional: false, minCount: 1, maxCount: 1, },
    'ano.$': { type:  SimpleSchema.Integer },
    dividirPor: { type: SimpleSchema.Integer, label: 'Monto divisor (dividir por)', optional: false, },
    cia: { type: SimpleSchema.Integer, optional: false, },
}, { check });


Meteor.methods(
{
    'contab.reconversion.reconversion': function (filtro) {

        meteorMethodArgsValidate_Schema.validate(filtro);

        // Now do other method stuff knowing that obj (ie: method arg) satisfies the schema ... 

        let filtroMoneda = 'Moneda In ('; 
        for (let moneda of filtro.moneda) { 

            if (filtroMoneda === 'Moneda In (') { 
                // primera vez ... 
                filtroMoneda += moneda.toString(); 
            } else { 
                filtroMoneda += `, ${moneda.toString()}`; 
            }
        }

        filtroMoneda += ')'; 

        // let query = `Update SaldosContables Set
        //     Inicial = Inicial / ${filtro.dividirPor.toString()}, Mes01 = Mes01 / ${filtro.dividirPor.toString()}, 
        //     Mes02 = Mes02 / ${filtro.dividirPor.toString()}, Mes03 = Mes03 / ${filtro.dividirPor.toString()}, 
        //     Mes04 = Mes04 / ${filtro.dividirPor.toString()}, Mes05 = Mes05 / ${filtro.dividirPor.toString()}, 
        //     Mes06 = Mes06 / ${filtro.dividirPor.toString()}, Mes07 = Mes07 / ${filtro.dividirPor.toString()}, 
        //     Mes08 = Mes08 / ${filtro.dividirPor.toString()}, Mes09 = Mes09 / ${filtro.dividirPor.toString()}, 
        //     Mes10 = Mes10 / ${filtro.dividirPor.toString()}, Mes11 = Mes11 / ${filtro.dividirPor.toString()}, 
        //     Mes12 = Mes12 / ${filtro.dividirPor.toString()}, Anual = Anual / ${filtro.dividirPor.toString()} 
        //     Where Ano = ? And ${filtroMoneda} And Cia = ? And (1 = 2)`;

        // query = query.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        // let response: any = null;
        // let affectedRecords = 0; 

        // response = Async.runSync(function (done) {
        //     sequelize.query(query, {
        //         replacements: [ filtro.ano, filtro.cia, ],
        //         type: sequelize.QueryTypes.UPDATE
        //     })
        //         .then(function (result) { done(null, result); })
        //         .catch(function (err) { done(err, null); })
        //         .done();
        // })

        // if (response.error) {
        //     throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        // }

        // TODO: vamos a agregar un stored procedure aquí que efectúe toda la funcionalidad y registre en una tabla 
        // la cantidad de registros afectados, etc. 
        
        // let query = 'spcName :param1, :param2, :param3, :param4)'; 
        // sequelize.query(query, {
        //     replacements: { param1: value, param2: value, param3: value, param4: value }, 
        //     type: sequelize.QueryTypes.SELECT
        // })


        // sequelize.query('CALL login (:email, :pwd, :device)', 
        //                   {replacements: { email: "me@jsbot.io", pwd: 'pwd', device: 'android', }})
        // .then(v=>console.log(v));

        // sequelize.query('GetThings_ByLocation @BeginDate=\'2016-08-01\', @EndDate=\'2016-08-07\', @LocationID=NULL;')
        //         .then(function(result) {
        //             console.log('RESULT', result);
        //         })
        //         .error(function(err) {
        //             console.log(err);
        //         });

        let query = 'sp_contab_reconversion_reconversion';

        let response = Async.runSync(function (done) {
            sequelize.query(query, {
                type: sequelize.QueryTypes.SELECT
            })
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        return { 
            error: false, 
            message: `Ok, el proceso de reconversión se ha ejecutado en forma satisfactoria.`, 
            resultado: response, 
        };
    }
})