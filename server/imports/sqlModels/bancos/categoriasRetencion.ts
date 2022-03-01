

import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const CategoriasRetencion_sql = sequelize.define('categoriasRetencion_sql', {
    categoria: { type: Sequelize.INTEGER, field: 'Categoria', allowNull: false, autoIncrement: true, primaryKey: true,  },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: { args: [0, 30], msg: 'La descripción debe tener hasta 30 chars.' }}, },
    tipoPersona: { type: Sequelize.STRING, field: 'TipoPersona', allowNull: true, validate: { len: { args: [0, 6], msg: 'El tipo de persona debe tener hasta 6 chars.' }}, },
    fechaAplicacion: { type: Sequelize.DATE, field: 'FechaAplicacion', allowNull: true, },
    codigoIslr: { type: Sequelize.STRING, field: 'CodigoIslr', allowNull: true, validate: { len: { args: [0, 6], msg: 'El código debe tener hasta 6 chars.' }}, },
    porcentajeRetencion: { type: Sequelize.DECIMAL(10, 2), field: 'PorcentajeRetencion', allowNull: true, },
    aplicaSustraendo: { type: Sequelize.BOOLEAN, field: 'AplicaSustraendo', allowNull: true, },
    minimo: { type: Sequelize.DECIMAL(12, 2), field: 'Minimo', allowNull: true, },
}, {
     tableName: 'CategoriasRetencion'
})
