

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("NominaCopiarVacacionesDesdeSqlServer_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal',
  function ($scope, $state, $stateParams, $meteor, $modal) {

    //   debugger;
      $scope.showProgress = true;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

      let companiaContab = null;
      if (companiaSeleccionada)
          companiaContab = Companias.findOne(companiaSeleccionada.companiaID);

      $scope.companiaSeleccionada = {};

      if (companiaContab)
          $scope.companiaSeleccionada = companiaContab;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.copiarVacaciones = () => {

          $scope.showProgress = true;

          Meteor.call('nomina_generales_copiarVacacionesDesdeSqlServer', companiaContab.numero, (err, result) => {

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
              };

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: result
              });

              $scope.showProgress = false;
              $scope.$apply();
          });
      };

      $scope.showProgress = false;
}
]);
