
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// ----------------------------------------
// Cargos
// ----------------------------------------
let cargos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    cargo: { type: Number, label: "Cargo", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 50,  },
    docState: { type: Number, optional: true, }, 
})

Cargos = new Mongo.Collection("cargos");
Cargos.attachSchema(cargos_SimpleSchema);

// ----------------------------------------
// Departamentos
// ----------------------------------------
let departamentos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    departamento: { type: Number, label: "Departamento", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 30, },
    docState: { type: Number, optional: true, }, 
})

Departamentos = new Mongo.Collection("departamentos");
Departamentos.attachSchema(departamentos_SimpleSchema);

// ----------------------------------------
// Ciudades
// ----------------------------------------
let ciudades_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    ciudad: { type: String, label: "Ciudad", optional: false },
    pais: { type: String, label: "Pais", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false },
})

Ciudades = new Mongo.Collection("ciudades");
Ciudades.attachSchema(ciudades_SimpleSchema);

// ----------------------------------------
// Paises
// ----------------------------------------
let paises_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    pais: { type: String, label: "Pais", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false },
})

Paises = new Mongo.Collection("paises");
Paises.attachSchema(paises_SimpleSchema);


// ----------------------------------------
// Parentescos
// ----------------------------------------
let parentescos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    parentesco: { type: Number, label: "Parentesco", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 50, },     // puede ser null en sql pero la requerimos aquí ... 
    docState: { type: Number, optional: true, }, 
})

Parentescos = new Mongo.Collection("parentescos");
Parentescos.attachSchema(parentescos_SimpleSchema);


// ----------------------------------------
// Maestra de Rubros
// ----------------------------------------
let maestraRubros_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    rubro: { type: Number, label: "Rubro", optional: false },
    nombreCortoRubro: { type: String, label: "Abreviatura", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false },
    tipo: { type: String, label: "Tipo", optional: false },
    sueldoFlag: { type: Boolean, label: "Sueldo?", optional: true },
    salarioFlag: { type: Boolean, label: "Salario?", optional: true },
    tipoRubro: { type: Number, label: "Tipo del rubro", optional: true },
    docState: { type: Number, optional: true },
})

MaestraRubros = new Mongo.Collection("maestraRubros");
MaestraRubros.attachSchema(maestraRubros_SimpleSchema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    MaestraRubros._ensureIndex({ rubro: 1 })
}

// ----------------------------------------
// Tipos de cuenta bancaria
// ----------------------------------------
let tiposDeCuentaBancaria_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipoCuenta: { type: Number, label: "Tipo de cuenta bancaria", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 30, },
    docState: { type: Number, optional: true, }, 
})

TiposDeCuentaBancaria = new Mongo.Collection("tiposDeCuentaBancaria");
TiposDeCuentaBancaria.attachSchema(tiposDeCuentaBancaria_SimpleSchema);


// ----------------------------------------
// Grupos de empleados
// ----------------------------------------
let gruposEmpleados_empleados_SimpleSchema = new SimpleSchema({
    claveUnica: { type: Number, label: "ID en contab", optional: false, },
    empleado: { type: Number, label: "ID empleado", optional: false, },
    grupo: { type: Number, label: "Grupo", optional: false, },
    suspendidoFlag: { type: Boolean, label: "Suspendido?", optional: false, },
})

export const GruposEmpleados_empleados = new Mongo.Collection("gruposEmpleados_empleados");
GruposEmpleados_empleados.attachSchema(gruposEmpleados_empleados_SimpleSchema);


let gruposEmpleados_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    grupo: { type: Number, label: "ID en contab", optional: false, },
    nombre: { type: String, label: "Nombre del grupo", optional: false, min: 1, max: 10, },
    descripcion: { type: String, label: "Descripcion del grupo", optional: false, min: 1, max: 250, },
    grupoNominaFlag: { type: Boolean, label: "Grupo de nómina?", optional: false, },
    cia:  { type: Number, label: "Cia Contab", optional: false },
})

export const GruposEmpleados = new Mongo.Collection("gruposEmpleados");
GruposEmpleados.attachSchema(gruposEmpleados_SimpleSchema);


// ----------------------------------------
// DiasFeriados
// ----------------------------------------
let diasFeriados_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    claveUnica: { type: Number, label: "Id", optional: false, },
    fecha: { type: Date, label: "Fecha", optional: false },
    tipo: { type: Number, label: "Tipo", optional: false },
    docState: { type: Number, optional: true, },
})

DiasFeriados = new Mongo.Collection("diasFeriados");
DiasFeriados.attachSchema(diasFeriados_SimpleSchema);


// ----------------------------------------
// DiasFiestaNacional
// ----------------------------------------
let diasFiestaNacional_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    claveUnica: { type: Number, label: "Id", optional: false, },
    fecha: { type: Date, label: "Fecha", optional: false },
    tipo: { type: String, label: "Tipo", optional: false },
    docState: { type: Number, optional: true, },
})

DiasFiestaNacional = new Mongo.Collection("diasFiestaNacional");
DiasFiestaNacional.attachSchema(diasFiestaNacional_SimpleSchema);
