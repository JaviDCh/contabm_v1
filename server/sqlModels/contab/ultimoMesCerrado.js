
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

UltimoMesCerradoContab_sql = sequelize.define('ultimoMesCerradoContab', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false,  },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false,  },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    manAuto: { type: Sequelize.STRING, field: 'ManAuto', allowNull: false,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, primaryKey: true, autoIncrement: false, },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false,  },
}, {
     tableName: 'UltimoMesCerradoContab'
});
