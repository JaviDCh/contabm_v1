
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Pagos_sql = sequelize.define('pagos', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false, },
    proveedor: { type: Sequelize.INTEGER, field: 'Proveedor', allowNull: false, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, },
    numeroPago: { type: Sequelize.STRING, field: 'NumeroPago', allowNull: true, },
    anticipoFlag: { type: Sequelize.BOOLEAN, field: 'AnticipoFlag', allowNull: false, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    monto: { type: Sequelize.DECIMAL(10, 2), field: 'Monto', allowNull: true, },
    concepto: { type: Sequelize.STRING, field: 'Concepto', allowNull: false, },
    miSuFlag: { type: Sequelize.INTEGER, field: 'MiSuFlag', allowNull: false, },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false, },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'Pagos'
});
