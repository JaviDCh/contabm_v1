
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// Formas de pago
let formasDePago_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    formaDePago: { type: Number, label: "forma de pago ID", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false },
    numeroDeCuotas: { type: Number, label: "Cant de cuotas", optional: false },
});

export const FormasDePago: any = new Mongo.Collection("formasDePago");
FormasDePago.attachSchema(formasDePago_SimpleSchema);


// Tipos de proveedor
let tiposProveedor_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    tipo: { type: Number, label: "Tipo ID", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false },
});

export const TiposProveedor: any = new Mongo.Collection("tiposProveedor");
TiposProveedor.attachSchema(tiposProveedor_SimpleSchema);

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    TiposProveedor._ensureIndex({ tipo: 1 });
}
