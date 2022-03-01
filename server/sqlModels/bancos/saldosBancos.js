
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Saldos_sql = sequelize.define('saldos', {
    id: { type: Sequelize.INTEGER, field: 'ID', allowNull: false, primaryKey: true, autoIncrement: true, },
    cuentaBancariaID: { type: Sequelize.INTEGER, field: 'CuentaBancaria', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },

    inicial: { type: Sequelize.DECIMAL(10, 2), field: 'Inicial', allowNull: true,  },
    mes01: { type: Sequelize.DECIMAL(10, 2), field: 'Mes01', allowNull: true,  },
    mes02: { type: Sequelize.DECIMAL(10, 2), field: 'Mes02', allowNull: true,  },
    mes03: { type: Sequelize.DECIMAL(10, 2), field: 'Mes03', allowNull: true,  },
    mes04: { type: Sequelize.DECIMAL(10, 2), field: 'Mes04', allowNull: true,  },
    mes05: { type: Sequelize.DECIMAL(10, 2), field: 'Mes05', allowNull: true,  },
    mes06: { type: Sequelize.DECIMAL(10, 2), field: 'Mes06', allowNull: true,  },
    mes07: { type: Sequelize.DECIMAL(10, 2), field: 'Mes07', allowNull: true,  },
    mes08: { type: Sequelize.DECIMAL(10, 2), field: 'Mes08', allowNull: true,  },
    mes09: { type: Sequelize.DECIMAL(10, 2), field: 'Mes09', allowNull: true,  },
    mes10: { type: Sequelize.DECIMAL(10, 2), field: 'Mes10', allowNull: true,  },
    mes11: { type: Sequelize.DECIMAL(10, 2), field: 'Mes11', allowNull: true,  },
    mes12: { type: Sequelize.DECIMAL(10, 2), field: 'Mes12', allowNull: true,  },
}, {
     tableName: 'Saldos'
});

// relations / asociations
// nótese que agregamos 'ID' al nombre de la columna abajo, para que no coincida con el nombre del 'parent table'
CuentasBancarias_sql.hasMany(Saldos_sql, { as: 'saldos', foreignKey: 'cuentaBancariaID' } );
Saldos_sql.belongsTo(CuentasBancarias_sql, { as: 'cuentaBancaria', foreignKey: 'cuentaBancariaID' } );
