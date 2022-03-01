
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    empleadosSave: function (empleado) {

        if (!empleado || !empleado.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = empleado.docState;

        if (empleado.docState == 1) {
            delete empleado.docState;

            // debemos asignar algunos valores antes de agregar el asiento a mongo y a sql server
            empleado.sueldos.forEach((x) => { delete x.docState; });
            empleado.faltas.forEach((x) => { delete x.docState; });

            // ----------------------------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc; nuestro offset en ccs es -4.00; sequelize va a sumar 4.30 para
            // llevar a utc; restamos 4.00 para eliminar este efecto ...
            let empleado_sql = _.cloneDeep(empleado);

            empleado_sql.fechaNacimiento = empleado_sql.fechaNacimiento ? moment(empleado_sql.fechaNacimiento).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaIngreso = empleado_sql.fechaIngreso ? moment(empleado_sql.fechaIngreso).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaRetiro = empleado_sql.fechaRetiro ? moment(empleado_sql.fechaRetiro).subtract(TimeOffset, 'hours').toDate() : null;

            empleado_sql.faltas.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
                x.hasta = x.hasta ? moment(x.hasta).subtract(TimeOffset, 'hours').toDate() : null;
                x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).subtract(TimeOffset, 'hours').toDate() : null;
            });

            empleado_sql.sueldos.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
            });


            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes;
            // ej: _id, arrays de faltas y sueldos, etc.
            response = Async.runSync(function(done) {
                Empleados_sql.create(empleado_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;

            // ---------------------------------------------------------------------------------------------------
            // finalmente, actualizamos los arrays de faltas y sueldos
            empleado_sql.sueldos.forEach((sueldo) => {
                sueldo.empleadoID = savedItem.empleado;

                response = Async.runSync(function(done) {
                    EmpleadosSueldo_sql.create(sueldo)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            });

            empleado_sql.faltas.forEach((falta) => {
                falta.empleadoID = savedItem.empleado;

                response = Async.runSync(function(done) {
                    EmpleadosFaltas_sql.create(falta)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            });

            empleado.empleado = savedItem.empleado;
        };


        if (empleado.docState == 2) {
            delete empleado.docState;

            // -------------------------------------------------------------------------------------------------------------------------
            // ahora actualizamos el asiento contable; nótese como usamos el mismo objeto; sequelize ignora algunos fields que no
            // existan en el modelo ...

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            let empleado_sql = _.cloneDeep(empleado);

            empleado_sql.fechaNacimiento = empleado_sql.fechaNacimiento ? moment(empleado_sql.fechaNacimiento).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaIngreso = empleado_sql.fechaIngreso ? moment(empleado_sql.fechaIngreso).subtract(TimeOffset, 'hours').toDate() : null;
            empleado_sql.fechaRetiro = empleado_sql.fechaRetiro ? moment(empleado_sql.fechaRetiro).subtract(TimeOffset, 'hours').toDate() : null;

            empleado_sql.faltas.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
                x.hasta = x.hasta ? moment(x.hasta).subtract(TimeOffset, 'hours').toDate() : null;
                x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).subtract(TimeOffset, 'hours').toDate() : null;
            });

            empleado_sql.sueldos.forEach((x) => {
                x.desde = x.desde ? moment(x.desde).subtract(TimeOffset, 'hours').toDate() : null;
            });

            response = Async.runSync(function(done) {
                Empleados_sql.update(empleado_sql, { where: { empleado: empleado_sql.empleado }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // ---------------------------------------------------------------------
            // recorremos los items que el usuario editó en el array; agregamos de
            // acuerdo a 'docState' ...
            if (!_.isArray(empleado_sql.sueldos))
                empleado_sql.sueldos = [];

            lodash(empleado_sql.sueldos).filter((x) => { return x.docState; }).forEach((x) => {
                let response = null;

                if (x.docState == 1) {
                    x.id = 0;
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.create(x)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                }
                else if (x.docState == 2) {
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.update(x, { where: { id: x.id, }})
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                }
                else if (x.docState == 3) {
                    response = Async.runSync(function(done) {
                        EmpleadosSueldo_sql.destroy({ where: { id: x.id, } })
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });
                };

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            });
        };


        if (empleado.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                Empleados_sql.destroy({ where: { empleado: empleado.empleado } })
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
        let tempEmpleado = null;

        if (docState != 3) {
            let where = `Empleado = ${empleado.empleado}`;

            let query = `Select e.Empleado as empleado, e.Nombre as nombre, e.Cedula as cedula,
                        e.FechaIngreso as fechaIngreso, e.FechaRetiro as fechaRetiro,
                        d.Descripcion as departamento, c.Descripcion as cargo,
                        e.TipoNomina as tipoNomina,
                        e.SituacionActual as situacionActual, e.email as email, e.status,
                        e.Cia as cia
                        From tEmpleados e Inner Join tCargos c On e.Cargo = c.Cargo
                        Inner Join tDepartamentos d On e.Departamento = d.Departamento
                        Where ${where}
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            tempEmpleado = _.isArray(response.result) && response.result.length ? response.result[0] : null;


            tempEmpleado._id = new Mongo.ObjectID()._str;
            tempEmpleado.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:30, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...

            tempEmpleado.fechaIngreso = tempEmpleado.fechaIngreso ? moment(tempEmpleado.fechaIngreso).add(TimeOffset, 'hours').toDate() : null;
            tempEmpleado.fechaRetiro = tempEmpleado.fechaRetiro ? moment(tempEmpleado.fechaRetiro).add(TimeOffset, 'hours').toDate() : null;

            switch(tempEmpleado.situacionActual) {
                case 'NO':
                    tempEmpleado.situacionActual = 'Normal';
                    break;
                case 'VA':
                    tempEmpleado.situacionActual = 'Vacaciones';
                    break;
                case 'RE':
                    tempEmpleado.situacionActual = 'Retirado';
                    break;
                case 'LI':
                    tempEmpleado.situacionActual = 'Liquidado';
                    break;
                default:
                    tempEmpleado.situacionActual = 'Indefinido';
            };

            switch(tempEmpleado.status) {
                case 'A':
                    tempEmpleado.status = 'Activo';
                    break;
                case 'S':
                    tempEmpleado.status = 'Suspendido';
                    break;
                default:
                    tempEmpleado.status = 'Indefinido';
            };

            switch(tempEmpleado.tipoNomina) {
                case 1:
                    tempEmpleado.tipoNomina = 'Quincenal';
                    break;
                case 2:
                    tempEmpleado.tipoNomina = 'Mensual';
                    break;
                case 3:
                    tempEmpleado.tipoNomina = 'Otra';
                    break;
                default:
                    tempEmpleado.tipoNomina = 'Indefinido';
            };
        };


        if (docState == 1) {
            Temp_Consulta_Empleados.insert(tempEmpleado, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            });
        }
        else if (docState == 2) {
            delete tempEmpleado._id;
            Temp_Consulta_Empleados.update(
                { empleado: empleado.empleado, user: this.userId, },
                { $set: tempEmpleado },
                { multi: false, upsert: false },
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
                });
        }
        else if (docState == 3) {
            // eliminamos los registros que el usuario pueda haber registrado antes ...
            Temp_Consulta_Empleados.remove({ empleado: empleado.empleado, user: this.userId, });
        };


        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: empleado.empleado.toString()
        };
    }
});
