
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

// Nota importante: no usamos aquí todos los campos definidos en sql server; sin embargo, si los que, efectivamente, usa el
// usuario en contabm
ParametrosContab_sql = sequelize.define('parametrosContab', {

    activo1: { type: Sequelize.INTEGER, field: 'Activo1', allowNull: true, },
    activo2: { type: Sequelize.INTEGER, field: 'Activo2', allowNull: true, },

    pasivo1: { type: Sequelize.INTEGER, field: 'Pasivo1', allowNull: true, },
    pasivo2: { type: Sequelize.INTEGER, field: 'Pasivo2', allowNull: true, },

    capital1: { type: Sequelize.INTEGER, field: 'Capital1', allowNull: true, },
    capital2: { type: Sequelize.INTEGER, field: 'Capital2', allowNull: true, },

    ingresos1: { type: Sequelize.INTEGER, field: 'Ingresos1', allowNull: true, },
    ingresos2: { type: Sequelize.INTEGER, field: 'Ingresos2', allowNull: true, },

    egresos1: { type: Sequelize.INTEGER, field: 'Egresos1', allowNull: true, },
    egresos2: { type: Sequelize.INTEGER, field: 'Egresos2', allowNull: true, },

    cuentaGyP: { type: Sequelize.INTEGER, field: 'CuentaGyP', allowNull: true, },

    multiMoneda: { type: Sequelize.BOOLEAN, field: 'MultiMoneda', allowNull: true, },
    moneda1: { type: Sequelize.INTEGER, field: 'Moneda1', allowNull: true, },
    moneda2: { type: Sequelize.INTEGER, field: 'Moneda2', allowNull: true, },
    moneda3: { type: Sequelize.INTEGER, field: 'Moneda3', allowNull: true, },

    numeracionAsientosSeparadaFlag: { type: Sequelize.BOOLEAN, field: 'NumeracionAsientosSeparadaFlag', allowNull: true, },
    cierreContabPermitirAsientosDescuadrados: { type: Sequelize.BOOLEAN, field: 'CierreContabPermitirAsientosDescuadrados', allowNull: true, },

    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, primaryKey: true, autoIncrement: false, },
}, {
     tableName: 'ParametrosContab'
});
