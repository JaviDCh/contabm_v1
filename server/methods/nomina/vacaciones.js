
import moment from 'moment';
import numeral from 'numeral'; 
import { GruposEmpleados } from '/models/nomina/catalogos';
import { Empleados } from '/models/nomina/empleados'; 

Meteor.methods(
{
    vacaciones: function (filtro, ciaContab) {

        // debugger;
        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);

        // if (!asientoContable || !asientoContable.docState) {
        //     throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        // };

        // TODO: si recibimos el nombre del empleado, debemos leer en Empleados y regresar un array con sus IDs
        // luego, usar para seleccionar las vacaciones, como se hace con las listas. Nota: no olvidar que el usuario
        // puede usar asteriscos (*) en el nombre ...

        let selector = {};

        if (filtro2.fechaSalida1 && moment(filtro2.fechaSalida1).isValid())
            if (filtro2.fechaSalida2 && moment(filtro2.fechaSalida2).isValid())
                selector.salida = { $gte: moment(filtro2.fechaSalida1).toDate(), $lte: moment(filtro2.fechaSalida2).toDate() };
            else
                selector.salida = moment(filtro2.fechaSalida1).toDate();


        if (filtro2.fechaRegreso1 && moment(filtro2.fechaRegreso1).isValid())
            if (filtro2.fechaRegreso2 && moment(filtro2.fechaRegreso2).isValid())
                selector.regreso = { $gte: moment(filtro2.fechaRegreso1).toDate(), $lte: moment(filtro2.fechaRegreso2).toDate() };
            else
                selector.regreso = moment(filtro2.fechaRegreso1).toDate();


        if (filtro2.fechaReintegro1 && moment(filtro2.fechaReintegro1).isValid())
            if (filtro2.fechaReintegro2 && moment(filtro2.fechaReintegro2).isValid())
                selector.fechaReintegro = { $gte: moment(filtro2.fechaReintegro1).toDate(), $lte: moment(filtro2.fechaReintegro2).toDate() };
            else
                selector.fechaReintegro = moment(filtro2.fechaReintegro1).toDate();


        if (filtro2.fechaNomina1 && moment(filtro2.fechaNomina1).isValid())
            if (filtro2.fechaNomina2 && moment(filtro2.fechaNomina2).isValid())
                selector.fechaNomina = { $gte: moment(filtro2.fechaNomina1).toDate(), $lte: moment(filtro2.fechaNomina2).toDate() };
            else
                selector.fechaNomina = moment(filtro2.fechaNomina1).toDate();


        // ---------------------------------------------------------------------------------------------
        // en el filtro, hay una lista de empleados, pero también el usuario puede indicar el nombre del empleado
        let arrayEmpleados = [];
        if (filtro2.empleados && filtro2.empleados.length) {
            filtro2.empleados.forEach((e) => { arrayEmpleados.push(e) });
        };

        // nótese como para filtrar por nombre de empleado, leemos los IDs de éstos en el collection Empleados
        if (filtro2.nombreEmpleado) {
            // a veces el usuario usa '*' para generalizar, aunque en este caso, no es necesario ...
            let criteria = filtro2.nombreEmpleado.replace(/\*/g, '');
            let search = new RegExp(criteria, 'i');       // para que mongo haga una busqueda genérica ...

            Empleados.find({ nombre: search }).forEach((e) => {
                arrayEmpleados.push(e.empleado);
            });
        };

        if (arrayEmpleados.length)
            selector.empleado = { $in: arrayEmpleados };
        // ---------------------------------------------------------------------------------------------

        selector.cia = ciaContab;

        // eliminamos los registros que el usuario pueda haber registrado antes ...
        Temp_Consulta_Vacaciones_Lista.remove({ user: this.userId });


        // TODO: leer vacaciones que cumplan el filtro desde mongo ...
        // TODO: leer solo los fields que sean necesarios ...
        let vacaciones = Vacaciones.find(selector).fetch();


        if (!vacaciones || vacaciones.length == 0) {
            return 0;
        };


        let empleados = Empleados.find({ cia: ciaContab }, { fields: { empleado: 1, alias: 1 }}).fetch();
        let gruposEmpleados = GruposEmpleados.find({ cia: ciaContab }).fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = vacaciones.length;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;

        EventDDP.matchEmit('nomina_vacaciones_reportProgress',
                            { myuserId: this.userId, app: 'nomina', process: 'nomina_vacaciones' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                              message: `leyendo las vacaciones ... ` });
        // -------------------------------------------------------------------------------------------------------------

        vacaciones.forEach((vacacion) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields adicionales que existen en mongo ...

            let vacacionItem  = {};

            vacacionItem._id = new Mongo.ObjectID()._str;

            vacacionItem.vacacionID = vacacion._id;
            vacacionItem.nombreEmpleado = _.find(empleados, (x) => { return x.empleado === vacacion.empleado; }).alias;
            vacacionItem.nombreGrupoNomina = _.find(gruposEmpleados, (x) => { return x.grupo === vacacion.grupoNomina; }).descripcion;
            vacacionItem.fechaIngreso = vacacion.fechaIngreso ? vacacion.fechaIngreso : null;
            vacacionItem.salida = vacacion.salida;
            vacacionItem.regreso = vacacion.regreso;
            vacacionItem.fechaReintegro = vacacion.fechaReintegro;
            vacacionItem.montoBono = vacacion.montoBono;
            vacacionItem.fechaNomina = vacacion.fechaNomina;
            vacacionItem.cantDiasPago_Total = vacacion.cantDiasPago_Total;
            vacacionItem.cantDiasPago_Bono = vacacion.cantDiasPago_Bono;
            vacacionItem.anoVacaciones = vacacion.anoVacaciones;
            vacacionItem.numeroVacaciones = vacacion.numeroVacaciones;

            vacacionItem.cia = vacacion.cia;
            vacacionItem.user = Meteor.userId();

            // TODO: grabar a Temp_Consulta_Vacaciones_Lista
            Temp_Consulta_Vacaciones_Lista.insert(vacacionItem);

            // Temp_Consulta_Empleados.insert(empleado, function (error, result) {
            //     if (error)
            //         throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            // });

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_vacaciones_reportProgress',
                                    { myuserId: this.userId, app: 'nomina', process: 'nomina_vacaciones' },
                                    { current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `leyendo las vacaciones ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_vacaciones_reportProgress',
                                        { myuserId: this.userId, app: 'nomina', process: 'nomina_vacaciones' },
                                        { current: currentProcess, max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                          message: `leyendo las vacaciones ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return cantidadRecs;
    }
});
