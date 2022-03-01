

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Contab_CopiarCatalogos_Controller",
['$scope', '$meteor', '$modal', '$reactive', function ($scope, $meteor, $modal, $reactive) {
    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        this.alerts.splice(index, 1);
    };

    $scope.copiarCatalogosDesdeContab = function() {

        // para reportar el progreso de la tarea en la página
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;

        $scope.showProgress = true;

        $meteor.call('contab.CopiarCatalogos').then(
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

    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'copiarCatalogos' });
    EventDDP.addListener('contab_copiarCatalogos_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();

        // debugger;
    });
}
]);
