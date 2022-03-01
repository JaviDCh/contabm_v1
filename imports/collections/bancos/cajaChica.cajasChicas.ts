


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// esta tabla no existe en mongo; asociamos un schema para validar cuando el usuario edita mediante la página... 
export const CajaChica_CajasChicas_SimpleSchema = new SimpleSchema({
    cajaChica: { type: SimpleSchema.Integer, label: "Caja chica ID", optional: false },
    descripcion: { type: String, label: "Descripción", min: 1, max: 50, optional: false },
    ciaContab: { type: SimpleSchema.Integer, label: "Cia contab", optional: false },
    docState: { type: SimpleSchema.Integer, optional: true, }
})

// esta tabla no existe en mongo; asociamos un schema para validar cuando el usuario edita mediante la página... 
export const CajaChica_Rubros_SimpleSchema = new SimpleSchema({
    rubro: { type: SimpleSchema.Integer, label: "Rubro", optional: false },
    descripcion: { type: String, label: "Descripción", min: 1, max: 50, optional: false },
    docState: { type: SimpleSchema.Integer, optional: true, }
})

// esta tabla no existe en mongo; asociamos un schema para validar cuando el usuario edita mediante la página... 
export const CajaChica_RubrosCuentasContables_SimpleSchema = new SimpleSchema({
    id: { type: SimpleSchema.Integer, label: "ID", optional: false },
    rubro: { type: SimpleSchema.Integer, label: "Rubro", optional: false },
    cuentaContableID: { type: SimpleSchema.Integer, label: "Cuenta contable", optional: false },
    docState: { type: SimpleSchema.Integer, optional: true, }
})

// esta tabla no existe en mongo; asociamos un schema para validar cuando el usuario edita mediante la página... 
export const CajaChica_Parametros_SimpleSchema = new SimpleSchema({
    id: { type: SimpleSchema.Integer, label: "ID", optional: false },
    tipoAsiento: { type: String, label: "Tipo de asiento", optional: false },
    cuentaContablePuenteID: { type: SimpleSchema.Integer, label: "Cuenta contable 'puente' de caja chica", optional: false },
    cia: { type: SimpleSchema.Integer, label: "Cia contab", optional: false },
    docState: { type: SimpleSchema.Integer, optional: true, }
})

