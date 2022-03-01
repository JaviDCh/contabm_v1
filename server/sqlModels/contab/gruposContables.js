
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

GruposContables_sql = sequelize.define('gruposContables', {
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', primaryKey: true },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion' },
    ordenBalanceGeneral: { type: Sequelize.INTEGER, field: 'OrdenBalanceGeneral' },
}, {
     tableName: 'tGruposContables'
});
