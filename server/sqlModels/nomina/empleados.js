
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

import { Departamentos_sql } from '/server/imports/sqlModels/nomina/catalogos/departamentos';

Empleados_sql = sequelize.define('empleados', {
    empleado: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, primaryKey: true, autoIncrement: true, },
    cedula: { type: Sequelize.STRING, field: 'Cedula', allowNull: false, },
    alias: { type: Sequelize.STRING, field: 'Alias', allowNull: false, },
    rif: { type: Sequelize.STRING, field: 'Rif', allowNull: true,  },
    tipoNomina: { type: Sequelize.INTEGER, field: 'TipoNomina', allowNull: false,  },
    escribirArchivoXMLRetencionesISLR: { type: Sequelize.BOOLEAN, field: 'EscribirArchivoXMLRetencionesISLR', allowNull: true,  },
    status: { type: Sequelize.STRING, field: 'Status', allowNull: false, },
    nombre: { type: Sequelize.STRING, field: 'Nombre', allowNull: false, },
    edoCivil: { type: Sequelize.STRING, field: 'EdoCivil', allowNull: false,  },

    sexo: { type: Sequelize.STRING, field: 'Sexo', allowNull: false,  },
    nacionalidad: { type: Sequelize.STRING, field: 'Nacionalidad', allowNull: false,  },
    fechaNacimiento: { type: Sequelize.DATE, field: 'FechaNacimiento', allowNull: false, },
    ciudadOrigen: { type: Sequelize.STRING, field: 'CiudadOrigen', allowNull: true, },
    direccionHabitacion: { type: Sequelize.STRING, field: 'DireccionHabitacion', allowNull: true,  },
    telefono1: { type: Sequelize.STRING, field: 'Telefono1', allowNull: true,  },
    telefono2: { type: Sequelize.STRING, field: 'Telefono2', allowNull: true,  },
    email: { type: Sequelize.STRING, field: 'email', allowNull: true,  },
    situacionActual: { type: Sequelize.STRING, field: 'SituacionActual', allowNull: false, },

    departamentoID: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: false, },
    cargoID: { type: Sequelize.INTEGER, field: 'Cargo', allowNull: false,  },
    fechaIngreso: { type: Sequelize.DATE, field: 'FechaIngreso', allowNull: false,  },
    fechaRetiro: { type: Sequelize.DATE, field: 'FechaRetiro', allowNull: true,  },
    bancoDepositosNomina: { type: Sequelize.INTEGER, field: 'BancoDepositosNomina', allowNull: true, },
    tipoCuentaDepositosNomina: { type: Sequelize.INTEGER, field: 'TipoCuentaDepositosNomina', allowNull: true, },
    cuentaBancariaDepositosNomina: { type: Sequelize.STRING, field: 'CuentaBancariaDepositosNomina', allowNull: true,
        validate: { len: { args: [0, 30], msg: 'la cuenta bancaria debe tener un max de 30 caracteres.' }}},
    bancoCuentaPrestacionesSociales: { type: Sequelize.INTEGER, field: 'BancoCuentaPrestacionesSociales', allowNull: true, },
    numeroCuentaBancariaPrestacionesSociales: { type: Sequelize.STRING, field: 'NumeroCuentaBancariaPrestacionesSociales', allowNull: true,
        validate: { len: { args: [0, 30], msg: 'la cuenta bancaria debe tener un max de 30 caracteres.' }}},

    contacto1: { type: Sequelize.STRING, field: 'Contacto1', allowNull: true, },
    parentesco1: { type: Sequelize.INTEGER, field: 'Parentesco1', allowNull: true, },
    telefonoCon1: { type: Sequelize.STRING, field: 'TelefonoCon1', allowNull: true,  },
    contacto2: { type: Sequelize.STRING, field: 'Contacto2', allowNull: true,  },
    parentesco2: { type: Sequelize.INTEGER, field: 'Parentesco2', allowNull: true,  },
    telefonoCon2: { type: Sequelize.STRING, field: 'TelefonoCon2', allowNull: true, },
    contacto3: { type: Sequelize.STRING, field: 'Contacto3', allowNull: true, },
    parentesco3: { type: Sequelize.INTEGER, field: 'Parentesco3', allowNull: true,  },
    telefonoCon3: { type: Sequelize.STRING, field: 'TelefonoCon3', allowNull: true,  },

    empleadoObreroFlag: { type: Sequelize.INTEGER, field: 'EmpleadoObreroFlag', allowNull: true,  },
    montoCestaTickets: { type: Sequelize.DECIMAL(10, 2), field: 'MontoCestaTickets', allowNull: true, },
    bonoVacAgregarSueldoFlag: { type: Sequelize.BOOLEAN, field: 'BonoVacAgregarSueldoFlag', allowNull: true, },
    bonoVacAgregarMontoCestaTicketsFlag: { type: Sequelize.BOOLEAN, field: 'BonoVacAgregarMontoCestaTicketsFlag', allowNull: true,  },
    bonoVacacionalMontoAdicional: { type: Sequelize.DECIMAL(10, 2), field: 'BonoVacacionalMontoAdicional', allowNull: true,  },
    bonoVacAgregarMontoAdicionalFlag: { type: Sequelize.BOOLEAN, field: 'BonoVacAgregarMontoAdicionalFlag', allowNull: true,  },
    prestacionesAgregarMontoCestaTicketsFlag: { type: Sequelize.BOOLEAN, field: 'PrestacionesAgregarMontoCestaTicketsFlag', allowNull: true,  },

    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
     tableName: 'tEmpleados'
});



 EmpleadosFaltas_sql = sequelize.define('empleadosFaltas', {
     id: { type: Sequelize.INTEGER, field: 'ID', allowNull: false, primaryKey: true, autoIncrement: true, },
     empleadoID: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
     desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
     hasta: { type: Sequelize.DATE, field: 'Hasta', allowNull: false,  },
     cantDias: { type: Sequelize.INTEGER, field: 'CantDias', allowNull: false,  },
     cantDiasSabDom: { type: Sequelize.INTEGER, field: 'CantDiasSabDom', allowNull: false,  },
     cantDiasFeriados: { type: Sequelize.INTEGER, field: 'CantDiasFeriados', allowNull: false, },
     cantDiasHabiles: { type: Sequelize.INTEGER, field: 'CantDiasHabiles', allowNull: false, },
     cantHoras: { type: Sequelize.INTEGER, field: 'CantHoras', allowNull: true,  },

     descontar: { type: Sequelize.BOOLEAN, field: 'Descontar', allowNull: false,  },
     descontar_FechaNomina: { type: Sequelize.DATE, field: 'Descontar_FechaNomina', allowNull: true,  },
     descontar_GrupoNomina: { type: Sequelize.INTEGER, field: 'Descontar_GrupoNomina', allowNull: true, },
     base: { type: Sequelize.STRING, field: 'Base', allowNull: true, },
     observaciones: { type: Sequelize.STRING, field: 'Observaciones', allowNull: true,  },
     descripcionRubroNomina: { type: Sequelize.STRING, field: 'DescripcionRubroNomina', allowNull: true,  },
 }, {
      tableName: 'Empleados_Faltas'
 });


