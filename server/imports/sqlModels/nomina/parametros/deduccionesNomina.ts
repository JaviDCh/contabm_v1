


import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const DeduccionesNomina_sql = sequelize.define('deduccionesNomina', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: true, validate: { len: [1, 6] }, },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: true, },
    grupoNomina: { type: Sequelize.INTEGER, field: 'GrupoNomina', allowNull: true, },
    grupoEmpleados: { type: Sequelize.INTEGER, field: 'grupoEmpleados', allowNull: true, },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: true, },
    aporteEmpleado: { type: Sequelize.DECIMAL(9, 6), field: 'AporteEmpleado', allowNull: false, },
    aporteEmpresa: { type: Sequelize.DECIMAL(9, 6), field: 'AporteEmpresa', allowNull: false, },
    base: { type: Sequelize.STRING, field: 'Base', allowNull: false, validate: { len: [1, 10] }, },
    tope: { type: Sequelize.DECIMAL(10, 2), field: 'Tope', allowNull: true, },
    topeBase: { type: Sequelize.STRING, field: 'TopeBase', allowNull: true, validate: { len: [1, 10] }, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: false, },
}, {
     tableName: 'DeduccionesNomina'
});
