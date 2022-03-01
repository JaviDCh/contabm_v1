
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let pagos_SimpleSchema = new SimpleSchema({
    claveUnica: { type: Number, label: 'ClaveUnica', optional: false },
    proveedor: { type: Number, label: 'Compañía (proveedor o cliente)', optional: false },
    moneda: { type: Number, label: 'Moneda', optional: false },
    numeroPago: { type: String, label: 'Número del pago', optional: true },
    anticipoFlag: { type: Boolean, label: 'Anticipo?', defaultValue: false, optional: false },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    monto: { type: Number, label: 'Monto', optional: true },
    concepto: { type: String, label: 'Concepto', optional: false },
    miSuFlag: { type: Number, label: 'Mi pago o su pago', optional: false },
    ingreso: { type: Date, label: 'Ingreso', optional: false },
    ultAct: { type: Date, label: 'UltAct', optional: false },
    usuario: { type: String, label: 'Usuario', optional: false },
    cia: { type: Number, label: 'Cia', optional: false },

    docState: { type: Number, optional: true },
    }, {
          clean: {
            autoConvert: true,
            removeEmptyStrings: true,
            trimStrings: true,
            getAutoValues: true,
            removeNullsFromArrays: true, }
});

Pagos = new Mongo.Collection("pagos");
Pagos.attachSchema(pagos_SimpleSchema);
