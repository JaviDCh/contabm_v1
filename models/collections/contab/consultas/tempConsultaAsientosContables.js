
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

Temp_Consulta_AsientosContables = new Mongo.Collection("temp_consulta_asientosContables");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    numeroAutomatico: { type: Number, label: "Número automático", optional: false },
    numero: { type: Number, label: "Número", optional: false },
    tipo: { type: String, label: 'Tipo', optional: false },
    fecha: { type: Date, label: "Fecha", optional: false },
    descripcion: { type: String, label: 'Descripción', optional: true },
    moneda: { type: Number, label: "Moneda", optional: false },
    monedaOriginal: { type: Number, label: "Moneda original", optional: false },
    provieneDe: { type: String, label: 'Proviene de', optional: true },
    asientoTipoCierreAnualFlag: { type: Boolean, label: "Cierre anual?", optional: true },
    factorDeCambio: { type: Number, optional: false, },
    cantidadPartidas: { type: Number, optional: false, },
    totalDebe: { type: Number, optional: true, },
    totalHaber: { type: Number, optional: true, },
    ingreso: { type: Date, label: "Ingreso", optional: false },
    ultAct: { type: Date, label: "UltAct", optional: false },
    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Consulta_AsientosContables.attachSchema(schema);
