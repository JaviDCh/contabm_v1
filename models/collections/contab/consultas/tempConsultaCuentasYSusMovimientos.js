
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    cuentaContableID: { type: Number, label: "Cuenta contable ID", optional: false },
    cuentaContable: { type: String, label: "Cuenta contable", optional: false },
    nombreCuentaContable: { type: String, label: "Cuenta contable - descripción", optional: false },

    monedaID: { type: Number, label: "MonedaID", optional: false },
    simboloMoneda: { type: String, label: "Simbolo moneda", optional: false },

    cantidadMovimientos: { type: Number, label: 'cant movtos', optional: false, },
    saldoInicial: { type: Number, label: 'Saldo inicial', optional: false, },
    debe: { type: Number, label: 'Total debe', optional: false, },
    haber: { type: Number, label: 'Total haber', optional: false, },
    saldoFinal: { type: Number, label: 'Saldo final', optional: false, },

    // ahora grabamos los movimientos en una tabla separada
    // movimientos: { type: [movimientosSimpleSchema], optional: true, minCount: 0 },

    cia: { type: Number, label: "Cia Contab", optional: false, },
    user: { type: String, label: 'Mongo user', optional: false, },
});

Temp_Consulta_Contab_CuentasYSusMovimientos = new Mongo.Collection("temp_consulta_contab_cuentasYSusMovimientos");
Temp_Consulta_Contab_CuentasYSusMovimientos.attachSchema(schema);

// en un collection separado, registramos los movimientos para cada cuenta

let movimientosSimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    registroCuentaContableID: { type: String, optional: false, },
    fecha: { type: Date, label: "Fecha del asiento", optional: false, },
    numeroAsiento: { type: Number, label: "Número del asiento", optional: false, },
    tipoAsiento: { type: String, label: "Tipo del asiento", optional: false, },
    monedaOriginalID: { type: Number, label: "moneda original (ID)", optional: false, },
    simboloMonedaOriginal: { type: String, label: "Simbolo moneda orig", optional: false, },
    descripcion: { type: String, label: "Descripción del asiento", optional: false, },
    referencia: { type: String, label: 'Referencia del asiento', optional: true, },
    debe: { type: Number, label: 'Debe', optional: false, },
    haber: { type: Number, label: 'Haber', optional: false, },
    monto: { type: Number, label: 'Monto', optional: false, },
    asientoTipoCierreAnualFlag: { type: Boolean, label: 'Cierre anual?', optional: true, },
    user: { type: String, label: 'Mongo user', optional: false, },
});

Temp_Consulta_Contab_CuentasYSusMovimientos2 = new Mongo.Collection("temp_consulta_contab_cuentasYSusMovimientos2");
Temp_Consulta_Contab_CuentasYSusMovimientos2.attachSchema(movimientosSimpleSchema);
