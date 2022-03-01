

import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Nomina_DefinicionAnticipos_sql = sequelize.define('nomina_DefinicionAnticipos', {
	id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
	grupoNomina: { type: Sequelize.INTEGER, field: 'GrupoNomina', allowNull: false, },
	desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
	suspendido: { type: Sequelize.BOOLEAN, field: 'Suspendido', allowNull: false, },
    primQuincPorc: { type: Sequelize.DECIMAL(5, 2), field: 'PrimQuincPorc', allowNull: true, },
}, {
     tableName: 'Nomina_DefinicionAnticipos'
});


export const Nomina_DefinicionAnticipos_Empleados_sql = sequelize.define('nomina_DefinicionAnticiposEmpleados', {
	id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
	definicionAnticiposID: { type: Sequelize.INTEGER, field: 'DefinicionAnticiposID', allowNull: false, },
	empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
	suspendido: { type: Sequelize.BOOLEAN, field: 'Suspendido', allowNull: false, },
    primQuincPorc: { type: Sequelize.DECIMAL(5, 2), field: 'PrimQuincPorc', allowNull: true, },
}, {
     tableName: 'Nomina_DefinicionAnticipos_Empleados'
});

