
// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("MainController",
['$rootScope', '$scope', '$state', '$meteor', '$reactive', '$location',
  function ($rootScope, $scope, $state, $meteor, $reactive, $location) {

    $scope.showProgress = false;

    // $location lee el url de la página que se muestra; nótese que $location lee 'true' y no true para
    // un parámetro en particular, por eso usamos 'true' en vez de true en el código que sigue ...
    let queryParams = $location.search();
    $scope.vieneDeAfuera = queryParams && queryParams.vieneDeAfuera && queryParams.vieneDeAfuera === 'true';

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.helpers({
          userIsAuthenticated: () => {
              return Meteor.userId() ? true : false;
          },
          userIsAdmin: () => {
              return userHasRole(Meteor.user(), 'admin');
          },
          userHasRoleContab: () => {
              return userHasRole(Meteor.user(), 'contab');
          },
          userHasRoleBancos: () => {
              return userHasRole(Meteor.user(), 'bancos');
          },
          userHasRoleNomina: () => {
              return userHasRole(Meteor.user(), 'nomina');
          },
    });

    function userHasRole(user, rol) {
        // debugger;
        // let user = Meteor.user();

        if (!user)
            return false;

        if (user && user.emails && user.emails.length > 0 &&
            _.some(user.emails, email => { return email.address == "admin@admin.com"; }))
                return true;

        if (!user.roles)
            return false;

        // mostramos todas las opciones a usuarios en el rol 'admin'
        if (_.find(user.roles, r => { return r === "admin"; }))
            return true;

        if (!rol)
            return false;

        var found = _.find(user.roles, r => { return r === rol; });
        if (found)
            return true;
        else
            return false;
    };

    // para mantener en $rootScope el current state name. Nótese que lo usamos en bancos, contab, etc.,
    // para mostrar el help cuando el usuario hace un click en el link "?".
    // Este ? está en un state muy arriba en contab, bancos, etc.
    $rootScope.$on('$stateChangeSuccess',
        function(event, toState, toParams, fromState, fromParams) {
            $rootScope.currentStateName = toState.name;
        });
}
]);
