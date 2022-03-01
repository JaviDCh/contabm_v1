
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

UltimoMesCerradoBancos_sql = sequelize.define('ultimoMesCerradoBancos_sql', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    ManAuto: { type: Sequelize.STRING, field: 'ManAuto', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, autoIncrement: false, primaryKey: true,  },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, },
}, {
     tableName: 'UltimoMesCerrado'
});


UltimoMesCerradoContab_sql = sequelize.define('ultimoMesCerradoBancos_sql', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false,  },
    ManAuto: { type: Sequelize.STRING, field: 'ManAuto', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, autoIncrement: false, primaryKey: true,  },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false, },
}, {
     tableName: 'UltimoMesCerradoContab'
});


MesesDelAnoFiscal_sql = sequelize.define('mesesDelAnoFiscal_sql', {
    id: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, autoIncrement: true, primaryKey: true },
    mesFiscal: { type: Sequelize.INTEGER, field: 'MesFiscal', allowNull: false, },
    mesCalendario: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false,  },
    nombreMes: { type: Sequelize.STRING, field: 'NombreMes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'MesesDelAnoFiscal'
});


AsientosNegativosID_sql = sequelize.define('asientosNegativosID_sql', {
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, autoIncrement: false, primaryKey: true, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false,  autoIncrement: false, primaryKey: true, },
    numero: { type: Sequelize.INTEGER, field: 'Numero', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, autoIncrement: false, primaryKey: true, },
}, {
     tableName: 'AsientosNegativosId'
});


CambiosMonedas_sql = sequelize.define('cambiosMonedas_sql', {
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false, autoIncrement: false, primaryKey: true, },
    cambio: { type: Sequelize.DECIMAL(10,2), field: 'Cambio', allowNull: false, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, autoIncrement: false, primaryKey: true, },
    anoMesDia: { type: Sequelize.STRING, field: 'AnoMesDia', allowNull: false, autoIncrement: false, primaryKey: true, },
}, {
     tableName: 'CambiosMonedas'
});


TiposAsiento_sql = sequelize.define('tiposAsiento_sql', {
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: true, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, autoIncrement: false, primaryKey: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'TiposDeAsiento'
});
