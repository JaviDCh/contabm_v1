
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
    _id: { type: String, label: "_id", optional: false },
    usuario: { type: String, label: "Usuario ID", optional: false },
    filtro: { type: String, label: "Filtro para consultas Contab", optional: false },
    cia: { type: Number, label: "Cia Contab", optional: false },
    docState: { type: Number, optional: true },
});

FiltrosConsultasContab = new Mongo.Collection("filtrosConsultasContab");
FiltrosConsultasContab.attachSchema(schema);
