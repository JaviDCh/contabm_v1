
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

RubrosAsignados_sql = sequelize.define('rubrosAsignados', {
    rubroAsignado: { type: Sequelize.INTEGER, field: 'RubroAsignado', allowNull: false, primaryKey: true, autoIncrement: true, },
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false,  },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: true,  },
    tipoNomina: { type: Sequelize.STRING, field: 'TipoNomina', allowNull: false,  },
    salarioFlag: { type: Sequelize.BOOLEAN, field: 'SalarioFlag', allowNull: true,  },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: true, },
    hasta: { type: Sequelize.DATE, field: 'Hasta', allowNull: true, },
    siempre: { type: Sequelize.BOOLEAN, field: 'Siempre', allowNull: true,  },
    periodicidad: { type: Sequelize.STRING, field: 'Periodicidad', allowNull: true,  },
    montoAAplicar: { type: Sequelize.DECIMAL(10, 2), field: 'MontoAAplicar', allowNull: false, },
}, {
     tableName: 'tRubrosAsignados'
});
