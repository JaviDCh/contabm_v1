


import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const CajaChica_CajasChicas_sql = sequelize.define('cajaChica_CajasChicas', {
    cajaChica: { type: Sequelize.INTEGER, field: 'CajaChica', primaryKey: true, autoIncrement: true, allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 50] }, },
    ciaContab: { type: Sequelize.INTEGER, field: 'CiaContab', allowNull: false, },
}, {
     tableName: 'CajaChica_CajasChicas'
})


export const CajaChica_Rubros_sql = sequelize.define('cajaChica_Rubros', {
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', primaryKey: true, autoIncrement: true, allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 50] }, },
}, {
     tableName: 'CajaChica_Rubros'
})

export const CajaChica_Parametros_sql = sequelize.define('cCajaChica_Parametros', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    tipoAsiento: { type: Sequelize.STRING, field: 'TipoAsiento', allowNull: false, validate: { len: [1, 6] }, },
    cuentaContablePuenteID: { type: Sequelize.INTEGER, field: 'CuentaContablePuenteID', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'CajaChica_Parametros'
})


export const CajaChica_RubrosCuentasContables = sequelize.define('cajaChica_RubrosCuentasContables', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, },
    cuentaContableID: { type: Sequelize.INTEGER, field: 'CuentaContableID', allowNull: false, },
}, {
     tableName: 'CajaChica_RubrosCuentasContables'
})


export const CajaChica_Reposiciones_sql = sequelize.define('cajaChica_Reposiciones', {
    reposicion: { type: Sequelize.INTEGER, field: 'Reposicion', primaryKey: true, autoIncrement: true, allowNull: false, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    cajaChica: { type: Sequelize.INTEGER, field: 'CajaChica', allowNull: false, },
    observaciones: { type: Sequelize.STRING, field: 'Observaciones', allowNull: true, validate: { len: [1, 250] }, },
    estadoActual: { type: Sequelize.STRING, field: 'EstadoActual', allowNull: false, validate: { len: [1, 2] }, },
}, {
     tableName: 'CajaChica_Reposiciones'
})


export const CajaChica_Reposiciones_Gastos_sql = sequelize.define('cajaChica_Reposiciones_Gastos', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    reposicion: { type: Sequelize.INTEGER, field: 'Reposicion', allowNull: false,  },
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 150] },},
    montoNoImponible: { type: Sequelize.DECIMAL(12, 2), field: 'MontoNoImponible', allowNull: true, },
    monto: { type: Sequelize.DECIMAL(12, 2), field: 'Monto', allowNull: false, },
    ivaPorc: { type: Sequelize.DECIMAL(5, 2), field: 'IvaPorc', allowNull: true, },
    iva: { type: Sequelize.DECIMAL(12, 2), field: 'Iva', allowNull: true, },
    total: { type: Sequelize.DECIMAL(12, 2), field: 'Total', allowNull: false, },
    fechaDocumento: { type: Sequelize.DATE, field: 'FechaDocumento', allowNull: true, },
    numeroDocumento: { type: Sequelize.STRING, field: 'NumeroDocumento', allowNull: true, validate: { len: [1, 25] }, },
    numeroControl: { type: Sequelize.STRING, field: 'NumeroControl', allowNull: true, validate: { len: [1, 20] }, },
    proveedor: { type: Sequelize.INTEGER, field: 'Proveedor', allowNull: true, },
    nombre: { type: Sequelize.STRING, field: 'Nombre', allowNull: true, validate: { len: [1, 50] }, },
    rif: { type: Sequelize.STRING, field: 'Rif', allowNull: true, validate: { len: [1, 20] }, },
    afectaLibroCompras: { type: Sequelize.BOOLEAN, field: 'AfectaLibroCompras', allowNull: false, },
    nombreUsuario: { type: Sequelize.STRING, field: 'NombreUsuario', allowNull: false, validate: { len: [1, 256] }, },
}, {
     tableName: 'CajaChica_Reposiciones_Gastos'
})


CajaChica_Reposiciones_sql.hasMany(CajaChica_Reposiciones_Gastos_sql, { as: 'cajaChica_reposicion_gastos', foreignKey: 'reposicion' } );
CajaChica_Reposiciones_Gastos_sql.belongsTo(CajaChica_Reposiciones_sql, { as: 'cajaChica_reposicion', foreignKey: 'reposicion' } );


