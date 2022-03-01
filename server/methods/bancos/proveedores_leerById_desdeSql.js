
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 
import { Proveedores_sql, Personas_sql } from '/server/imports/sqlModels/bancos/proveedores'; 

Meteor.methods(
{
    proveedores_leerByID_desdeSql: function (pk) {

        check(pk, Match.Integer);

        let response = null;
        response = Async.runSync(function(done) {
            Proveedores_sql.findAll({ where: { proveedor: pk },
                include: [
                    { model: Personas_sql,
                      as: 'personas', },
                ],
                    // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let proveedor = {};

        if (response && response.result && response.result.length) {
            proveedor = response.result[0].dataValues;

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            proveedor.ingreso = proveedor.ingreso ? moment(proveedor.ingreso).add(TimeOffset, 'hours').toDate() : null;
            proveedor.ultAct = proveedor.ultAct ? moment(proveedor.ultAct).add(TimeOffset, 'hours').toDate() : null;

            if (proveedor.personas) {
                proveedor.personas.forEach((p) => {
                    p.ingreso = p.ingreso ? moment(p.ingreso).add(TimeOffset, 'hours').toDate() : null;
                    p.ultAct = p.ultAct ? moment(p.ultAct).add(TimeOffset, 'hours').toDate() : null;
                });
            }
        }

        return JSON.stringify(proveedor);
    }
});
