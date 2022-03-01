
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// -----------------------------------------------------------------------
// filtros
// -----------------------------------------------------------------------
var schema = new SimpleSchema({
    _id: { type: String, optional: false },
    userId: { type: String, optional: false },
    nombre: { type: String, optional: false },
    filtro: { type: Object, optional: true, blackbox: true },
    reportConfig: { type: Object, optional: true, blackbox: true },
});

export const Filtros: any = new Mongo.Collection("filtros");
Filtros.attachSchema(schema);
