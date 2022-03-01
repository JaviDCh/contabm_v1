


import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const CentrosCosto_sql = sequelize.define('centrosCosto', {
    centroCosto: { type: Sequelize.INTEGER, field: 'CentroCosto', primaryKey: true, autoIncrement: true, allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 50] }, },
    descripcionCorta: { type: Sequelize.STRING, field: 'DescripcionCorta', allowNull: false, validate: { len: [1, 3] }, },
    suspendido: { type: Sequelize.BOOLEAN, field: 'Suspendido', allowNull: true, },
}, {
     tableName: 'CentrosCosto'
});
