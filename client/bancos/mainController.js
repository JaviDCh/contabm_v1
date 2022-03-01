


import { mostrarHelp } from "../imports/clientGlobalMethods/mostrarHelp_method";

angular.module("contabm").controller("Bancos_Main_Controller",
['$rootScope', '$scope', '$state', '$stateParams', '$location',
function ($rootScope, $scope, $state, $stateParams, $location) {

  // ui-bootstrap alerts ...
  $scope.alerts = [];

    // este código jQuery permite que los 'subMenu' se muestren con un click en el Bootstrap navBar
    (function($){
        $(document).ready(function(){
            $('ul.dropdown-menu [data-toggle=dropdown]').on('click', function(event) {
                event.preventDefault();
                event.stopPropagation();
                $(this).parent().siblings().removeClass('open');
                $(this).parent().toggleClass('open');
            });
        });
    })(jQuery);

    $scope.mostrarHelp = () => {
        // cada vez que el usuario cambia a un state, grabamos su nombre en $rootScope (en client/lib/mainController.js) ...
        if ($rootScope.currentStateName) { 
            mostrarHelp($rootScope.currentStateName);
        }
    }

    // $location lee el url de la página que se muestra; nótese que $location lee 'true' y no true, por eso
    // usamos true con comillas
    let queryParams = $location.search();
    $scope.vieneDeAfuera = queryParams && queryParams.vieneDeAfuera && queryParams.vieneDeAfuera === 'true';

    $scope.userHasRole = (rolesArray) => {
        // debugger;
        if (!_.isArray(rolesArray) || !rolesArray.length) {
            return;
        };

        let user = Meteor.user();

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


        // si el usuario tiene solo uno de los roles en el array, regresamos true ...
        let returnValue = false;
        rolesArray.forEach((rol) => {
            var found = _.find(user.roles, (r) => { return r === rol; });
            if (found) {
                returnValue = true;
                return false;
            };
        });

        return returnValue;
    };
}
]);
