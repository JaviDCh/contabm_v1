

import SimpleSchema from 'simpl-schema';

// estas tablas no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 
export const nomina_deduccionesNomina_schema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false },
    tipo: { type: String, label: "Tipo de deducción", optional: false },
    desde: { type: Date, label: "Desde", optional: false },
    cia: { type: Number, label: "Cia Contab", optional: true },
    grupoNomina: { type: Number, label: "Grupo de nómina", optional: true },
    grupoEmpleados: { type: Number, label: "Grupo de empleados", optional: true },
    empleado: { type: Number, label: "Empleado", optional: true },
    aporteEmpleado: { type: Number, label: "Aporte del empleado", optional: false },
    aporteEmpresa: { type: Number, label: "Aporte de la empresa", optional: false },
    base: { type: String, label: "Base", optional: false },
    tope: { type: Number, label: "Tope", optional: true },
    topeBase: { type: String, label: "Base para el tope", optional: true },
    suspendidoFlag: { type: Boolean, label: "Suspendido?", optional: false },
    docState: { type: Number, optional: true },
})

