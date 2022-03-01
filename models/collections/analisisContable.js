
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

AnalisisContable = new Mongo.Collection("analisisContable");

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    descripcion: { type: String, label: "Descripción", optional: false },
    multiCia: { type: Boolean, label: "Multi cia", optional: true },
    cias: { type: Array, label: "Compañías", optional: true },
    'cias.$': { type: String },
    cia: { type: String, label: "Cia contab", optional: false },
    docState: { type: Number, optional: true },
});

AnalisisContable.attachSchema(schema);

// ------------------------------------------------------------------------------

AnalisisContableCuentasContables = new Mongo.Collection("analisisContableCuentasContables");

let schema2 = new SimpleSchema({
    _id: { type: String, optional: false },
    analisisContableID: { type: String, optional: false },
    cuentaContableID: { type: Number, optional: false },                // el ID en la tabla (sql) Contab
    tags: { type: Array, label: "Tags", optional: true },
    'tags.$': { type: String },
    docState: { type: Number, optional: true },
});

AnalisisContableCuentasContables.attachSchema(schema2);
