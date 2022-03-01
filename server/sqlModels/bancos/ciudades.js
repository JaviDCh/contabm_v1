
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Ciudades_sql = sequelize.define('ciudades_sql', {
    ciudad: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, autoIncrement: false, primaryKey: true,  },
    pais: { type: Sequelize.STRING, field: 'Pais', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tCiudades'
});
