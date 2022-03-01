
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

DefinicionCuentasContables_sql = sequelize.define('definicionCuentasContables', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },

    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: true, },
    compania: { type: Sequelize.INTEGER, field: 'Compania', allowNull: true, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: true, },
    concepto: { type: Sequelize.INTEGER, field: 'Concepto', allowNull: false, },
    concepto2: { type: Sequelize.INTEGER, field: 'Concepto2', allowNull: true, },
    cuentaContableID: { type: Sequelize.INTEGER, field: 'CuentaContableID', allowNull: false, },

}, {
     tableName: 'DefinicionCuentasContables'
});
