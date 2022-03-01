
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

AsientosContables_sql = sequelize.define('AsientosContables_sql', {
    numeroAutomatico: { type: Sequelize.INTEGER, field: 'NumeroAutomatico', allowNull: false, autoIncrement: true, primaryKey: true,},
    numero: { type: Sequelize.INTEGER, field: 'Numero', allowNull: false, },
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false,  },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 250] }, },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, },
    monedaOriginal: { type: Sequelize.INTEGER, field: 'MonedaOriginal', allowNull: false,  },
    convertirFlag: { type: Sequelize.BOOLEAN, field: 'ConvertirFlag', allowNull: true, },
    factorDeCambio: { type: Sequelize.DECIMAL(10, 2), field: 'FactorDeCambio', allowNull: false, },
    provieneDe: { type: Sequelize.STRING, field: 'ProvieneDe', allowNull: true, validate: { len: [1, 25] }, },
    provieneDe_id: { type: Sequelize.INTEGER, field: 'ProvieneDe_ID', allowNull: true, },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    copiablaFlag: { type: Sequelize.BOOLEAN, field: 'CopiableFlag', allowNull: true, },
    asientoTipoCierreAnualFlag: { type: Sequelize.BOOLEAN, field: 'AsientoTipoCierreAnualFlag', allowNull: true, },
    mesFiscal: { type: Sequelize.INTEGER, field: 'MesFiscal', allowNull: false, },
    anoFiscal: { type: Sequelize.INTEGER, field: 'AnoFiscal', allowNull: false, },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, validate: { len: [1, 125] }, },
    lote: { type: Sequelize.STRING, field: 'Lote', allowNull: true,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'Asientos', hasTrigger: true
});


dAsientosContables_sql = sequelize.define('AsientosContables_sql', {
    numeroAutomatico: { type: Sequelize.INTEGER, field: 'NumeroAutomatico', allowNull: false, autoIncrement: false, primaryKey: true, },
    partida: { type: Sequelize.INTEGER, field: 'Partida', allowNull: false, autoIncrement: false, primaryKey: true, },
    cuentaContableID: { type: Sequelize.INTEGER, field: 'CuentaContableID', allowNull: false,  },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, validate: { len: [1, 75] }, },
    referencia: { type: Sequelize.STRING, field: 'Referencia', allowNull: true, validate: { len: [1, 20] }, },
    debe: { type: Sequelize.DECIMAL(10, 2), field: 'Debe', allowNull: false, },
    haber: { type: Sequelize.DECIMAL(10, 2), field: 'Haber', allowNull: false, },
    centroCosto: { type: Sequelize.INTEGER, field: 'CentroCosto', allowNull: true, },
}, {
     tableName: 'dAsientos'
});


AsientosContables_sql.hasMany( dAsientosContables_sql, { as: 'partidas', foreignKey: 'NumeroAutomatico' } );
dAsientosContables_sql.belongsTo( AsientosContables_sql, { as: 'asiento', foreignKey: 'NumeroAutomatico' } );

CuentasContables_sql.hasMany( dAsientosContables_sql, { as: 'partidasAsientos', foreignKey: 'CuentaContableID' } );
dAsientosContables_sql.belongsTo( CuentasContables_sql, { as: 'cuentaContable', foreignKey: 'CuentaContableID' } );
