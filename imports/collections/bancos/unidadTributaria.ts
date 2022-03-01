


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    fecha: { type: Date, label: "Fecha", optional: false, },
    monto: { type: Number, label: "Monto", optional: false, },
    factor: { type: Number, label: "Factor", optional: false, },
    docState: { type: Number, optional: true, }
});

export const UnidadTributaria: any = new Mongo.Collection("unidadTributaria");
UnidadTributaria.attachSchema(schema);

