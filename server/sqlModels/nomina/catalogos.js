
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Cargos_sql = sequelize.define('cargos', {
    cargo: { type: Sequelize.INTEGER, field: 'Cargo', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tCargos'
});


Ciudades_sql = sequelize.define('ciudades', {
    ciudad: { type: Sequelize.STRING, field: 'Ciudad', allowNull: false, primaryKey: true, autoIncrement: false, },
    pais: { type: Sequelize.STRING, field: 'Pais', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tCiudades'
});

Paises_sql = sequelize.define('paises', {
    pais: { type: Sequelize.STRING, field: 'Pais', allowNull: false, primaryKey: true, autoIncrement: false,},
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tPaises'
});


Parentescos_sql = sequelize.define('parentescos', {
    parentesco: { type: Sequelize.INTEGER, field: 'Parentesco', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'tParentescos'
});


MaestraRubros_sql = sequelize.define('maestraRubros', {
    rubro: { type: Sequelize.INTEGER, field: 'Rubro', allowNull: false, primaryKey: true, autoIncrement: true, },
    nombreCortoRubro: { type: Sequelize.STRING, field: 'NombreCortoRubro', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
    sueldoFlag: { type: Sequelize.BOOLEAN, field: 'SueldoFlag', allowNull: true, },
    salarioFlag: { type: Sequelize.BOOLEAN, field: 'SalarioFlag', allowNull: true, },
    tipoRubro: { type: Sequelize.INTEGER, field: 'TipoRubro', allowNull: true, },
}, {
     tableName: 'tMaestraRubros'
});



TiposDeCuentaBancaria_sql = sequelize.define('tiposDeCuentaBancaria', {
    tipoCuenta: { type: Sequelize.INTEGER, field: 'TipoCuenta', allowNull: false, primaryKey: true, autoIncrement: true, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
}, {
     tableName: 'TiposDeCuentaBancaria'
});



// ----------------------------------------
// Grupos de empleados
// ----------------------------------------
tGruposEmpleados_sql = sequelize.define('gruposEmpleados', {
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: false, primaryKey: true, autoIncrement: true, },
    nombre: { type: Sequelize.STRING, field: 'NombreGrupo', allowNull: false, },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', allowNull: false, },
    grupoNominaFlag: { type: Sequelize.BOOLEAN, field: 'GrupoNominaFlag', allowNull: false,  },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'tGruposEmpleados'
})

tdGruposEmpleados_sql = sequelize.define('gruposEmpleados_Empleados', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: false, },
    suspendidoFlag: { type: Sequelize.BOOLEAN, field: 'SuspendidoFlag', allowNull: false,  },
}, {
     tableName: 'tdGruposEmpleados'
})

tGruposEmpleados_sql.hasMany(tdGruposEmpleados_sql, { as: 'empleados', foreignKey: 'grupo' } );
tdGruposEmpleados_sql.belongsTo(tGruposEmpleados_sql, { as: 'grupoEmpleados', foreignKey: 'grupo' } );

// ----------------------------------------
// Dias feriados y dís de fiesta nacionalñ
// ----------------------------------------
DiasFeriados_sql = sequelize.define('diasFeriados', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false, },
}, {
     tableName: 'DiasFeriados'
});

DiasFiestaNacional_sql = sequelize.define('diasFiestaNacional', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, primaryKey: true, autoIncrement: true, },
    fecha: { type: Sequelize.DATE, field: 'Fecha', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: 'Tipo', allowNull: false, },
}, {
     tableName: 'DiasFiestaNacional'
});
