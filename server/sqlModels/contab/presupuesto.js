
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Presupuesto_Codigos_sql = sequelize.define('presupuestoCodigos', {
    codigo: { type: Sequelize.STRING, field: 'Codigo', allowNull: false, primaryKey: true, autoIncrement: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    cantNiveles: { type: Sequelize.BOOLEAN, field: 'CantNiveles', allowNull: false, },
    grupoFlag: { type: Sequelize.BOOLEAN, field: 'GrupoFlag', allowNull: false, },
    ciaContab: { type: Sequelize.INTEGER, field: 'CiaContab', allowNull: false, primaryKey: true, autoIncrement: false, },
}, {
     tableName: 'Presupuesto_Codigos'
});


Presupuesto_AsociacionCodigosCuentas_sql = sequelize.define('presupuestoAsociacionCodigosCuentas', {
    codigoPresupuesto: { type: Sequelize.STRING, field: 'CodigoPresupuesto', allowNull: false, primaryKey: true, autoIncrement: false, },
    cuentaContableID: { type: Sequelize.INTEGER, field: 'CuentaContableID', allowNull: false, primaryKey: true, autoIncrement: false, },
    ciaContab: { type: Sequelize.INTEGER, field: 'CiaContab', allowNull: false, primaryKey: true, autoIncrement: false, },
}, {
     tableName: 'Presupuesto_AsociacionCodigosCuentas'
});


Presupuesto_Montos_sql = sequelize.define('presupuestoMontos', {
    codigoPresupuesto: { type: Sequelize.STRING, field: 'CodigoPresupuesto', allowNull: false, primaryKey: true, autoIncrement: false, },
    ciaContab: { type: Sequelize.INTEGER, field: 'CiaContab', allowNull: false, primaryKey: true, autoIncrement: false, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, primaryKey: true, autoIncrement: false, primaryKey: true, autoIncrement: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, primaryKey: true, autoIncrement: false, primaryKey: true, autoIncrement: false, },

    mes01Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes01_Est', allowNull: true, defaultValue: 0, },
    mes01Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes01_Eje', allowNull: true, defaultValue: 0, },
    mes02Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes02_Est', allowNull: true, defaultValue: 0, },
    mes02Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes02_Eje', allowNull: true, defaultValue: 0, },
    mes03Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes03_Est', allowNull: true, defaultValue: 0, },
    mes03Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes03_Eje', allowNull: true, defaultValue: 0, },
    mes04Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes04_Est', allowNull: true, defaultValue: 0, },
    mes04Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes04_Eje', allowNull: true, defaultValue: 0, },
    mes05Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes05_Est', allowNull: true, defaultValue: 0, },
    mes05Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes05_Eje', allowNull: true, defaultValue: 0, },
    mes06Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes06_Est', allowNull: true, defaultValue: 0, },
    mes06Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes06_Eje', allowNull: true, defaultValue: 0, },
    mes07Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes07_Est', allowNull: true, defaultValue: 0, },
    mes07Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes07_Eje', allowNull: true, defaultValue: 0, },
    mes08Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes08_Est', allowNull: true, defaultValue: 0, },
    mes08Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes08_Eje', allowNull: true, defaultValue: 0, },
    mes09Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes09_Est', allowNull: true, defaultValue: 0, },
    mes09Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes09_Eje', allowNull: true, defaultValue: 0, },
    mes10Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes10_Est', allowNull: true, defaultValue: 0, },
    mes10Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes10_Eje', allowNull: true, defaultValue: 0, },
    mes11Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes11_Est', allowNull: true, defaultValue: 0, },
    mes11Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes11_Eje', allowNull: true, defaultValue: 0, },
    mes12Est: { type: Sequelize.DECIMAL(10, 2), field: 'Mes12_Est', allowNull: true, defaultValue: 0, },
    mes12Eje: { type: Sequelize.DECIMAL(10, 2), field: 'Mes12_Eje', allowNull: true, defaultValue: 0, },

}, {
     tableName: 'Presupuesto_Montos'
});
