



import SimpleSchema from 'simpl-schema';

// estas tablas no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 
export const nomina_deduccionesIslr_schema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false },
    grupoNomina: { type: Number, label: "Grupo de nómina", optional: true },
    empleado: { type: Number, label: "Empleado", optional: true },
    desde: { type: Date, label: "Desde", optional: false },
    tipoNomina: { type: String, label: "Tipo de nómina", optional: false },
    periodicidad: { type: String, label: "Periodicidad", optional: true },
    porcentaje: { type: Number, label: "Porcentaje", optional: false },
    base: { type: String, label: "Base", optional: false },
    suspendidoFlag: { type: Boolean, label: "Suspendido?", optional: false },
    docState: { type: Number, optional: true },
})
