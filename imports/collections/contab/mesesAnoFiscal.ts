
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    id: { type: Number, optional: false },
    mesFiscal: { type: Number, label: 'Mes fiscal', optional: false },
    mesCalendario: { type: Number, label: 'Mes calendario', optional: false },
    nombreMes: { type: String, label: 'Mes (nombre)', optional: false },
    ano: { type: Number, label: 'Año', optional: false },
    cia: { type: Number, label: "Cia Contab", optional: false },
    docState: { type: Number, optional: true },
});

export const MesesDelAnoFiscal: any = new Mongo.Collection("mesesDelAnoFiscal");
MesesDelAnoFiscal.attachSchema(simpleSchema);
