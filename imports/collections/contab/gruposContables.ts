
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, label: "_id", optional: false },
    grupo: { type: Number, label: "Grupo", optional: false },
    descripcion: { type: String, label: "Descripción", optional: false, min: 1 },
    ordenBalanceGeneral: { type: Number, label: "Orden en el balance general", optional: false },
    docState: { type: Number, optional: true },
});

export const GruposContables: any = new Mongo.Collection("gruposContables");
GruposContables.attachSchema(schema);
