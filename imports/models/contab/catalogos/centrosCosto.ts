

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// centros de costo (para asientos contables) - Nota: solo para validar en el client al grabar (al menos por ahora)
export const CentrosCosto_SimpleSchema = new SimpleSchema({
    centroCosto: { type: Number, label: "Categoría", optional: false },
    descripcion: { type: String, label: "Descripcion", optional: false, min: 1, max: 30, },
    descripcionCorta: { type: String, label: "Descripcion corta (3x)", optional: false, min: 1, max: 3, },
    suspendido: { type: Boolean, label: "Suspendido?", optional: true, },

    docState: { type: Number, optional: true },
});
