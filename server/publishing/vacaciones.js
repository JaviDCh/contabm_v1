
import { Empleados } from '/models/nomina/empleados'; 

Meteor.publish("vacaciones", function (filtro) {

    // leemos antes la vacación para obtener el empleado y regresarlo también ...
    // debugger; 
    let vacacion = Vacaciones.findOne(filtro, { fields: { empleado: 1 }});

    let empleadoID = "xyz";
    if (vacacion)
        empleadoID = vacacion.empleado;

    return [
        Vacaciones.find(filtro),
        Empleados.find({ empleado: empleadoID }),
    ];

    // TODO: regresar también el empleado pues lo necesitamos cuando intentemos editar la vacacion
});
