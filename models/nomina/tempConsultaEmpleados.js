
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    empleado: { type: Number, label: "Número", optional: false },
    nombre: { type: String, label: "Nombre", optional: false },
    cedula: { type: String, label: "Cédula", optional: false },
    fechaIngreso: { type: Date, label: "Fecha ingreso", optional: false },
    fechaRetiro: { type: Date, label: "Fecha retiro", optional: true },
    departamento: { type: String, label: 'Departamento', optional: false },
    cargo: { type: String, label: 'Cargo', optional: true },
    status: { type: String, label: "Estado", optional: false },
    situacionActual: { type: String, label: "Situación actual", optional: false },
    tipoNomina: { type: String, label: "Tipo nómina", optional: true },
    email: { type: String, label: 'e-mail', optional: true },
    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Consulta_Empleados = new Mongo.Collection("temp_consulta_empleados");
Temp_Consulta_Empleados.attachSchema(schema);
