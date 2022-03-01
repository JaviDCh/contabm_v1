
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },

    vacacionID: { type: String, optional: false },
    nombreEmpleado: { type: String, label: "Nombre del empleado", optional: false },
    nombreGrupoNomina: { type: String, label: "Grupo de nómina", optional: false },
    fechaIngreso: { type: Date, label: "Fecha de ingreso del empleado", optional: true, },
    salida: { type: Date, label: "Fecha salida", optional: true, },
    regreso: { type: Date, label: "Fecha regreso", optional: true, },
    fechaReintegro: { type: Date, label: "Fecha reintegro", optional: false, },
    montoBono: { type: Number, label: "Monto del bono vacacional", optional: true, },
    fechaNomina: { type: Date, label: "Fecha de nómina de ejecución", optional: true, },
    cantDiasPago_Total: { type: Number, label: "Pago nómina - Cant días totales", optional: true },
    cantDiasPago_Bono: { type: Number, label: "Pago nómina - Cant días bono", optional: true },
    anoVacaciones: { type: Number, label: "Año de vacaciones (1, 2, 3, ...)", optional: false },
    numeroVacaciones: { type: Number, label: "Número, en el año, de la vacación (1, 2, 3, ...)", optional: false },

    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Consulta_Vacaciones_Lista = new Mongo.Collection("temp_consulta_vacaciones_lista");
Temp_Consulta_Vacaciones_Lista.attachSchema(schema);
