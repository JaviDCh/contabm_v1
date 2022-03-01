
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// NOTA: por ahora *no* tenemos un collection en mongo para los empleados; sin embargo,
// agregamos este schema para validar fácilmente cuando el usuario intenta editar un
// empleado ...

let empleadoFaltas_simpleSchema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false, },
    empleadoID: { type: Number, label: "EmpleadoID", optional: false, },
    desde: { type: Date, label: "Desde", optional: false, },
    hasta: { type: Date, label: "Hasta", optional: false, },
    cantDias: { type: Number, label: "Cant días", optional: false, },
    cantDiasSabDom: { type: Number, label: "Cant sab/dom", optional: false, },
    cantDiasFeriados: { type: Number, label: "Cant feriados", optional: false, },
    cantDiasHabiles: { type: Number, label: "Cant hábiles", optional: false, },
    cantHoras: { type: Number, label: "Cant horas", optional: true, },
    descontar: { type: Boolean, label: "Descontar?", optional: false, },
    descontar_FechaNomina: { type: Date, label: "Fecha nómina", optional: true, },
    descontar_GrupoNomina: { type: Number, label: "Grupo nómina", optional: true, },
    base: { type: String, label: "Base", optional: true, },
    observaciones: { type: String, label: "Observaciones", optional: true, },
    descripcionRubroNomina: { type: String, label: "Descripción rubro", optional: true, },
    docState: { type: Number, optional: true },
});

let empleadoSueldos_simpleSchema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false, },
    empleadoID: { type: Number, label: "EmpleadoID", optional: false, },
    desde: { type: Date, label: "Desde", optional: false, },
    sueldo: { type: Number, label: "Sueldo", optional: false, },
    docState: { type: Number, optional: true },
});

let simpleSchema = new SimpleSchema({
    empleado: { type: Number, label: "Empleado", optional: false },
    cedula: { type: String, label: "Cédula", optional: false },
    alias: { type: String, label: "Alias", optional: false },
    rif: { type: String, label: "Rif", optional: true },
    tipoNomina: { type: Number, label: "Tipo de nómina", optional: false },
    escribirArchivoXMLRetencionesISLR: { type: Boolean, label: "Escribir al archivo xml (islr)", optional: true },
    status: { type: String, label: "Estado", optional: false },
    nombre: { type: String, label: "Nombre", optional: false },
    edoCivil: { type: String, label: "Edo civil", optional: false },

    // nota importante: cuando el empleado sea registrado en mongo, estos items estarían en collections separados (ie: no arrays)
    faltas: { type: Array, optional: true, minCount: 0 },
    'faltas.$': { type: empleadoFaltas_simpleSchema },

    sueldos: { type: Array, optional: true, minCount: 0 },
    'sueldos.$': { type: empleadoSueldos_simpleSchema },

    sexo: { type: String, label: "Sexo", optional: false, },
    nacionalidad: { type: String, label: "Nacionalidad", optional: false },
    fechaNacimiento: { type: Date, label: "Fecha de nacimiento", optional: false },
    ciudadOrigen: { type: String, label: "Ciudad de origen", optional: true },
    direccionHabitacion: { type: String, label: "Dirección (habitación)", optional: true },
    telefono1: { type: String, label: "Telefono 1", optional: true },
    telefono2: { type: String, label: "Telefono 2", optional: true },
    email: { type: String, label: "email", optional: true },
    situacionActual: { type: String, label: "Situación actual", optional: false },

    departamentoID: { type: Number, label: "Departamento", optional: false },
    cargoID: { type: Number, label: "Cargo", optional: false },
    fechaIngreso: { type: Date, label: "Fecha de ingreso", optional: false },
    fechaRetiro: { type: Date, label: "Fecha de retiro", optional: true },
    bancoDepositosNomina: { type: Number, label: "Banco dep nómina", optional: true },
    tipoCuentaDepositosNomina: { type: Number, label: "Tipo cuenta dep nómina", optional: true },
    cuentaBancariaDepositosNomina: { type: String, label: "Cuenta dep nómina", optional: true, max: 30 },
    bancoCuentaPrestacionesSociales: { type: Number, label: "Banco cuenta prest soc", optional: true },
    numeroCuentaBancariaPrestacionesSociales: { type: String, label: "Cuenta prest soc", optional: true, max: 30 },

    contacto1: { type: String, label: "Contacto 1", optional: true },
    parentesco1: { type: Number, label: "Parentesco contacto 1", optional: true },
    telefonoCon1: { type: String, label: "Teléfono contacto 1", optional: true },
    contacto2: { type: String, label: "Contacto 2", optional: true },
    parentesco2: { type: Number, label: "Parentesco contacto 2", optional: true },
    telefonoCon2: { type: String, label: "Teléfono contacto 2", optional: true },
    contacto3: { type: String, label: "Contacto 3", optional: true },
    parentesco3: { type: Number, label: "Parentesco contacto 3", optional: true },
    telefonoCon3: { type: String, label: "Teléfono contacto 3", optional: true },

    empleadoObreroFlag: { type: Number, label: "Empleado/Obrero", optional: true, },
    montoCestaTickets: { type: Number, label: "Monto cesta tickets", optional: true, },
    bonoVacAgregarSueldoFlag: { type: Boolean, label: "Bono vac: agregar sueldo?", optional: true, },
    bonoVacAgregarMontoCestaTicketsFlag: { type: Boolean, label: "Bono vac: agregar monto cesta tickets?", optional: true, },
    bonoVacacionalMontoAdicional: { type: Number, label: "Bono vac: monto adicional", optional: true, },
    bonoVacAgregarMontoAdicionalFlag: { type: Boolean, label: "Bono vac: agregar monto adicional", optional: true, },
    prestacionesAgregarMontoCestaTicketsFlag: { type: Boolean, label: "Prestaciones: agregar monto de cesta tickets", optional: true, },
    cia: { type: Number, label: "Cia Contab", optional: false, },

    docState: { type: Number, optional: true },
});

export const Empleados = new Mongo.Collection("empleados");
Empleados.attachSchema(simpleSchema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    Empleados._ensureIndex({ empleado: 1 });
}
