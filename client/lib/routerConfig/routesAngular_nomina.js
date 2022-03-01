

angular.module("contabm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
        // ----------------------------------------------------------------
        // nomina
        // ----------------------------------------------------------------
        .state('nomina', {
            url: '/nomina',
            templateUrl: 'client/nomina/main.html',
            controller: 'Nomina_Main_Controller'
        })

        // -------------------------------------------------------------------------------------------
        // Generales
        // -------------------------------------------------------------------------------------------
        .state('nomina.CopiarCatalogos', {
            url: '/copiarCatalogos',
            templateUrl: 'client/nomina/copiarCatalogos/copiarCatalogos.html',
            controller: 'Nomina_CopiarCatalogos_Controller',
            parent: 'nomina'
        })
        .state('nomina.SeleccionarCompania', {
            url: '/seleccionarCompania',
            templateUrl: 'client/seleccionarCompania/seleccionarCompania.html',
            controller: 'SeleccionarCompaniaController',
            parent: 'nomina'
        })
        // registrar files
        .state('nomina.registrarFiles', {
            url: '/registrarFiles?aplicacion',
            templateUrl: 'client/generales/registrarFiles/registroFiles.html',
            controller: 'RegistroFiles_Controller',
            params: { 'aplicacion': 'nomina', },
            parent: 'nomina'
        })

        // -------------------------------------------------------------------------------------------
        // Catálogos
        // -------------------------------------------------------------------------------------------
        .state('nomina.companias', {
            url: '/companias',
            templateUrl: 'client/contab/catalogos/companias/companias.html',
            controller: 'Catalogos_Companias_Controller',
            parent: 'nomina'
        })
        .state('nomina.cargos', {
            url: '/cargos',
            templateUrl: 'client/nomina/catalogos/cargos/cargos.html',
            controller: 'Catalogos_Nomina_Cargos_Controller',
            parent: 'nomina'
        })
        .state('nomina.departamentos', {
            url: '/departamentos',
            templateUrl: 'client/nomina/catalogos/departamentos/departamentos.html',
            controller: 'Catalogos_Nomina_departamentos_Controller',
            parent: 'nomina'
        })
        .state('nomina.bancos', {
            url: '/bancos',
            templateUrl: 'client/nomina/catalogos/bancos/bancos.html',
            controller: 'Catalogos_Nomina_bancos_Controller',
            parent: 'nomina'
        })
        .state('nomina.rubros', {
            url: '/rubros',
            templateUrl: 'client/nomina/catalogos/rubros/rubros.html',
            controller: 'Catalogos_Rubros_Controller',
            parent: 'nomina'
        })
        .state('nomina.parentescos', {
            url: '/parentescos',
            templateUrl: 'client/nomina/catalogos/parentescos/parentescos.html',
            controller: 'Catalogos_Nomina_parentescos_Controller',
            parent: 'nomina'
        })
        .state('nomina.paises', {
            url: '/paises',
            templateUrl: 'client/nomina/catalogos/paises/paises.html',
            controller: 'Catalogos_Nomina_paises_Controller',
            parent: 'nomina'
        })
        .state('nomina.tiposCuentaBancaria', {
            url: '/tiposCuentaBancaria',
            templateUrl: 'client/nomina/catalogos/tiposCuentaBancaria/tiposCuentaBancaria.html',
            controller: 'Catalogos_Nomina_TiposCuentaBancaria_Controller',
            parent: 'nomina'
        })
        .state('nomina.gruposEmpleados', {
            url: '/gruposEmpleados',
            templateUrl: 'client/nomina/catalogos/gruposEmpleados/gruposEmpleados.html',
            controller: 'Catalogos_Nomina_GruposEmpleados_Controller',
            parent: 'nomina'
        })

        // -------------------------------------------------------------------------------------------
        // Parámetros 
        // -------------------------------------------------------------------------------------------
        .state('nomina.parametros', {
            url: '/parametros',
            templateUrl: 'client/nomina/catalogos/parametros/parametros.html',
            controller: 'Catalogos_Nomina_Parametros_Controller',
            parent: 'nomina'
        })
        .state('nomina.parametros.salarioMinimo', {
            url: '/salarioMinimo',
            templateUrl: 'client/imports/nomina/catalogos/parametros/salarioMinimo/salarioMinimo.html',
            controller: 'catalogos_nomina_parametros_salarioMinimo_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.anticipoSueldo1raQuincena', {
            url: '/anticipoSueldo1raQuincena',
            templateUrl: 'client/imports/nomina/catalogos/parametros/anticipoSueldo1raQuinc/anticipoSueldo1raQuinc.html',
            controller: 'catalogos_nomina_parametros_anticipoSueldo1raQuinc_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.diasVacacionesPorAno', {
            url: '/diasVacacionesPorAno',
            templateUrl: 'client/imports/nomina/catalogos/parametros/diasVacacionesPorAno/diasVacacionesPorAno.html',
            controller: 'catalogos_nomina_parametros_diasVacacionesPorAno_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.deduccionesIslr', {
            url: '/deduccionesIslr',
            templateUrl: 'client/imports/nomina/catalogos/parametros/deduccionesIslr/deduccionesIslr.html',
            controller: 'catalogos_nomina_parametros_deduccionesIslr_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.deduccionesNomina', {
            url: '/deduccionesNomina',
            templateUrl: 'client/imports/nomina/catalogos/parametros/deduccionesNomina/deduccionesNomina.html',
            controller: 'catalogos_nomina_parametros_deduccionesNomina_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.parametrosNomina', {
            url: '/parametrosNomina',
            templateUrl: 'client/imports/nomina/catalogos/parametros/parametrosNomina/parametrosNomina.html',
            controller: 'catalogos_nomina_parametros_parametrosNomina_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.cuentasContablesEmpleadoRubro', {
            url: '/cuentasContablesEmpleadoRubro',
            templateUrl: 'client/nomina/catalogos/cuentasContablesEmpleadoRubro/cuentasContablesEmpleadoRubro.html',
            controller: 'Catalogos_Nomina_CuentasContablesEmpleadoRubro_Controller',
            parent: 'nomina.parametros'
        })
        .state('nomina.parametros.diasFeriados', {
            url: '/diasFeriados',
            templateUrl: 'client/nomina/catalogos/diasFeriados/diasFeriados.html',
            controller: 'Catalogos_Nomina_DiasFeriados_Controller',
            parent: 'nomina.parametros'
        })

        // -------------------------------------------------------------------------------------------
        // Empleados
        // -------------------------------------------------------------------------------------------
        .state('nomina.empleados', {
            url: '/nomina/empleados',
            templateUrl: 'client/nomina/empleados/empleados.html',
            controller: 'Nomina_Empleados_Controller',
            parent: 'nomina'
        })
        .state('nomina.empleados.filter', {
            url: '/nomina/empleados/filter?origen',
            templateUrl: 'client/nomina/empleados/filter.html',
            controller: 'Nomina_EmpleadosFilter_Controller',
            params: { 'origen': null, },
            parent: 'nomina.empleados'
        })
        .state('nomina.empleados.lista', {
            url: '/nomina/empleados/lista?origen&pageNumber',
            templateUrl: 'client/nomina/empleados/lista.html',
            controller: 'Nomina_EmpleadosList_Controller',
            params: { 'origen': null, 'pageNumber': null, },
            parent: 'nomina.empleados'
        })
        .state('nomina.empleados.empleado', {
            url: '/nomina/empleados/empleado?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/nomina/empleados/empleado.html',
            controller: 'Nomina_Empleado_Controller',
            params: { 'origen': null, 'id': null, 'pageNumber': null, 'vieneDeAfuera': null },
            parent: 'nomina.empleados'
        })

        // -------------------------------------------------------------------------------------------
        // Nómina
        // -------------------------------------------------------------------------------------------
        // vacaciones
        .state('nomina.vacaciones', {
            url: '/nomina/vacaciones',
            templateUrl: 'client/nomina/nomina/vacaciones/vacaciones.html',
            controller: 'Nomina_Vacaciones_Controller',
            parent: 'nomina'
        })
        .state('nomina.vacaciones.filter', {
            url: '/nomina/empleados/filter?origen',
            templateUrl: 'client/nomina/nomina/vacaciones/filter.html',
            controller: 'Nomina_VacacionesFilter_Controller',
            params: { 'origen': null, },
            parent: 'nomina.vacaciones'
        })
        .state('nomina.vacaciones.lista', {
            url: '/nomina/empleados/lista?origen&pageNumber',
            templateUrl: 'client/nomina/nomina/vacaciones/lista.html',
            controller: 'Nomina_VacacionesList_Controller',
            params: { 'origen': null, 'pageNumber': null, },
            parent: 'nomina.vacaciones'
        })
        .state('nomina.vacaciones.vacacion', {
            url: '/nomina/empleados/empleado?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/nomina/nomina/vacaciones/vacacion.html',
            controller: 'Nomina_Vacacion_Controller',
            params: { 'origen': null, 'id': null, 'pageNumber': null, 'vieneDeAfuera': null },
            parent: 'nomina.vacaciones'
        })

        // rubros asignados
        .state('nomina.rubrosAsignados', {
            url: '/nomina/rubrosAsignados',
            templateUrl: 'client/nomina/nomina/rubrosAsignados/rubrosAsignados.html',
            controller: 'RubrosAsignados_Controller',
            parent: 'nomina'
        })
        // -------------------------------------------------------------------------------------------
        // Generales
        // -------------------------------------------------------------------------------------------
        // copiar vacaciones
        .state('nomina.generales_copiarVacacionesDesdeSqlServer', {
            url: '/generales_copiarVacacionesDesdeSqlServer',
            templateUrl: 'client/nomina/generales/copiarVacacionesDesdeSqlServer/copiarVacaciones.html',
            controller: 'NominaCopiarVacacionesDesdeSqlServer_Controller',
            parent: 'nomina'
        })
  }
]);
