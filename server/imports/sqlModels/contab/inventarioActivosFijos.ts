


import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const InventarioActivosFijos_sql = sequelize.define('inventarioActivosFijos', {

    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false, },
    
    producto: { type: Sequelize.STRING, field: 'Producto', allowNull: true, validate: { len: [1, 15] },},
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false, },
    departamento: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: true, validate: { len: [1, 255] },},
    compradoA: { type: Sequelize.STRING, field: 'CompradoA', allowNull: true, validate: { len: [1, 255] },},
    proveedor: { type: Sequelize.INTEGER, field: 'Proveedor', allowNull: true, },

    serial: { type: Sequelize.STRING, field: 'Serial', allowNull: true, validate: { len: [1, 255] },},
    modelo: { type: Sequelize.STRING, field: 'Modelo', allowNull: true, validate: { len: [1, 255] },},
    placa: { type: Sequelize.STRING, field: 'Placa', allowNull: true, validate: { len: [1, 255] },},
    factura: { type: Sequelize.STRING, field: 'Factura', allowNull: true, validate: { len: [1, 255] },},

    fechaCompra: { type: Sequelize.DATE, field: 'FechaCompra', allowNull: false, },

    costoTotal: { type: Sequelize.DECIMAL(12, 2), field: 'CostoTotal', allowNull: false, },
    valorResidual: { type: Sequelize.DECIMAL(12, 2), field: 'ValorResidual', allowNull: false, },
    montoADepreciar: { type: Sequelize.DECIMAL(12, 2), field: 'MontoADepreciar', allowNull: false, },
    numeroDeAnos: { type: Sequelize.DECIMAL(5, 2), field: 'NumeroDeAnos', allowNull: false, },

    fechaDesincorporacion: { type: Sequelize.DATE, field: 'FechaDesincorporacion', allowNull: true, },
    desincorporadoFlag: { type: Sequelize.BOOLEAN, field: 'DesincorporadoFlag', allowNull: true, },

    autorizadoPor: { type: Sequelize.INTEGER, field: 'AutorizadoPor', allowNull: true, },
    motivoDesincorporacion: { type: Sequelize.STRING, field: 'MotivoDesincorporacion', allowNull: true, validate: { len: [1, 500] },},

    depreciarDesdeMes: { type: Sequelize.INTEGER, field: 'DepreciarDesdeMes', allowNull: false, },
    depreciarDesdeAno: { type: Sequelize.INTEGER, field: 'DepreciarDesdeAno', allowNull: false, },
    depreciarHastaMes: { type: Sequelize.INTEGER, field: 'DepreciarHastaMes', allowNull: false, },
    depreciarHastaAno: { type: Sequelize.INTEGER, field: 'DepreciarHastaAno', allowNull: false, },
    cantidadMesesADepreciar: { type: Sequelize.INTEGER, field: 'CantidadMesesADepreciar', allowNull: false, },
    montoDepreciacionMensual: { type: Sequelize.DECIMAL(12, 2), field: 'MontoDepreciacionMensual', allowNull: false, },

    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false, },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, validate: { len: [1, 125] },},
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'InventarioActivosFijos'
})