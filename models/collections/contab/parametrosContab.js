
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// NOTA IMPORTANTE: nótese que, al menos por ahora, este collection no existe en mongo; lo leemos y actualizamos en forma
// directa desde sql server; sin embargo, agregamos un schema para validar cuando el usuario edita el registro  ...
ParametrosContab = new Mongo.Collection("parametrosContab");

let schema = new SimpleSchema({
    _id: { type: String, label: "_id", optional: true },        // es optional solo porque no exsite, realmente, en mongo!!!

    activo1: { type: Number, label: 'Cuenta de activo #1', optional: true, },
    activo2: { type: Number, label: 'Cuenta de activo #2', optional: true, },

    pasivo1: { type: Number, label: 'Cuenta de activo #2', optional: true, },
    pasivo2: { type: Number, label: 'Cuenta de activo #2', optional: true, },

    capital1: { type: Number, label: 'Cuenta de activo #2', optional: true, },
    capital2: { type: Number, label: 'Cuenta de activo #2', optional: true, },

    ingresos1: { type: Number, label: 'Cuenta de activo #2', optional: true, },
    ingresos2: { type: Number, label: 'Cuenta de activo #2', optional: true, },

    egresos1: { type: Number, label: 'Cuenta de activo #2', optional: true, },
    egresos2: { type: Number, label: 'Cuenta de activo #2', optional: true, },

    cuentaGyP: { type: Number, label: 'Cuenta para contabilizar GyP', optional: true, },

    multiMoneda: { type: Boolean, label: 'MultiMoneda?', optional: true, },
    moneda1: { type: Number, label: 'Moneda #1', optional: true, },
    moneda2: { type: Number, label: 'Moneda #2', optional: true, },
    moneda3: { type: Number, label: 'Moneda #3', optional: true, },

    numeracionAsientosSeparadaFlag: { type: Boolean, label: 'Numeración de asientos se separa por tipo?', optional: true, },
    cierreContabPermitirAsientosDescuadrados: { type: Boolean, label: 'Permitir asientos descuadrados en el cierre?', optional: true, },

    cia: { type: Number, label: 'Cia contab', optional: false, },
    docState: { type: Number, optional: true, },
});

ParametrosContab.attachSchema(schema);
