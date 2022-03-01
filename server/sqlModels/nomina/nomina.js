
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

NominaHeaders_sql = sequelize.define('bancos', {
    id: { type: Sequelize.INTEGER, field: 'ID', allowNull: false, primaryKey: true, autoIncrement: true, },
    fechaNomina: { type: Sequelize.DATE, field: 'FechaNomina', allowNull: false, },
    fechaEjecucion: { type: Sequelize.DATE, field: 'FechaEjecucion', allowNull: false, },
    grupoNomina: { type: Sequelize.INTEGER, field: 'GrupoNomina', allowNull: false, },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: true,  },
    hasta: { type: Sequelize.DATE, field: 'Hasta', allowNull: true,  },
    cantidadDias: { type: Sequelize.INTEGER, field: 'CantidadDias', allowNull: true, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
    agregarSueldo: { type: Sequelize.BOOLEAN, field: 'AgregarSueldo', allowNull: false, },
    agregarDeduccionesObligatorias: { type: Sequelize.BOOLEAN, field: 'AgregarDeduccionesObligatorias', allowNull: false,  },
    provieneDe: { type: Sequelize.STRING, field: 'ProvieneDe', allowNull: true,  },
    provieneDe_ID: { type: Sequelize.INTEGER, field: 'ProvieneDe_ID', allowNull: true,  },
    asientoContableID: { type: Sequelize.INTEGER, field: 'AsientoContableID', allowNull: true,  },
}, {
     tableName: 'tNominaHeaders'
});
