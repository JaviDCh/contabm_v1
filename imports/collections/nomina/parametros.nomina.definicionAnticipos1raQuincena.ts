
import SimpleSchema from 'simpl-schema';

// estas tablas no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 
export const nomina_DefinicionAnticipos_schema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false },
    grupoNomina: { type: Number, label: "Grupo de nómina", optional: false },
    desde: { type: Date, label: "Desde", optional: false },
    suspendido: { type: Boolean, label: "Suspendido?", optional: false },
    primQuincPorc: { type: Number, label: "Porcentaje de anticipo", optional: true },
    docState: { type: Number, optional: true },
})

export const nomina_DefinicionAnticipos_empleados_schema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false },
    definicionAnticiposID: { type: Number, label: "ID en anticipos generales", optional: false },
    empleado: { type: Number, label: "Empleado", optional: false },
    suspendido: { type: Boolean, label: "Suspendido?", optional: false },
    primQuincPorc: { type: Number, label: "Porcentaje de anticipo", optional: true },
    docState: { type: Number, optional: true },
})
