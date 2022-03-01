


import { sequelize } from '../../../../../server/sqlModels/_globals/_loadThisFirst/_globals';
import * as Sequelize from 'sequelize';

export const ParametrosNomina_sql = sequelize.define('parametrosNomina', {
    agregarAsientosContables: { type: Sequelize.BOOLEAN, field: 'AgregarAsientosContables', allowNull: true, },
    tipoAsientoDefault: { type: Sequelize.STRING, field: 'TipoAsientoDefault', allowNull: true, },
    cuentaContableNomina: { type: Sequelize.INTEGER, field: 'CuentaContableNomina', allowNull: true, },
    monedaParaElAsiento: { type: Sequelize.INTEGER, field: 'MonedaParaElAsiento', allowNull: true, },
    sumarizarPartidaAsientoContable: { type: Sequelize.INTEGER, field: 'SumarizarPartidaAsientoContable', allowNull: true, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', primaryKey: true, allowNull: false, },
}, {
     tableName: 'ParametrosNomina'
})