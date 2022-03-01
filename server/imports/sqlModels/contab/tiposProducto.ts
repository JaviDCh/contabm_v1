

import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const TiposDeProducto_sql = sequelize.define('tiposDeProducto', {
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', primaryKey: true, autoIncrement: true, allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 30] }, },
}, {
     tableName: 'TiposDeProducto'
});