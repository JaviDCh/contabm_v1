
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Atributos_sql = sequelize.define('atributos_sql', {
    atributo: { type: Sequelize.INTEGER, field: 'Atributo', allowNull: false, autoIncrement: true, primaryKey: true,  },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 30] }, },
    origen: { type: Sequelize.STRING, field: 'Origen', allowNull: false, validate: { len: [1, 10] },  },
}, {
     tableName: 'Atributos'
})
