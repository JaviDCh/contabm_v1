
import moment from 'moment';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    'movimientoBancario.leerByID.desdeSql': function (pk) {

        // debugger;
        new SimpleSchema({
            pk: { type: SimpleSchema.Integer, }
          }).validate({ pk });

        let response = null;
        response = Async.runSync(function(done) {
            MovimientosBancarios_sql.findAll({ where: { claveUnica: pk }, raw: true, })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!response.result.length) {
            return null;
        };

        let movimientoBancario = response.result[0];

        // -------------------------------------------------------------------------------------------------
        // nótese que 'transaccion' es bigInt en sql server; por esta razón, regresa como un String
        // convertimos de nuevo a un integer

        // primero nos aseguramos que el valor no es un número, pero es un string que contiene un número ...
        if (!lodash.isFinite(movimientoBancario.transaccion) && !isNaN(movimientoBancario.transaccion)) {
            // ahora convertimos el valor a numérico, y luego nos aseguramos que sea un entero ...
            let transaccion =  +movimientoBancario.transaccion;             // convierte el string a Number
            if (lodash.isInteger(transaccion)) {
                movimientoBancario.transaccion = transaccion;
            };
        };
        // -------------------------------------------------------------------------------------------------


        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ingreso = movimientoBancario.ingreso ? moment(movimientoBancario.ingreso).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ultMod = movimientoBancario.ultMod ? moment(movimientoBancario.ultMod).add(TimeOffset, 'hours').toDate() : null;

        // pareciera que al leer desde sql server, sequelize agrega la propiedad ClaveUnicaChequera, que
        // corresponde a la chequera; hay una relación entre el movimiento bancario y su chequera que se llama,
        // justamente, ClaveUnicaChequera. Aunque aquí no intentamos leer la chequera del movimiento,
        // sequelize agrega esta propiedad con el valor del id de la chequera; la eliminamos ...

        delete movimientoBancario.ClaveUnicaChequera;

        // regresamos un object, pues luego debemos agregar las faltas y el salario; éstos están en tablas diferentes ...
        // TODO: mejor! vamos a leer como una relación y enviar, aunque como string, en un solo objeto ...
        return JSON.stringify(movimientoBancario);
    }
});
