
import { sequelize } from '../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const Compania_sql = sequelize.define('compania', {
    numero: { type: Sequelize.INTEGER, field: 'Numero', primaryKey: true, autoIncrement: true, allowNull: false, },
    nombre: { type: Sequelize.STRING, field: 'Nombre', allowNull: false, },
    nombreCorto: { type: Sequelize.STRING, field: 'NombreCorto', allowNull: false, },
    abreviatura: { type: Sequelize.STRING, field: 'Abreviatura', allowNull: false, },
    rif: { type: Sequelize.STRING, field: 'Rif', allowNull: true, },
    direccion: { type: Sequelize.STRING, field: 'Direccion', allowNull: true, },
    ciudad: { type: Sequelize.STRING, field: 'Ciudad', validate: { len: [1, 25] }, allowNull: true, },
    entidadFederal: { type: Sequelize.STRING, field: 'EntidadFederal', allowNull: true, },
    zonaPostal: { type: Sequelize.STRING, field: 'ZonaPostal', allowNull: true, },
    telefono1: { type: Sequelize.STRING, field: 'Telefono1', allowNull: true, },
    telefono2: { type: Sequelize.STRING, field: 'Telefono2', allowNull: true, },
    fax: { type: Sequelize.STRING, field: 'Fax', allowNull: true, },

    emailServerName: { type: Sequelize.STRING, field: "EmailServerName", validate: { len: [1, 100] }, allowNull: true },
    emailServerPort: { type: Sequelize.INTEGER, field: "EmailServerPort", allowNull: true }, 
    emailServerSSLFlag: { type: Sequelize.BOOLEAN, field: "EmailServerSSLFlag", allowNull: true },
    emailServerCredentialsUserName: { type: Sequelize.STRING, field: "EmailServerCredentialsUserName", validate: { len: [1, 100] }, allowNull: true },
    emailServerCredentialsPassword: { type: Sequelize.STRING, field: "EmailServerCredentialsPassword", validate: { len: [1, 50] }, allowNull: true },

    monedaDefecto: { type: Sequelize.INTEGER, field: 'MonedaDefecto', allowNull: true, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: true, },
}, {
     tableName: 'Companias'
});
