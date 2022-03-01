
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let validarChequera = function () {
    // las chequeras del tipo Genérica tienen muchos de sus fields vacíos ...

    let desde = this.field("desde").isSet ? this.field("desde").value : null;
    let hasta = this.field("hasta").isSet ? this.field("hasta").value : null;
    let asignadaA = this.field("asignadaA").isSet ? this.field("asignadaA").value : null;

    if (this.isSet) {
        if (this.value) {
            // la chequera es del tipo genérica
            if (desde || hasta || asignadaA) {
                return `Error: las chequeras <em>genéricas</em> deben tener sus campos: 'desde', 'hasta' y 'asignada a' en blanco.`;
            };
        } else  {
            // chequera del tipo normal; no es genérica ...
            if (!desde || !hasta || !asignadaA) {
                return `Error: las chequeras normales (no <em>genéricas</em>) deben tener un valor en sus campos:
                        'desde', 'hasta' y 'asignada a'.`;
            };
        };
    }

    return true;
}

let chequeras_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    numeroChequera: { type: Number, label: "Número de la chequera", optional: false },
    numeroCuenta: { type: Number, label: "Número cuenta bancaria", optional: false },
    activa: { type: Boolean, label: 'Activa', optional: false },
    generica: { type: Boolean, label: 'Genérica', optional: false, custom: validarChequera,  },
    fechaAsignacion: { type: Date, label: "Fecha de asignación", optional: false, },
    desde: { type: Number, label: "Desde", optional: true },
    hasta: { type: Number, label: "Hasta", optional: true },
    asignadaA: { type: String, label: 'Asignada a', optional: true },
    agotadaFlag: { type: Boolean, label: 'Agotada', optional: true },
    cantidadDeChequesUsados: { type: Number, label: "Cantidad de cheques usados", optional: true, },
    ultimoChequeUsado: { type: Number, label: "Ultimo cheque usado", optional: true },
    cantidadDeCheques: { type: Number, label: "Cantidad de cheques", optional: true },
    usuario: { type: String, label: 'Usuario', optional: false },
    ingreso: { type: Date, label: 'Ingreso', optional: false },
    ultAct: { type: Date, label: "Ult act", optional: false, },
    // las chequeras no contienen estos fields, pero resultan muy útiles en el manejo posterior de las mismas;
    // por eso, los agregamos en 'copiar catálogos'
    numeroCuentaBancaria: { type: String, label: "Número de la cuenta bancaria", optional: false, },
    banco: { type: Number, label: "ID del banco", optional: false, },
    abreviaturaBanco: { type: String, label: "Abreviatura del banco", optional: false, },
    moneda: { type: Number, label: "ID de la moneda", optional: false, },
    simboloMoneda: { type: String, label: "Símbolo de la moneda", optional: false, },
    cia: { type: Number, label: "ID de la Cia Contab", optional: false, },
    docState: { type: Number, optional: true, },
});

export const Chequeras: any = new Mongo.Collection("chequeras");
Chequeras.attachSchema(chequeras_SimpleSchema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    Chequeras._ensureIndex({ numeroChequera: 1 });
}
