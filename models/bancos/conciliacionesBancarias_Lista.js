
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    conciliacionID: { type: String, optional: false },
    desde: { type: Date, label: "Fecha", optional: false },
    hasta: { type: Date, label: "Fecha", optional: false },
    banco: { type: Number, label: "Banco ID", optional: false },
    nombreBanco: { type: String, label: "Banco", optional: false },
    moneda: { type: Number, label: "Número movimiento", optional: false },
    simboloMoneda: { type: String, label: "Moneda", optional: false },
    cuentaBancariaID: { type: Number, label: "Cuenta bancaria", optional: false },
    cuentaBancaria: { type: String, label: "Cuenta bancaria", optional: false },
    observaciones: { type: String, label: "Observaciones", optional: true },
    cia: { type: Number, label: "Cia Contab", optional: false },
    nombreCia:  { type: String, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Bancos_ConciliacionesBancarias_Lista = new Mongo.Collection("temp_bancos_conciliacionesBancarias_lista");
Temp_Bancos_ConciliacionesBancarias_Lista.attachSchema(schema);
