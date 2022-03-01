

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Utilitarios_EliminarCompaniaContab_Controller",
['$scope', '$modal', function ($scope, $meteor) {

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    }


    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContabSeleccionada = {};

    if (companiaSeleccionada)
        companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

    $scope.companiaSeleccionada = {};

    if (companiaContabSeleccionada)
        $scope.companiaSeleccionada = companiaContabSeleccionada;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // -----------------------------------------------------------------------------------------------

    $scope.copiarCatalogosDesdeContab = function() {
        // para reportar el progreso de la tarea en la página
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;

        $scope.showProgress = true;

        Meteor.call('utilitarios.eliminarCompaniaContab', (error, result) => {

          if (error) {
            let errorMessage = err.message ? err.message : err.toString();

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
          }

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'info',
              msg: data
          });

          $scope.showProgress = false;
        }
    }

    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'copiarCatalogos' });
    EventDDP.addListener('bancos_copiarCatalogos_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
