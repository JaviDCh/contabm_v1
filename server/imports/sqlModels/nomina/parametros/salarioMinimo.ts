

import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Parametros_Nomina_SalarioMinimo_sql = sequelize.define('parametros_nomina_salarioMinimo', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
    monto: { type: Sequelize.DECIMAL(10, 2), field: 'Monto', allowNull: false, },
}, {
     tableName: 'Parametros_Nomina_SalarioMinimo'
});