EmpleadosSueldo_sql = sequelize.define('empleadosFaltas', {
    id: { type: Sequelize.INTEGER, field: 'ID', allowNull: false, primaryKey: true, autoIncrement: true, },
    empleadoID: { type: Sequelize.INTEGER, field: 'Empleado', allowNull: false, },
    desde: { type: Sequelize.DATE, field: 'Desde', allowNull: false, },
    sueldo: { type: Sequelize.DECIMAL(10, 2), field: 'Sueldo', allowNull: false,  },
}, {
     tableName: 'Empleados_Sueldo'
});

// ------------------------------------------------------------
// relaciones
// ------------------------------------------------------------
Empleados_sql.hasMany(EmpleadosFaltas_sql, { as: 'faltas', foreignKey: 'empleadoID' } );
EmpleadosFaltas_sql.belongsTo(Empleados_sql, { as: 'empleado', foreignKey: 'empleadoID' } );

Empleados_sql.hasMany(EmpleadosSueldo_sql, { as: 'sueldos', foreignKey: 'empleadoID' } );
EmpleadosSueldo_sql.belongsTo(Empleados_sql, { as: 'empleado', foreignKey: 'empleadoID' } );

Departamentos_sql.hasMany(Empleados_sql, { as: 'empleados', foreignKey: 'departamentoID' } );
Empleados_sql.belongsTo(Departamentos_sql, { as: 'departamento', foreignKey: 'departamentoID' } );

Cargos_sql.hasMany(Empleados_sql, { as: 'empleados', foreignKey: 'cargoID' } );
Empleados_sql.belongsTo(Cargos_sql, { as: 'cargo', foreignKey: 'cargoID' } );
