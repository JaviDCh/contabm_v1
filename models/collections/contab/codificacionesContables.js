
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// -------------------------------------------------------------------------------------------------------
// *** CodificacionesContables_codigos_cuentasContables ***
let cuentaContable_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    codificacionContable_ID: { type: String, label: 'ID de la codificación contable', optional: false },
    codigoContable_ID: { type: String, label: 'ID del codigo contable', optional: false },
    id: { type: Number, label: 'Cuenta contable ID', optional: false },
    cia: { type: Number, label: "Cia Contab", optional: false },
    docState: { type: Number, optional: true },
});

CodificacionesContables_codigos_cuentasContables = new Mongo.Collection("codificacionesContables_codigos_cuentasContables");
CodificacionesContables_codigos_cuentasContables.attachSchema(cuentaContable_SimpleSchema);

let codigoContable_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    codificacionContable_ID: { type: String, label: 'ID de la codificación contable', optional: false },
    codigo: { type: String, label: 'Código', optional: false },
    descripcion: { type: String, label: 'Descripción', optional: false },
    detalle: { type: Boolean, label: "Tipo detalle?", optional: false },
    suspendido: { type: Boolean, label: "Suspendido?", optional: false },
    // cuentasContables: { type: [cuentaContable_SimpleSchema], label: "Cuentas contables", optional: true, minCount: 0 },
    // resumen: { type: [resumen_SimpleSchema], label: "Resumen", optional: true, minCount: 0 },
    cia: { type: Number, label: "Cia Contab", optional: false },
    docState: { type: Number, optional: true },
});

CodificacionesContables_codigos = new Mongo.Collection("codificacionesContables_codigos");
CodificacionesContables_codigos.attachSchema(codigoContable_SimpleSchema);

// -------------------------------------------------------------------------------------------------------
// *** CodificacionesContables ***
let codificacionContable_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    descripcion: { type: String, label: 'Descripción', optional: false },
    cia: { type: Number, label: "Cia Contab", optional: false },
    // codigosContables: { type: [codigoContable_SimpleSchema], optional: true, minCount: 0 },
    docState: { type: Number, optional: true },
});

CodificacionesContables = new Mongo.Collection("codificacionesContables");
CodificacionesContables.attachSchema(codificacionContable_SimpleSchema);

// -------------------------------------------------------------------------------------------------------
// *** CodificacionesContables_movimientos ***
let movimientos_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    codificacionContable_ID: { type: String, label: 'ID de la codificación contable', optional: false },

    simboloMoneda: { type: String, label: "Simbolo moneda", optional: false },
    // codigoContable_ID: { type: String, label: 'Código contable ID', optional: false },           // uno de los códigos de la codificación
    // cuentaContable_ID: { type: Number, label: 'Cuenta contable ID', optional: false },

    codigoContable: { type: String, label: "Código contable", optional: false },
    nombreCodigoContable: { type: String, label: "Código contable - Descripción", optional: false },

    cuentaContable: { type: String, label: "Cuenta contable", optional: false },
    nombreCuentaContable: { type: String, label: "Cuenta contable - Descripción", optional: false },
    // moneda: { type: Number, label: 'moneda', optional: false },
    // simboloMoneda: { type: String, label: "Simbolo moneda", optional: false },
    // monedaOriginal: { type: Number, label: 'moneda original', optional: false },

    fecha: { type: Date, label: 'Fecha', optional: false },
    simboloMonedaOriginal: { type: String, label: "Simbolo moneda original", optional: false },

    comprobante: { type: Number, label: 'Comprobante', optional: true },
    descripcion: { type: String, label: 'Descripción', optional: true },
    referencia: { type: String, label: 'Referencia', optional: true },
    saldoInicial: { type: Number, label: 'Saldo inicial', optional: false },
    debe: { type: Number, label: 'Debe', optional: false },
    haber: { type: Number, label: 'Haber', optional: false },
    saldo: { type: Number, label: 'Saldo', optional: false },

    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: "Usuario", optional: false },
});

CodificacionesContables_movimientos = new Mongo.Collection("codificacionesContables_movimientos");
CodificacionesContables_movimientos.attachSchema(movimientos_SimpleSchema);
