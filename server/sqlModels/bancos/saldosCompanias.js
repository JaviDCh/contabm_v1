
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

SaldosCompanias_sql = sequelize.define('saldosCompanias', {
    compania: { type: Sequelize.INTEGER, field: 'Compania', allowNull: false, primaryKey: true, autoIncrement: false, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, primaryKey: true, autoIncrement: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, primaryKey: true, autoIncrement: false, },

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

    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, primaryKey: true, autoIncrement: false, },
}, {
     tableName: 'SaldosCompanias'
});
