
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Titulos_sql = sequelize.define('titulos_sql', {
    titulo: { type: Sequelize.STRING, field: 'Titulo', allowNull: false, primaryKey: true, validate: { len: [1, 10] }, },
}, {
     tableName: 'Titulos'
})
