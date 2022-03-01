

import SimpleSchema from 'simpl-schema';

// estas tablas no existen en mongo; creamos este schema para validar cuando el usuario edita ... 
// aunque las tablas solo existen en sql, estos schemas nos ayudan a validar que los datos sean correctos. 

export const ActivosFijos_SimpleSchema = new SimpleSchema({
    claveUnica: { type: SimpleSchema.Integer, label: 'Clave única', optional: false },

    producto: { type: String, label: 'Producto', optional: true, min: 0, max: 15, },
    tipo: { type: SimpleSchema.Integer, label: 'Tipo', optional: false },
    departamento: { type: SimpleSchema.Integer, label: 'Departamento', optional: false },
    descripcion: { type: String, label: 'Descripción', optional: true, min: 0, max: 255, },
    compradoA: { type: String, label: 'Comprado a', optional: true, min: 0, max: 255, },
    proveedor: { type: SimpleSchema.Integer, label: 'Proveedor', optional: true, },

    serial: { type: String, label: 'Serial', optional: true, min: 0, max: 255, },
    modelo: { type: String, label: 'Modelo', optional: true, min: 0, max: 255, },
    placa: { type: String, label: 'Placa', optional: true, min: 0, max: 255, },
    factura: { type: String, label: 'Factura', optional: true, min: 0, max: 255, },

    fechaCompra: { type: Date, label: 'Fecha de compra', optional: false, },

    costoTotal: { type: Number, label: 'Costo total', optional: false },
    valorResidual: { type: Number, label: 'Valor residual', optional: false },
    montoADepreciar: { type: Number, label: 'Monto a depreciar', optional: false },
    numeroDeAnos: { type: Number, label: 'Cantidad de años', optional: false },

    fechaDesincorporacion: { type: Date, label: 'Fecha de desincorporación', optional: true, },
    desincorporadoFlag: { type: Boolean, label: 'Desincorporado?', optional: true, },
    autorizadoPor: { type: SimpleSchema.Integer, label: 'Autorizado por', optional: true, },
    motivoDesincorporacion: { type: String, label: 'Motivo de desincorporación', optional: true, min: 0, max: 500, },

    depreciarDesdeMes: { type: SimpleSchema.Integer, label: 'Depreciar desde - mes', optional: false, },
    depreciarDesdeAno: { type: SimpleSchema.Integer, label: 'Depreciar desde - año', optional: false, },
    depreciarHastaMes: { type: SimpleSchema.Integer, label: 'Depreciar hasta - mes', optional: false, },
    depreciarHastaAno: { type: SimpleSchema.Integer, label: 'Depreciar hasta - año', optional: false, },
    cantidadMesesADepreciar: { type: SimpleSchema.Integer, label: 'Cant meses a depreciar', optional: false, },
    montoDepreciacionMensual: { type: Number, label: 'Monto depreciación mensual', optional: false, },

    ingreso: { type: Date, label: 'Ingreso', optional: false, },
    ultAct: { type: Date, label: 'Ultima actialización', optional: false, },
    usuario: { type: String, label: 'Usuario', optional: false, min: 1, max: 125, },
    cia: { type: SimpleSchema.Integer, label: 'Cia contab', optional: false, },

    docState: { type: SimpleSchema.Integer, optional: true, },
})