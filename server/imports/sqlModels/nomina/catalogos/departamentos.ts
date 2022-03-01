
import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Departamentos_sql = sequelize.define('departamentos', {
    departamento: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tDepartamentos'
});