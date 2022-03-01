


import SimpleSchema from 'simpl-schema';

// estas tablas no existen en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 
export const CajaChica_Reposiciones_Gastos_SimpleSchema = new SimpleSchema({
    id: { type: SimpleSchema.Integer, label: 'ID', optional: false, },
    reposicion: { type: SimpleSchema.Integer, label: 'Reposición Id', optional: false, },
    rubro: { type: SimpleSchema.Integer, label: 'Rubro', optional: false, },
    descripcion: { type: String, label: 'Descripción', optional: false, min: 1, max: 150, },

    fechaDocumento: { type: Date, label: 'Fecha doc', optional: true, },
    numeroDocumento: { type: String, label: 'Núm doc', optional: true, min: 0, max: 25,  },
    numeroControl: { type: String, label: 'Núm control', optional: true, min: 0, max: 20,  },
    proveedor: { type: SimpleSchema.Integer, label: 'Proveedor', optional: true, },
    nombre: { type: String, label: 'Proveedor', optional: true, min: 0, max: 50, },
    rif: { type: String, label: 'Rif', optional: true, min: 0, max: 20, },
    afectaLibroCompras: { type: Boolean, label: 'Afecta lib compras', optional: true, },
    nombreUsuario: { type: String, label: 'Usuario', optional: false, min: 1, max: 256,  },

    montoNoImponible: { type: Number, label: 'Monto no imp', optional: true, },
    monto: { type: Number, label: 'Monto imp', optional: false, },
    ivaPorc: { type: Number, label: 'Iva%', optional: true, },
    iva: { type: Number, label: 'Iva', optional: true, },
    total: { type: Number, label: 'Total', optional: false },
    
    docState: { type: SimpleSchema.Integer, optional: true, },
})


export const CajaChica_Reposiciones_SimpleSchema = new SimpleSchema({
    reposicion: { type: SimpleSchema.Integer, label: 'Número', optional: false },
    fecha: { type: Date, label: 'Fecha', optional: false, },
    cajaChica: { type: SimpleSchema.Integer, label: 'Caja chica', optional: false,  },
    estadoActual: { type: String, label: 'Estado actual', optional: false, min: 1, max: 2, },
    observaciones: { type: String, label: 'Observaciones', optional: false, min: 1, max: 250, },

    cajaChica_reposicion_gastos: { type: Array, optional: true, minCount: 0 },
    'cajaChica_reposicion_gastos.$': { type: CajaChica_Reposiciones_Gastos_SimpleSchema },

    docState: { type: SimpleSchema.Integer, optional: true, },
})