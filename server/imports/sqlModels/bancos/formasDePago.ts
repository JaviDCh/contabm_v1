
import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const FormasDePago_sql = sequelize.define('formasDePago_sql', {
    formaDePago: { type: Sequelize.INTEGER, field: 'FormaDePago', allowNull: false, autoIncrement: false, primaryKey: true,  },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    numeroDeCuotas: { type: Sequelize.INTEGER, field: 'NumeroDeCuotas', allowNull: false, },
}, {
     tableName: 'FormasDePago'
});


export const dFormasDePago_sql = sequelize.define('dFormasDePago_sql', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, autoIncrement: false, primaryKey: true,  },
    formaDePago: { type: Sequelize.INTEGER, field: 'FormaDePago', allowNull: false, autoIncrement: false, primaryKey: true,  },
    numeroDeCuota: { type: Sequelize.INTEGER, field: 'NumeroDeCuota', allowNull: false, },
    diasDeVencimiento: { type: Sequelize.INTEGER, field: 'DiasDeVencimiento', allowNull: false, },

    proporcionCuota: { type: Sequelize.DECIMAL(6, 3), field: 'ProporcionCuota', allowNull: false },
    proporcionIva: { type: Sequelize.DECIMAL(6, 3), field: 'ProporcionIva', allowNull: true },
    proporcionRetencionIVA: { type: Sequelize.DECIMAL(6, 3), field: 'ProporcionRetencionIVA', allowNull: true },
    proporcionRetencionISLR: { type: Sequelize.DECIMAL(6, 3), field: 'ProporcionRetencionISLR', allowNull: true },
}, {
     tableName: 'dFormasDePago'
});

// relations / asociations
FormasDePago_sql.hasMany(dFormasDePago_sql, { as: 'dFormasPago', foreignKey: 'formaDePago' } );
dFormasDePago_sql.belongsTo(FormasDePago_sql, { as: 'formaPago', foreignKey: 'formaDePago' } );
