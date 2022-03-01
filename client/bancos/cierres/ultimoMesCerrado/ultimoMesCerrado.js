
import moment from 'moment';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Bancos_UltimoMesCerrado_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada)
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.showProgress = true;

      $scope.ultimoMesCerrado = {};

      $meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
        function (data) {
            //   debugger;
            $scope.ultimoMesCerrado = JSON.parse(data);

            $scope.ultimoMesCerrado.mes2 = nombreMes($scope.ultimoMesCerrado.mes);
            $scope.ultimoMesCerrado.ultAct2 = moment($scope.ultimoMesCerrado.ultAct).format('DD-MM-YYYY h:m a');
            $scope.ultimoMesCerrado.manAuto2 = $scope.ultimoMesCerrado.manAuto === 'A' ? 'Automático' : 'Manual'

            // $scope.alerts.length = 0;
            // $scope.alerts.push({
            //   type: 'info',
            //   msg: "Ok, el último mes cerrado, para la compañía seleccionada, ha sido leído en forma satisfactoria. "
            // });

            $scope.showProgress = false;
        },
          function (err) {
              //   debugger;
              let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
              if (err.errorType)
                  errorMessage += " (" + err.errorType + ")";

              errorMessage += "<br />";

              if (err.message)
                  // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                  errorMessage += err.message + " ";
              else {
                  if (err.reason)
                      errorMessage += err.reason + " ";

                  if (err.details)
                      errorMessage += "<br />" + err.details;
              };

              if (!err.message && !err.reason && !err.details)
                  errorMessage += err.toString();

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorMessage
              });

              $scope.showProgress = false;
          });

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

  $scope.cambiarUltimoMesCerrado = () => {

      // lo primero que hacemos es leer los años que el usuario ha registrado en Bancos. Es para construir una lista en la
      // cual el usuario seleccione el año ...

      $scope.showProgress = true;

      $meteor.call('bancosDeterminarAnosCerrados', companiaSeleccionadaDoc).then(
        function (data) {
            var modalInstance = $modal.open({
                templateUrl: 'client/bancos/cierres/ultimoMesCerrado/cambiarUMCModal.html',
                controller: 'CambiarUMCModal_Controller',
                size: 'md',
                resolve: {
                    companiaSeleccionadaDoc: () => {
                        return companiaSeleccionadaDoc;
                    },
                    ultimoMesCerrado: () => {
                        return $scope.ultimoMesCerrado;
                    },
                    anosArray: () => {
                        return JSON.parse(data);            // lista de años de saldos ...
                    },
                }
            }).result.then(
                  function (resolve) {
                      // cuando el usuario cambia el umc, el modal es cerrado y regresamos, volvemos a leer el umc
                      // desde sql server ...

                      $scope.showProgress = true;

                      $scope.ultimoMesCerrado = {};

                      $meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
                        function (data) {
                            //   debugger;
                            $scope.ultimoMesCerrado = JSON.parse(data);

                            $scope.ultimoMesCerrado.mes2 = nombreMes($scope.ultimoMesCerrado.mes);
                            $scope.ultimoMesCerrado.ultAct2 = moment($scope.ultimoMesCerrado.ultAct).format('DD-MM-YYYY h:m a');
                            $scope.ultimoMesCerrado.manAuto2 = $scope.ultimoMesCerrado.manAuto === 'A' ? 'Automático' : 'Manual'

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                              type: 'info',
                              msg: `Ok, el último mes cerrado, en <em>${companiaSeleccionadaDoc.nombre}</em>, ha sido cambiado en forma satisfactoria.`
                            });

                            $scope.showProgress = false;
                        },
                          function (err) {
                              //   debugger;
                              let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                              if (err.errorType)
                                  errorMessage += " (" + err.errorType + ")";

                              errorMessage += "<br />";

                              if (err.message)
                                  // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                                  errorMessage += err.message + " ";
                              else {
                                  if (err.reason)
                                      errorMessage += err.reason + " ";

                                  if (err.details)
                                      errorMessage += "<br />" + err.details;
                              };

                              if (!err.message && !err.reason && !err.details)
                                  errorMessage += err.toString();

                              $scope.alerts.length = 0;
                              $scope.alerts.push({
                                  type: 'danger',
                                  msg: errorMessage
                              });

                              $scope.showProgress = false;
                          });
                  },
                  function (cancel) {
                      $scope.showProgress = false;
                      return true;
                  });
        },
          function (err) {
              //   debugger;
              let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
              if (err.errorType)
                  errorMessage += " (" + err.errorType + ")";

              errorMessage += "<br />";

              if (err.message)
                  // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                  errorMessage += err.message + " ";
              else {
                  if (err.reason)
                      errorMessage += err.reason + " ";

                  if (err.details)
                      errorMessage += "<br />" + err.details;
              };

              if (!err.message && !err.reason && !err.details)
                  errorMessage += err.toString();

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

function nombreMes(mes) {

    switch (mes) {
        case 0:
            return 'Ninguno';
            break;
        case 1:
            return 'Enero';
            break;
        case 2:
            return 'Febrero';
            break;
        case 3:
            return 'Marzo';
            break;
        case 4:
            return 'Abril';
            break;
        case 5:
            return 'Mayo';
            break;
        case 6:
            return 'Junio';
            break;
        case 7:
            return 'Julio';
            break;
        case 8:
            return 'Agosto';
            break;
        case 9:
            return 'Septiembre';
            break;
        case 10:
            return 'Octubre';
            break;
        case 11:
            return 'Noviembre';
            break;
        case 12:
            return 'Diciembre';
            break;
        case 13:
            return 'Anual';
            break;
        default:
            return "Indefinido (?)";
    };
};
