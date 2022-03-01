
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

tCuentasContablesPorEmpleadoYRubro_sql = sequelize.define('tCuentasContablesPorEmpleadoYRubro', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },

    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: true, },
    departamento: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: true, },
    cuentaContable: { type: Sequelize.INTEGER, field: 'CuentaContable', allowNull: false, },
    sumarizarEnUnaPartidaFlag: { type: Sequelize.INTEGER, field: 'SumarizarEnUnaPartidaFlag', allowNull: true, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },

}, {
     tableName: 'tCuentasContablesPorEmpleadoYRubro'
});
