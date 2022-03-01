
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("AdministracionUtilitarios_EliminarCompanias_Controller",
['$scope', '$modal', function ($scope, $modal) {

      $scope.processProgress = {
          current: 0,
          max: 0,
          progress: 0,
          message: ''
      };

      // -------------------------------------------------------------------------------------------------------
      // para recibir los eventos desde la tarea en el servidor ...
      EventDDP.setClient({ myuserId: Meteor.userId(), app: 'administracion', process: 'eliminarDatosCompaniaContab' });
      EventDDP.addListener('administracion_utilitarios_eliminarCompania_reportProgress', function(process) {
          $scope.processProgress.current = process.current;
          $scope.processProgress.max = process.max;
          $scope.processProgress.progress = process.progress;
          $scope.processProgress.message = process.message ? process.message : null;
          // if we don't call this method, angular wont refresh the view each time the progress changes ...
          // until, of course, the above process ends ...
          $scope.$apply();
      });
      // -------------------------------------------------------------------------------------------------------

      $scope.alerts.length = 0;
      $scope.showProgress = true;

      let companiaContabSeleccionada = $scope.$parent.companiaSeleccionada;
      $scope.companiaContabSeleccionada = $scope.$parent.companiaSeleccionada;

      $scope.eliminarDatosCompaniaContabSeleccionada = function () {

              DialogModal($modal, "<em>Administración - Utilitarios - Eliminar compañías <b>Contab</b></em>",
                                  `¿Realmente desea eliminar <b>todos los datos</b> asociados a la compañía contab seleccionada
                                   (<em><b>${companiaContabSeleccionada.nombre}</b></em>)?`,
                                   true).
                then(
                  function (resolve) {
                      $scope.eliminarDatosCompaniaContabSeleccionada2();
                  },
                  function (err) {
                      return true;
                  });
      }

      $scope.eliminarDatosCompaniaContabSeleccionada2 = () => {

        $scope.showProgress = true;

        // para medir y mostrar el progreso de la tarea ...
        $scope.processProgress.current = 0;
        $scope.processProgress.max = 0;
        $scope.processProgress.progress = 0;
        $scope.processProgress.message = '';

        Meteor.call('administracion.utilitarios.eliminarDatosCompaniaContab', companiaContabSeleccionada, (err, result) => {

          if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();

            return;
          }

          if (result.error) {

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: result.message,
              });

              $scope.showProgress = false;
              $scope.$apply();

              return;
          }

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'info',
              msg: result.message,
          });

          $scope.showProgress = false;
          $scope.$apply();
        });
      }

      $scope.showProgress = false;
}
]);
