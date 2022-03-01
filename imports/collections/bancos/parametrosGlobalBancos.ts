

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let schema = new SimpleSchema({
     _id: { type: String, optional: false },
     claveUnica: { type: Number, label: "Clave única", optional: false },
     agregarAsientosContables: { type: Boolean, label: "Agregar asientos contables", optional: false },
     tipoAsientoDefault: { type: String, label: "Tipo de asientos por defecto", optional: false },
     ivaPorc: { type: Number, label: "Porcentaje de iva", optional: false },
     porcentajeITF: { type: Number, label: "Porcentaje de ITF", optional: true, },
     docState: { type: Number, optional: true },
});

export const ParametrosGlobalBancos: any = new Mongo.Collection("parametrosGlobalBancos");
ParametrosGlobalBancos.attachSchema(schema);
