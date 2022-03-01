
import moment from 'moment'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    empleados_leerByID_desdeSql: function (pk) {

        check(pk, Match.Integer);

        let response = null;
        response = Async.runSync(function(done) {
            Empleados_sql.findAll({ where: { empleado: pk },
                include: [
                    { model: EmpleadosFaltas_sql,
                      as: 'faltas', },
                    { model: EmpleadosSueldo_sql,
                      as: 'sueldos', }
                ],
                // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let empleado = response.result[0].dataValues;

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!empleado)
            return null;

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        empleado.fechaIngreso = empleado.fechaIngreso ? moment(empleado.fechaIngreso).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaRetiro = empleado.fechaRetiro ? moment(empleado.fechaRetiro).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaNacimiento = empleado.fechaNacimiento ? moment(empleado.fechaNacimiento).add(TimeOffset, 'hours').toDate() : null;

        empleado.faltas.forEach((x) => {
            x.desde = x.desde ? moment(x.desde).add(TimeOffset, 'hours').toDate() : null;
            x.hasta = x.hasta ? moment(x.hasta).add(TimeOffset, 'hours').toDate() : null;
            x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).add(TimeOffset, 'hours').toDate() : null;
        });

        empleado.sueldos.forEach((x) => {
            x.desde = x.desde ? moment(x.desde).add(TimeOffset, 'hours').toDate() : null;
        });

        // regresamos un object, pues luego debemos agregar las faltas y el salario; éstos están en tablas diferentes ...
        // TODO: mejor! vamos a leer como una relación y enviar, aunque como string, en un solo objeto ...
        return JSON.stringify(empleado);
    }
});
