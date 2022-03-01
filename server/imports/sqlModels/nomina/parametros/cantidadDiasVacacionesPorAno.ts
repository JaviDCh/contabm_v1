


import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const VacacPorAnoGenericas_sql = sequelize.define('vacacPorAnoGenericas', {
	claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    dias: { type: Sequelize.INTEGER, field: 'Dias', allowNull: false, },
    diasAdicionales: { type: Sequelize.INTEGER, field: 'DiasAdicionales', allowNull: true, },
    diasBono: { type: Sequelize.INTEGER, field: 'DiasBono', allowNull: true, },
}, {
     tableName: 'VacacPorAnoGenericas'
});


export const VacacPorAnoParticulares_sql = sequelize.define('vacacPorAnoParticulares', {
	claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false, },
	empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
	ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    dias: { type: Sequelize.INTEGER, field: 'Dias', allowNull: false, },
    diasAdicionales: { type: Sequelize.INTEGER, field: 'DiasAdicionales', allowNull: true, },
    diasBono: { type: Sequelize.INTEGER, field: 'DiasBono', allowNull: true, },
}, {
     tableName: 'VacacPorAnoParticulares'
});
