
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

Temp_Consulta_SaldosContables = new Mongo.Collection("temp_consulta_saldosContables");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    cuentaContableID: { type: Number, label: "Cuenta contable ID", optional: false },
    cuentaContable: { type: String, label: "Cuenta contable", optional: false },
    nombreCuentaContable: { type: String, label: "Cuenta contable", optional: false },
    ano: { type: Number, label: "Año", optional: false },
    moneda: { type: Number, label: 'Moneda', optional: false },
    simboloMoneda: { type: String, label: "Cuenta contable", optional: false },
    descripcionMoneda: { type: String, label: "Cuenta contable", optional: false },
    monedaOriginal: { type: Number, label: "Moneda original", optional: false },
    simboloMonedaOriginal: { type: String, label: "Cuenta contable", optional: false },
    descripcionMonedaOriginal: { type: String, label: "Cuenta contable", optional: false },

    inicial: { type: Number, label: 'Inicial', optional: true, },
    mes01: { type: Number, label: 'Mes 01', optional: true, },
    mes02: { type: Number, label: 'Mes 02', optional: true, },
    mes03: { type: Number, label: 'Mes 03', optional: true, },
    mes04: { type: Number, label: 'Mes 04', optional: true, },
    mes05: { type: Number, label: 'Mes 05', optional: true, },
    mes06: { type: Number, label: 'Mes 06', optional: true, },
    mes07: { type: Number, label: 'Mes 07', optional: true, },
    mes08: { type: Number, label: 'Mes 08', optional: true, },
    mes09: { type: Number, label: 'Mes 09', optional: true, },
    mes10: { type: Number, label: 'Mes 10', optional: true, },
    mes11: { type: Number, label: 'Mes 11', optional: true, },
    mes12: { type: Number, label: 'Mes 12', optional: true, },
    anual: { type: Number, label: 'Anual', optional: true, },

    cia: { type: Number, label: "Cia Contab", optional: false },
    user: { type: String, label: 'Mongo user', optional: false },
});

Temp_Consulta_SaldosContables.attachSchema(schema);
