
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// solo para registrar movimientos bancarios para el proceso de agregar itf a movimientos que existen

MovimientosBancarios = new Mongo.Collection("movimientosBancarios");

let schema = new SimpleSchema({

    // aunque es mongo este valor nunca debería faltar, para validar lo que leemos desde sql server
    // debemos  ponerlo como 'opcional'
    _id: { type: String, optional: true, },

    transaccion: { type: Number, label: 'Número', optional: false, },
    tipo: { type: String, label: 'Tipo', optional: false, },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    provClte: { type: Number, label: 'Compañía', optional: true, },
    beneficiario: { type: String, label: 'Beneficiario', optional: false, },
    concepto: { type: String, label: 'Concepto', optional: false, },
    signo: { type: Boolean, label: 'Signo', optional: false, },
    montoBase: { type: Number, label: 'Monto base', optional: true, },
    comision: { type: Number, label: 'Comisión', optional: true, },
    impuestos: { type: Number, label: 'Impuesto', optional: true, },
    monto: { type: Number, label: 'Monto', optional: false, },
    ingreso: { type: Date, label: 'Fecha de ingreso', optional: false, },
    ultMod: { type: Date, label: 'Fecha de ult mod', optional: false, },
    usuario: { type: String, label: 'Usuario', optional: false, },
    // a veces grabamos en mongo *antes* que sql; en estos casos, el movimiento no tiene claveUnica (pk)
    claveUnica: { type: Number, label: 'ID del movimiento', optional: true, },
    claveUnicaChequera: { type: Number, label: 'Chequera', optional: false, },
    fechaEntregado: { type: Date, label: 'Fecha de entrega', optional: true, },
    pagoID: { type: Number, label: 'ID del pago asociado', optional: true },

    // aunque es mongo este valor nunca debería faltar, para validar lo que leemos desde sql server
    // debemos  ponerlo como 'opcional'
    user: { type: String, label: 'Número', optional: true, },
    docState: { type: Number, label: 'Número', optional: true },

    agregarITF: { type: Boolean, optional: true },          // solo para uso del proceso que genera el impuesto (itf)
    banco: { type: String, optional: true, },               // redunda; existe en bancos
    cuentaBancaria: { type: String, optional: true, },      // redunda; existe en bancos.agencias.cuentasBancarias
});

MovimientosBancarios.attachSchema(schema);
