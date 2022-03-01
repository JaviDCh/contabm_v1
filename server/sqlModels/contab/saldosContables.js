
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

SaldosContables_sql = sequelize.define('saldosContables', {
    cuentaContableID: { type: Sequelize.INTEGER, field: 'CuentaContableID', allowNull: false, primaryKey: true, autoIncrement: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, primaryKey: true, autoIncrement: false, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, primaryKey: true, autoIncrement: false, },
    monedaOriginal: { type: Sequelize.INTEGER, field: 'MonedaOriginal', allowNull: false, primaryKey: true, autoIncrement: false, },

    inicial: { type: Sequelize.DECIMAL(10, 2), field: 'Inicial', allowNull: true, defaultValue: 0, },
    mes01: { type: Sequelize.DECIMAL(10, 2), field: 'Mes01', allowNull: true, defaultValue: 0, },
    mes02: { type: Sequelize.DECIMAL(10, 2), field: 'Mes02', allowNull: true, defaultValue: 0, },
    mes03: { type: Sequelize.DECIMAL(10, 2), field: 'Mes03', allowNull: true, defaultValue: 0, },
    mes04: { type: Sequelize.DECIMAL(10, 2), field: 'Mes04', allowNull: true, defaultValue: 0, },
    mes05: { type: Sequelize.DECIMAL(10, 2), field: 'Mes05', allowNull: true, defaultValue: 0, },
    mes06: { type: Sequelize.DECIMAL(10, 2), field: 'Mes06', allowNull: true, defaultValue: 0, },
    mes07: { type: Sequelize.DECIMAL(10, 2), field: 'Mes07', allowNull: true, defaultValue: 0, },
    mes08: { type: Sequelize.DECIMAL(10, 2), field: 'Mes08', allowNull: true, defaultValue: 0, },
    mes09: { type: Sequelize.DECIMAL(10, 2), field: 'Mes09', allowNull: true, defaultValue: 0, },
    mes10: { type: Sequelize.DECIMAL(10, 2), field: 'Mes10', allowNull: true, defaultValue: 0, },
    mes11: { type: Sequelize.DECIMAL(10, 2), field: 'Mes11', allowNull: true, defaultValue: 0, },
    mes12: { type: Sequelize.DECIMAL(10, 2), field: 'Mes12', allowNull: true, defaultValue: 0, },
    anual: { type: Sequelize.DECIMAL(10, 2), field: 'Anual', allowNull: true, defaultValue: 0, },

    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     indexes: [ { unique: true, fields: [ 'cuentaContableID', 'ano', 'moneda', 'monedaOriginal',  ] } ],
     tableName: 'SaldosContables'
});
