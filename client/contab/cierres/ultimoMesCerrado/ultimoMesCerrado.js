
import lodash from 'lodash';
import moment from 'moment'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Contab_UltimoMesCerrado_Controller",
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
      let mesesDelAnoFiscal = [];

      $meteor.call('contabLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
        function (data) {
        //   debugger;

            let result = JSON.parse(data);

            // cargamos el contenido de la tabla mesesDelAnoFiscal en un array
            result.mesesAnoFiscal.forEach((mes) => {
                mesesDelAnoFiscal.push(mes);
            });

            $scope.ultimoMesCerrado = result.ultimoMesCerradoContab;

            // la correspondencia entre el mes fiscal y el mes calendario, está en mesesDelAnoFiscal
            $scope.ultimoMesCerrado.mes2 = lodash.find(mesesDelAnoFiscal,
                (x) => { return x.mesFiscal === $scope.ultimoMesCerrado.mes; }).nombreMes;

            $scope.ultimoMesCerrado.ultAct2 = moment($scope.ultimoMesCerrado.ultAct).format('DD-MM-YYYY h:m a');
            $scope.ultimoMesCerrado.manAuto2 = $scope.ultimoMesCerrado.manAuto === 'A' ? 'Automático' : 'Manual';

            // $scope.alerts.length = 0;
            // $scope.alerts.push({
            //   type: 'info',
            //   msg: "Ok, el último mes cerrado, para la compañía seleccionada, ha sido leído en forma satisfactoria. "
            // });

            $scope.showProgress = false;
        },
          function (err) {
              let errorMessage = mensajeErrorDesdeMethod_preparar(err);

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorMessage
              });

              $scope.showProgress = false;
          });

  $scope.cambiarUltimoMesCerrado = () => {

      // lo primero que hacemos es leer los años que el usuario ha registrado en Bancos. Es para construir una lista en la
      // cual el usuario seleccione el año ...
      $scope.showProgress = true;

      $meteor.call('contabDeterminarAnosCerrados', companiaSeleccionadaDoc).then(
        function (data) {
            var modalInstance = $modal.open({
                templateUrl: 'client/contab/cierres/ultimoMesCerrado/cambiarUMCModal.html',
                controller: 'Contab_CambiarUMCModal_Controller',
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
                    mesesDelAnoFiscal: () => {
                        return mesesDelAnoFiscal;           // contenido de MesesDelAnoFiscal
                    },
                }
            }).result.then(
                  function (resolve) {
                      // cuando el usuario cambia el umc, el modal es cerrado y regresamos, volvemos a leer el umc
                      // desde sql server ...

                      $scope.showProgress = true;

                      $scope.ultimoMesCerrado = {};

                      $meteor.call('contabLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
                        function (data) {
                            //   debugger;

                            let result = JSON.parse(data);

                            $scope.ultimoMesCerrado = result.ultimoMesCerradoContab;

                            // la correspondencia entre el mes fiscal y el mes calendario, está en mesesDelAnoFiscal
                            $scope.ultimoMesCerrado.mes2 = lodash.find(mesesDelAnoFiscal,
                                (x) => { return x.mesFiscal === $scope.ultimoMesCerrado.mes; }).nombreMes;

                            $scope.ultimoMesCerrado.ultAct2 = moment($scope.ultimoMesCerrado.ultAct).format('DD-MM-YYYY h:m a');
                            $scope.ultimoMesCerrado.manAuto2 = $scope.ultimoMesCerrado.manAuto === 'A' ? 'Automático' : 'Manual';

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                              type: 'info',
                              msg: `Ok, el último mes cerrado, en <em>${companiaSeleccionadaDoc.nombre}</em>, ha sido cambiado en forma satisfactoria.`
                            });

                            $scope.showProgress = false;
                        },
                          function (err) {
                              let errorMessage = mensajeErrorDesdeMethod_preparar(err);

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
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: errorMessage
              });

              $scope.showProgress = false;
          });


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
