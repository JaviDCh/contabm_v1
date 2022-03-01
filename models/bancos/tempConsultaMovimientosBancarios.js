
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    transaccion: { type: Number, label: "Número movimiento", optional: false },
    tipo: { type: String, label: "Tipo", optional: false },
    fecha: { type: Date, label: "Fecha", optional: false },
    banco: { type: String, label: "Banco", optional: false },
    cuentaBancaria: { type: String, label: "Cuenta bancaria", optional: false },
    moneda: { type: String, label: "Moneda", optional: true },
    beneficiario: { type: String, label: 'Beneficiario', optional: false },
    concepto: { type: String, label: 'Concepto', optional: true },
    monto: { type: Number, label: "Monto", optional: false },
    fechaEntregado: { type: Date, label: "Fecha entregado", optional: true },
    claveUnica: { type: Number, label: "Clave única", optional: false },
    usuario: { type: String, label: "Usuario", optional: true },
    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Consulta_Bancos_MovimientosBancarios = new Mongo.Collection("temp_consulta_bancos_movimientosBancarios");
Temp_Consulta_Bancos_MovimientosBancarios.attachSchema(schema);
