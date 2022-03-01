
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const Proveedores = new Mongo.Collection("proveedores");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    proveedor: { type: Number, label: "ID de la compañía", optional: false },
    nombre: { type: String, label: 'Nombre', optional: false, min: 1, max: 70 },
    abreviatura: { type: String, label: 'Abreviatura', optional: false, min: 1, max: 10 },
    rif: { type: String, label: 'Rif', optional: true, min: 1, max: 20 },
    beneficiario: { type: String, label: 'Beneficiario', optional: true, min: 1, max: 50 },
    concepto: { type: String, label: 'Concepto', optional: true, min: 1, max: 250 },
    montoCheque: { type: Number, label: 'Monto cheque', optional: true },

    monedaDefault: { type: Number, label: 'Moneda por defecto', optional: true },
    formaDePagoDefault: { type: Number, label: 'Forma de pago por defecto', optional: true },
    tipo: { type: Number, label: 'Tipo (de servicio)', optional: false },
    proveedorClienteFlag: { type: Number, label: 'Proveedor o cliente', optional: true },
});

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    Proveedores._ensureIndex({ proveedor: 1 });
}

// ------------------------------------------------------------------------------------------------
// agregamos un schema para validar cuando el usuario registra un proveedor; nótese que el schema de
// arriba es usado, al menos por ahora, solo para leer y grabar (copiar) catálogos desde sql server
// en algún momento tenemos que unificar y tener *un solo schema* y, tal vez, dejar de leer
// proveedores como un catálogo, en copiar catálogos, pues siempre resulta demasiado costoso ...
// ---------------------------------------------------------------------------------------------------
const Personas_SimpleSchema = new SimpleSchema({
    persona: { type: Number, label: 'Persona', optional: false, },
    compania: { type: Number, label: 'Compania', optional: false, },
    nombre: { type: String, label: 'Nombre', optional: false, min: 1, max: 50, },
    apellido: { type: String, label: 'Apellido', optional: false, min: 1, max: 50, },
    cargo: { type: Number, label: 'Cargo', optional: false, },
    titulo: { type: String, label: 'Titulo', optional: false, min: 1, max: 10, },
    rif: { type: String, label: 'Rif', optional: true, min: 0, max: 20, },
    diaCumpleAnos: { type: Number, label: 'Día cumple años', optional: true },
    mesCumpleAnos: { type: Number, label: 'Mes cumple años', optional: true },

    telefono: { type: String, label: 'Teléfono', optional: true, min: 0, max: 25,  },
    departamento: { type: Number, label: 'Departamento', optional: true },
    fax: { type: String, label: 'Fax', optional: true, min: 0, max: 25,  },
    celular: { type: String, label: 'Celular', optional: true, min: 0, max: 25, },
    email: { type: String, label: 'Email', optional: true, min: 0, max: 50, },
    atributo: { type: Number, label: 'Atributo', optional: true },
    notas: { type: String, label: 'Notas', optional: true, min: 0, max: 250, },
    defaultFlag: { type: Boolean, label: 'Default??', optional: true, },

    ingreso: { type: Date, label: 'Ingreso', optional: false },
    ultAct: { type: Date, label: 'Ult act', optional: false },
    usuario: { type: String, label: 'Usuario', optional: false, min: 0, max: 125, },
    docState: { type: Number, optional: true, },
});


export const Proveedores_SimpleSchema = new SimpleSchema({
    proveedor: { type: Number, label: 'Proveedor', optional: false },
    nombre: { type: String, label: 'Nombre', optional: false, min: 1, max: 70, },
    abreviatura: { type: String, label: 'Abreviatura', optional: false, min: 1, max: 10, },
    tipo: { type: Number, label: 'Tipo', optional: false },
    rif: { type: String, label: 'Rif', optional: false, min: 0, max: 20, },
    natJurFlag: { type: Number, label: 'NatJurFlag', optional: false },
    nit: { type: String, label: 'Nit', optional: true, min: 1, max: 20, },
    contribuyenteFlag: { type: Boolean, label: 'ContribuyenteFlag', optional: true },
    contribuyenteEspecialFlag: { type: Boolean, label: 'ContribuyenteEspecialFlag', optional: true },
    retencionSobreIvaPorc: { type: Number, label: 'RetencionSobreIvaPorc', optional: true, },
    nuestraRetencionSobreIvaPorc: { type: Number, label: 'NuestraRetencionSobreIvaPorc', optional: true, },
    afectaLibroComprasFlag: { type: Boolean, label: 'AfectaLibroComprasFlag', optional: true },
    beneficiario: { type: String, label: 'Beneficiario', optional: true, min: 0, max: 50, },
    concepto: { type: String, label: 'Concepto', optional: true, min: 0, max: 250, },
    montoCheque: { type: Number, label: 'MontoCheque', optional: true, },
    direccion: { type: String, label: 'Direccion', optional: true, min: 0, max: 255, },
    ciudad: { type: String, label: 'Ciudad', optional: false, },
    telefono1: { type: String, label: 'Telefono1', optional: true, min: 0, max: 14, },
    telefono2: { type: String, label: 'Telefono2', optional: true, min: 0, max: 14, },
    fax: { type: String, label: 'Fax', optional: true, min: 0, max: 14, },
    contacto1: { type: String, label: 'Contacto1', optional: true, min: 0, max: 50, },
    contacto2: { type: String, label: 'Contacto2', optional: true, min: 0, max: 50, },
    nacionalExtranjeroFlag: { type: Number, label: 'Nac/Ext', optional: false },
    sujetoARetencionFlag: { type: Boolean, label: 'SujetoARetencionFlag', optional: true },
    codigoConceptoRetencion: { type: String, label: 'CodigoConceptoRetencion', optional: true, min: 0, max: 6, },
    retencionISLRSustraendo: { type: Number, label: 'RetencionISLRSustraendo', optional: true, },
    baseRetencionISLR: { type: Number, label: 'BaseRetencionISLR', optional: true, },
    monedaDefault: { type: Number, label: 'Moneda', optional: false },
    formaDePagoDefault: { type: Number, label: 'Forma de pago', optional: false, },
    proveedorClienteFlag: { type: Number, label: 'Proveedor/Cliente', optional: false },
    porcentajeDeRetencion: { type: Number, label: 'PorcentajeDeRetencion', optional: true, },
    aplicaIvaFlag: { type: Boolean, label: 'AplicaIvaFlag', optional: true },
    categoriaProveedor: { type: Number, label: 'CategoriaProveedor', optional: true },
    montoChequeEnMonExtFlag: { type: Boolean, label: 'MontoChequeEnMonExtFlag', optional: true },
    lote: { type: String, label: 'Lote', optional: true, min: 0, max: 50, },
    ingreso: { type: Date, label: 'Ingreso', optional: false },
    ultAct: { type: Date, label: 'UltAct', optional: false },
    usuario: { type: String, label: 'Usuario', optional: false, min: 1, max: 125, },

    personas: { type: Array, optional: true, minCount: 0 },
    'personas.$': { type: Personas_SimpleSchema },

    docState: { type: Number, optional: true, },
});
                
