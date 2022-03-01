
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// categorías de retención
let simpleSchema = new SimpleSchema({
    categoria: { type: Number, label: "Categoría", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 30, },
    tipoPersona: { type: String, label: "Tipo de persona (nat/jur)", optional: true, min: 1, max: 6, },
    fechaAplicacion: { type: Date, label: "Fecha de aplicación", optional: true, },
    codigoIslr: { type: String, label: "Código de retención Islr", optional: true, min: 1, max: 6, },
    porcentajeRetencion: { type: Number, label: "Porcentaje de retención", optional: true, },
    aplicaSustraendo: { type: Boolean, label: "Aplica sustraendo?", optional: true, },
    minimo: { type: Number, label: "Mínimo para aplicar retención de Islr", optional: true, },

    docState: { type: Number, optional: true },
});

export const CategoriasRetencion = new Mongo.Collection("categoriasRetencion");
CategoriasRetencion.attachSchema(simpleSchema);

