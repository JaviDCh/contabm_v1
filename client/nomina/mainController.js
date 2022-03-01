


// Este controller (angular) se carga con la página primera del programa

import { mostrarHelp } from "../imports/clientGlobalMethods/mostrarHelp_method";

angular.module("contabm.nomina").controller("Nomina_Main_Controller",
['$rootScope', '$scope', '$state', '$stateParams', function ($rootScope, $scope, $state, $stateParams) {

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

    $scope.userHasRole = (rol) => {
        // debugger;
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

        if (!rol)
            return false;

        var found = _.find(user.roles, r => { return r === rol; });
        if (found)
            return true;
        else
            return false;
    };
}
]);
