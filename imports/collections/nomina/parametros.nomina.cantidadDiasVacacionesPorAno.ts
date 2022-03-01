

import SimpleSchema from 'simpl-schema';

// estas tablas no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 
export const vacacPorAnoGenericas_schema = new SimpleSchema({
    claveUnica: { type: Number, label: "ID", optional: false },
    ano: { type: Number, label: "Año", optional: false },
    dias: { type: Number, label: "Cantidad días", optional: false },
    diasAdicionales: { type: Number, label: "Cantidad días adicionales", optional: true },
    diasBono: { type: Number, label: "Cantidad días bono", optional: true },
    docState: { type: Number, optional: true },
})

export const vacacPorAnoParticulares_schema = new SimpleSchema({
    claveUnica: { type: Number, label: "ID", optional: false },
    empleado: { type: Number, label: "Empleado", optional: false },
    ano: { type: Number, label: "Año", optional: false },
    dias: { type: Number, label: "Cantidad días", optional: false },
    diasAdicionales: { type: Number, label: "Cantidad días adicionales", optional: true },
    diasBono: { type: Number, label: "Cantidad días bono", optional: true },
    docState: { type: Number, optional: true },
})
