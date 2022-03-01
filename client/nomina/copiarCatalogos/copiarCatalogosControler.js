

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Nomina_CopiarCatalogos_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    // debugger;
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'nomina', process: 'copiarCatalogos' });
    EventDDP.addListener('nomina_copiarCatalogos_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    };

    // let self = this;

    $scope.copiarCatalogos_nomina_DesdeContab = function() {

        // para reportar el progreso de la tarea en la página
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = '';

        $scope.showProgress = true;

        $meteor.call('nomina_CopiarCatalogos').then(
          function (data) {

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: data
              });

              $scope.showProgress = false;
          },
          function (err) {

              let errorMessage = err.message ? err.message : err.toString();

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorMessage
              });

              $scope.showProgress = false;
          });
    };
}
]);
