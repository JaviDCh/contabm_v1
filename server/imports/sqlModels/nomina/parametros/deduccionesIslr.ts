

import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const DeduccionesIslr_sql = sequelize.define('deduccionesISLR', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    grupoNomina: { type: Sequelize.INTEGER, field: 'GrupoNomina', allowNull: true, },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: true, },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
    tipoNomina: { type: Sequelize.STRING, field: 'TipoNomina', allowNull: false, validate: { len: [1, 10] }, },
    periodicidad: { type: Sequelize.STRING, field: 'Periodicidad', allowNull: true, validate: { len: [1, 2] }, },
    porcentaje: { type: Sequelize.DECIMAL(9, 6), field: 'Porcentaje', allowNull: false, },
    base: { type: Sequelize.STRING, field: 'Base', allowNull: false, validate: { len: [1, 10] }, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: false, },
}, {
     tableName: 'DeduccionesISLR'
});
