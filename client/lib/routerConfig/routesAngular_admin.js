

angular.module("contabm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
        // ----------------------------------------------------------------
        // administración
        // ----------------------------------------------------------------
        .state('administracion', {
            url: '/administracion',
            templateUrl: 'client/administracion/main.html',
            controller: 'Administracion_Main_Controller'
        })
        .state('administracion.roles', {
            url: '/roles',
            templateUrl: 'client/administracion/roles/roles.html',
            controller: 'RolesController',
            parent: 'administracion'
        })
        .state('administracion.usuariosRoles', {
            url: '/usuariosRoles',
            templateUrl: 'client/administracion/usuariosRoles/usuariosRoles.html',
            controller: 'UsuariosRolesController',
            parent: 'administracion'
        })
        .state('administracion.usuariosCompanias', {
            url: '/usuariosCompanias',
            templateUrl: 'client/administracion/usuariosCompanias/usuariosCompanias.html',
            controller: 'UsuariosCompaniasController',
            parent: 'administracion'
        })

        // administración - utilitarios
        .state('administracion.utilitarios', {
            url: '/utilitarios',
            templateUrl: 'client/administracion/utilitarios/utilitarios.html',
            controller: 'AdministracionUtilitarios_Controller',
            parent: 'administracion'
        })
        .state('administracion.utilitarios.eliminarCompaniasContab', {
            url: '/eliminarCompaniasContab',
            templateUrl: 'client/administracion/utilitarios/eliminarCompaniasContab/eliminarCompaniasContab.html',
            controller: 'AdministracionUtilitarios_EliminarCompanias_Controller',
            parent: 'administracion.utilitarios'
        })
  }
]);
