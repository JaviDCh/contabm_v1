
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    desde: { type: Date, label: 'Desde', optional: false, },
    hasta: { type: Date, label: 'Hasta', optional: false, },
    cuentaBancaria: { type: Number, label: 'Cuenta bancaria ID', optional: false, },
    cuentaContable: { type: Number, label: 'Cuenta contable ID', optional: true, },
    moneda: { type: Number, label: 'Moneda ID', optional: false, },
    banco: { type: Number, label: 'Banco ID', optional: false, },
    observaciones: { type: String, label: 'Observaciones', optional: true, },
    cia: { type: Number, label: 'Cia Contab ID', optional: false, },

    docState: { type: Number, optional: true },

    ingreso: { type: Date, label: 'Fecha de registro', optional: false, },
    usuario: { type: String, label: 'Usuario', optional: false, },
    ultMod: { type: Date, label: 'Fecha de última modificación', optional: false, },
});

export const ConciliacionesBancarias: any = new Mongo.Collection("conciliacionesBancarias");
ConciliacionesBancarias.attachSchema(schema);


// -------------------------------------------------------------------------------------------------------------
let schemaMovimientosPropios = new SimpleSchema({
    _id: { type: String, optional: false, },
    conciliacionID: { type: String, optional: false, },
    consecutivo: { type: Number, label: 'Número consecutivo asignado', optional: false, },
    numero: { type: Number, label: 'Número', optional: false, },
    tipo: { type: String, label: 'Tipo', optional: false, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    beneficiario: { type: String, label: 'Beneficiario', optional: false, },
    concepto: { type: String, label: 'Concepto', optional: false, },
    monto: { type: Number, label: 'Monto', optional: false, },
    fechaEntregado: { type: Date, label: 'Fecha de entrega', optional: true, },
    conciliado: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovBanco: { type: Number, label: 'Número consecutivo mov banco', optional: true, },
});

export const ConciliacionesBancarias_movimientosPropios: any = new Mongo.Collection("conciliacionesBancarias_movimientosPropios");
ConciliacionesBancarias_movimientosPropios.attachSchema(schemaMovimientosPropios);


// -------------------------------------------------------------------------------------------------------------
let schemaMovimientosCuentaContable = new SimpleSchema({
    _id: { type: String, optional: false, },
    conciliacionID: { type: String, optional: false, },
    consecutivo: { type: Number, label: 'Número consecutivo asignado', optional: false, },
    comprobante: { type: Number, label: 'Número comprobante', optional: false, },
    partida: { type: Number, label: 'Número partida', optional: false, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    descripcionComprobante: { type: String, label: 'Descripción comprobante', optional: true, },
    descripcionPartida: { type: String, label: 'Descripción partida', optional: false, },
    referencia: { type: String, label: 'Concepto', optional: true, },
    monto: { type: Number, label: 'Monto', optional: false, },

    conciliado: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovBanco: { type: Number, label: 'Número consecutivo mov banco', optional: true, },
});

export const ConciliacionesBancarias_movimientosCuentaContable: any = new Mongo.Collection("conciliacionesBancarias_movimientosCuentaContable");
ConciliacionesBancarias_movimientosCuentaContable.attachSchema(schemaMovimientosCuentaContable);


// ---------------------------------------------------------------------------------------------
let schemaMovimientosBanco = new SimpleSchema({
    _id: { type: String, optional: false, },
    conciliacionID: { type: String, optional: false, },
    consecutivo: { type: Number, label: 'Número consecutivo asignado', optional: false, },
    numero: { type: Number, label: 'Número', optional: true, },
    tipo: { type: String, label: 'Tipo', optional: true, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    beneficiario: { type: String, label: 'Beneficiario', optional: true, },
    concepto: { type: String, label: 'Concepto', optional: true, },
    monto: { type: Number, label: 'Monto', optional: false, },

    // fields para conciliar contra movimientos propios ...
    conciliado: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovPropio: { type: Number, label: 'Número consecutivo mov propio', optional: true, },

    // fields para conciliar contra movimientos contables (desde la cuenta contable en la contabilidad)
    conciliadoContab: { type: String, label: 'Conciliado (si/no)?', optional: true, },
    consecutivoMovContab: { type: Number, label: 'Número consecutivo mov propio', optional: true, },
});

export const ConciliacionesBancarias_movimientosBanco: any = new Mongo.Collection("conciliacionesBancarias_movimientosBanco");
ConciliacionesBancarias_movimientosBanco.attachSchema(schemaMovimientosBanco);
