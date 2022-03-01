
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// nótese 'any' para que TS no falle luego cuando se intente asociar el schema (collection.attachSchema) ...
export const CompaniaSeleccionada:any = new Mongo.Collection("companiaSeleccionada");

var schema = new SimpleSchema({
    companiaID: { type: String,label: "Compañía", optional: false },
    userID: { type: String, label: "Usuario", optional: false}
});

CompaniaSeleccionada.attachSchema(schema);
