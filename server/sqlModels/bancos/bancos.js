
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

UltimoMesCerradoBancos_sql = sequelize.define('ultimoMesCerradoBancos_sql', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    ManAuto: { type: Sequelize.STRING, field: 'ManAuto', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, autoIncrement: false, primaryKey: true,  },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, },
}, {
     tableName: 'UltimoMesCerrado'
});
