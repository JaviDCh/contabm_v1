

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_Cierre_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

        $scope.processProgress = {
            current: 0,
            max: 0,
            progress: 0,
            message: ''
        };

        // -------------------------------------------------------------------------------------------------------
        // para recibir los eventos desde la tarea en el servidor ...
        EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'cierreBancos' });
        EventDDP.addListener('bancos_cierreBancos_reportProgress', function(process) {
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
      $scope.mesesArray = [];

      $meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
        function (data) {
            //   debugger;
            $scope.ultimoMesCerrado = JSON.parse(data);
            $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

            // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
            // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...

            // si el último mes cerrado es Diciembre, agregamos solo 'Traspaso de saldos al año: 9999'
            if (parseInt($scope.ultimoMesCerrado.mes) == 12)
                $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
            else
                $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);

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
              $scope.alerts.push({ type: 'danger', msg: errorMessage });

              $scope.showProgress = false;
          });


  $scope.parametros = {};

  $scope.cerrar = () => {

      if (!$scope.parametros.mesACerrar || !_.isArray($scope.parametros.mesACerrar) || _.isEmpty($scope.parametros.mesACerrar)) {

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'danger',
              msg: `Ud. debe seleccionar el mes que quiere cerrar.`
          });

          $scope.showProgress = false;
          return;
      };

      if ($scope.parametros.mesACerrar.length > 1) {

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'danger',
              msg: `Seleccione un solo mes en la lista.<br />
                    Si desea cerrar más de un mes, debe seleccionar <b>solo</b> el último en la lista.`
          });

          $scope.showProgress = false;
          return;
      };

      $scope.showProgress = true;

      // si el usuario va a cerrar meses, ejecutamos el cierre mensual
      // si va a ejecutar el cierre para un mes 13, ejecutamos el traspaso de saldos

      if ($scope.parametros.mesACerrar[0] < 13) {
          let mesesArray = [];

          for (let i = $scope.ultimoMesCerrado.mes + 1; i <= $scope.parametros.mesACerrar[0]; i++) {
              mesesArray.push(i);
          }

          // para medir y mostrar el progreso de la tarea ...
          $scope.processProgress.current = 0;
          $scope.processProgress.max = 0;
          $scope.processProgress.progress = 0;

          // usamos apply para que el meteor method no se ejecute más de una vez; ésto ocurre cuando la ejecución es muy larga y el client se desconecta (??)
          // al reconectar, el method se ejecuta nuevamente. No con apply ...
          // NOTA: ésto debe cambiar cuando hagamos un nuevo cierre, con la nueva función de 'cuentas corrientes' en bancos ... 
          Meteor.apply('bancosCierre',[ mesesArray, $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc ], { wait: true }, function(err, result1) {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

              $scope.alerts.length = 0;
              $scope.alerts.push({ type: 'danger', msg: errorMessage });

              $scope.showProgress = false;
              $scope.apply();

              return;
            }

            // tal y como hicimos al abrir  la página, leemos el umc y reconstruímos la lista de meses
            $scope.ultimoMesCerrado = {};

            Meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc, function(err, result2) {

              if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
                $scope.apply();

                return;
              }

              $scope.ultimoMesCerrado = JSON.parse(result2);
              $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

              // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
              // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...
              $scope.mesesArray = [];
              if (parseInt($scope.ultimoMesCerrado.mes) == 12)
                  $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
              else
                  $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);


              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: result1
              });

              $scope.showProgress = false;
              $scope.apply();
          })
        })
      }
      else
      {
          // para medir y mostrar el progreso de la tarea ...
          $scope.processProgress.current = 0;
          $scope.processProgress.max = 0;
          $scope.processProgress.progress = 0;

          $meteor.call('bancosCierre_traspasoSaldos', $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc).then(
            function (data0) {

                // tal y como hicimos al abrir  la página, leemos el umc y reconstruímos la lista de meses
                $scope.ultimoMesCerrado = {};

                $meteor.call('bancosLeerUltimoMesCerrado', companiaSeleccionadaDoc).then(
                  function (data) {

                      $scope.ultimoMesCerrado = JSON.parse(data);
                      $scope.mes2 = nombreMes($scope.ultimoMesCerrado.mes);

                      // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
                      // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...
                      $scope.mesesArray = [];
                      if (parseInt($scope.ultimoMesCerrado.mes) == 12)
                          $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
                      else
                          $scope.mesesArray = determinarMesesHastaDiciembre($scope.ultimoMesCerrado.mes);


                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'info',
                          msg: data0
                      });

                      $scope.showProgress = false;
                  },
                    function (err) {
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                        $scope.alerts.length = 0;
                        $scope.alerts.push({ type: 'danger', msg: errorMessage });

                        $scope.showProgress = false;
                    });
            },
              function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({ type: 'danger', msg: errorMessage });

                  $scope.showProgress = false;
              });
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


function determinarMesesHastaDiciembre(mes) {

    // esta función determina los meses que faltan, desde el mes que se pasa, hasta diciembre ...

    let mesesArray = [];

    for (let i = mes + 1; i <= 12; i++) {
        mesesArray.push({ mes: i, nombre: nombreMes(i) });
    };

    return mesesArray;
};
