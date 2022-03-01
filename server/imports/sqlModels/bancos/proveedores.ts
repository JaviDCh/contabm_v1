


import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Proveedores_sql = sequelize.define('proveedores_sql', {
    proveedor: { type: Sequelize.INTEGER, field: 'Proveedor', primaryKey: true, autoIncrement: true, allowNull: false },
    nombre: { type: Sequelize.STRING, field: 'Nombre', allowNull: false, validate: { len: [1, 70] }, },
    abreviatura: { type: Sequelize.STRING, field: 'Abreviatura', allowNull: false, validate: { len: [1, 10] }, },
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false },
    rif: { type: Sequelize.STRING, field: 'Rif', allowNull: true, validate: { len: [0, 20] }, },
    natJurFlag: { type: Sequelize.INTEGER, field: 'NatJurFlag', allowNull: false },
    nit: { type: Sequelize.STRING, field: 'Nit', allowNull: true, validate: { len: [0, 20] }, },
    contribuyenteFlag: { type: Sequelize.BOOLEAN, field: 'ContribuyenteFlag', allowNull: true },
    contribuyenteEspecialFlag: { type: Sequelize.BOOLEAN, field: 'ContribuyenteEspecialFlag', allowNull: true },
    retencionSobreIvaPorc: { type: Sequelize.DECIMAL(5, 2), field: 'RetencionSobreIvaPorc', allowNull: true },
    nuestraRetencionSobreIvaPorc: { type: Sequelize.DECIMAL(5, 2), field: 'NuestraRetencionSobreIvaPorc', allowNull: true },
    afectaLibroComprasFlag: { type: Sequelize.BOOLEAN, field: 'AfectaLibroComprasFlag', allowNull: true },
    beneficiario: { type: Sequelize.STRING, field: 'Beneficiario', allowNull: true, validate: { len: [0, 50] }, },
    concepto: { type: Sequelize.STRING, field: 'Concepto', allowNull: true, validate: { len: [0, 250] }, },
    montoCheque: { type: Sequelize.DECIMAL(10, 2), field: 'MontoCheque', allowNull: true },
    direccion: { type: Sequelize.STRING, field: 'Direccion', allowNull: true, validate: { len: [0, 255] }, },
    ciudad: { type: Sequelize.STRING, field: 'Ciudad', allowNull: true, },
    telefono1: { type: Sequelize.STRING, field: 'Telefono1', allowNull: true, validate: { len: [0, 14] }, },
    telefono2: { type: Sequelize.STRING, field: 'Telefono2', allowNull: true, validate: { len: [0, 14] }, },
    fax: { type: Sequelize.STRING, field: 'Fax', allowNull: true, validate: { len: [0, 14] }, },
    contacto1: { type: Sequelize.STRING, field: 'Contacto1', allowNull: true, validate: { len: [0, 50] }, },
    contacto2: { type: Sequelize.STRING, field: 'Contacto2', allowNull: true, validate: { len: [0, 50] }, },
    nacionalExtranjeroFlag: { type: Sequelize.INTEGER, field: 'NacionalExtranjeroFlag', allowNull: true },
    sujetoARetencionFlag: { type: Sequelize.BOOLEAN, field: 'SujetoARetencionFlag', allowNull: true },
    codigoConceptoRetencion: { type: Sequelize.STRING, field: 'CodigoConceptoRetencion', allowNull: true, validate: { len: [0, 6] }, },
    retencionISLRSustraendo: { type: Sequelize.DECIMAL(10, 2), field: 'RetencionISLRSustraendo', allowNull: true },
    baseRetencionISLR: { type: Sequelize.INTEGER, field: 'BaseRetencionISLR', allowNull: true },
    monedaDefault: { type: Sequelize.INTEGER, field: 'MonedaDefault', allowNull: true },
    formaDePagoDefault: { type: Sequelize.INTEGER, field: 'FormaDePagoDefault', allowNull: true },
    proveedorClienteFlag: { type: Sequelize.INTEGER, field: 'ProveedorClienteFlag', allowNull: true },
    porcentajeDeRetencion: { type: Sequelize.DECIMAL(5, 2), field: 'PorcentajeDeRetencion', allowNull: true },
    aplicaIvaFlag: { type: Sequelize.BOOLEAN, field: 'AplicaIvaFlag', allowNull: true },
    categoriaProveedor: { type: Sequelize.INTEGER, field: 'CategoriaProveedor', allowNull: true },
    montoChequeEnMonExtFlag: { type: Sequelize.BOOLEAN, field: 'MontoChequeEnMonExtFlag', allowNull: true },
    lote: { type: Sequelize.STRING, field: 'Lote', allowNull: true, validate: { len: [0, 50] }, },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, validate: { len: [1, 125] }, },
}, {
     tableName: 'Proveedores'
})


export const Personas_sql = sequelize.define('personas_sql', {
    persona: { type: Sequelize.INTEGER, field: 'Persona', primaryKey: true, autoIncrement: true, allowNull: false },
    compania: { type: Sequelize.INTEGER, field: 'Compania', allowNull: false, },
    nombre: { type: Sequelize.STRING, field: 'Nombre', allowNull: false, validate: { len: [1, 50] }, },
    apellido: { type: Sequelize.STRING, field: 'Apellido', allowNull: false, validate: { len: [1, 50] }, },
    cargo: { type: Sequelize.INTEGER, field: 'Cargo', allowNull: false, },
    titulo: { type: Sequelize.STRING, field: 'Titulo', allowNull: false, validate: { len: [1, 10] }, },
    rif: { type: Sequelize.STRING, field: 'Rif', allowNull: true, validate: { len: [1, 20] }, },
    diaCumpleAnos: { type: Sequelize.INTEGER, field: 'DiaCumpleAnos', allowNull: true },
    mesCumpleAnos: { type: Sequelize.INTEGER, field: 'MesCumpleAnos', allowNull: true },

    telefono: { type: Sequelize.STRING, field: 'Telefono', allowNull: true, validate: { len: [1, 25] },  },
    departamento: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: true },
    fax: { type: Sequelize.STRING, field: 'Fax', allowNull: true, validate: { len: [1, 25] },  },
    celular: { type: Sequelize.STRING, field: 'Celular', allowNull: true, validate: { len: [1, 25] }, },
    email: { type: Sequelize.STRING, field: 'Email', allowNull: true, validate: { len: [1, 50] }, },
    atributo: { type: Sequelize.INTEGER, field: 'Atributo', allowNull: true },
    notas: { type: Sequelize.STRING, field: 'Notas', allowNull: true, validate: { len: [1, 250] }, },
    defaultFlag: { type: Sequelize.BOOLEAN, field: 'DefaultFlag', allowNull: true, },

    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, validate: { len: [1, 125] }, },
}, {
     tableName: 'Personas'
})


Proveedores_sql.hasMany(Personas_sql, { as: 'personas', foreignKey: 'compania' } );
Personas_sql.belongsTo(Proveedores_sql, { as: 'proveedor', foreignKey: 'compania' } );
