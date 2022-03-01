


import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Contab_Cierre_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'cierreContab' });
    EventDDP.addListener('contab_cierreContab_reportProgress', function(process) {
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
  let mesesDelAnoFiscal = [];

  // para preparar la lista de meses a cerrar que se muestra al usuario ...
  $scope.showProgress = true;
  construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc);


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

      // para medir y mostrar el progreso de la tarea ...
      $scope.processProgress.current = 0;
      $scope.processProgress.max = 0;
      $scope.processProgress.progress = 0;

      // el mes que el usuario seleccionó en la lista (-10: asientos automáticos; -20: cierre anual)
      let mesACerrar = $scope.parametros.mesACerrar[0];

      // si el usuario va a cerrar meses, ejecutamos el cierre mensual
      // si va a ejecutar el cierre para un mes 13, ejecutamos el traspaso de saldos


      // $scope.parametros.mesACerrar[0]: selección del usuario en la lista
      // -10: construir (o reconstruir) asientos del tipo cierre anual
      // -20: cierre anual

      if ( mesACerrar > 0 && mesACerrar < 13 ) {
          let mesesArray = [];

          // preparamos un arrray con los meses a cerrar que el usuario seleccionó en la lista (puede ser 1 o varios)
          for (let i = $scope.ultimoMesCerrado.mes + 1; i <= $scope.parametros.mesACerrar[0]; i++) {
              mesesArray.push(i);
          };

          Meteor.apply('contabCierre',
                       [ mesesArray, $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc ],
                       [{ noRerty: true }],
                       (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'info', msg: result });

                construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc);
          })
      }
      else if (mesACerrar === -30) {
          Meteor.apply('construirAsientoAutomaticoCierre', [ $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc ], [{ noRetry: true }], (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'info', msg: result });

                construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc);
          })
      }
      else if (mesACerrar === -20) {

          mesesArray = [ 13 ];      // para indicar que debemos efectuar el cierre de un mes (virtual) 13 ...

          $meteor.call('contabCierre', mesesArray, $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc).then(
            function (data0) {
                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'info', msg: data0 });

                construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc)
              },
              function (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({ type: 'danger', msg: errorMessage });

                  $scope.showProgress = false;
              })
      }
      else if (mesACerrar === 13) {
          $meteor.call('contabTraspasoSaldos', $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc).then(
            function (data0) {
                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'info', msg: data0 });

                construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc)
              },
              function (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({ type: 'danger', msg: errorMessage });

                  $scope.showProgress = false;
              })
      }
  }

}
]);


function construirYMostrarListaDeMesesACerrar($meteor, $scope, mesesDelAnoFiscal, companiaSeleccionadaDoc) {

    // para construir la lista de meses a cerrar que se muestra al usuario para que seleccione el/los que desea cerrar
    // nótese que existen casos especiales: cuando se ha cerrado ya todo el año y vienen el cierre anual y el traspaso de saldos ...
    Meteor.call('contabLeerUltimoMesCerrado', companiaSeleccionadaDoc, (err, result) => {

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

          let result2 = JSON.parse(result);

          // la tabla MesesDelAnoFiscal viene también con este Method
          // cargamos el contenido de la tabla mesesDelAnoFiscal en un array
          mesesDelAnoFiscal = [];
          result2.mesesAnoFiscal.forEach((mes) => {
              mesesDelAnoFiscal.push(mes);
          });

          $scope.ultimoMesCerrado = result2.ultimoMesCerradoContab;

          // Nombre del último mes cerrado: la correspondencia entre el mes fiscal y el mes calendario, está en mesesDelAnoFiscal
          $scope.mes2 = lodash.find(mesesDelAnoFiscal, (x) => { return x.mesFiscal === $scope.ultimoMesCerrado.mes; }).nombreMes;

          // determinamos los meses que faltan, desde el último mes cerrado, hasta diciembre (más anual)
          // y mostramos al usuario en una lista, para que indique hasta donde desea cerrar ...

          $scope.mesesArray = [];

          // si el último mes cerrado es Diciembre, agregamos solo 'Traspaso de saldos al año: 9999'
          if (parseInt($scope.ultimoMesCerrado.mes) == 12) {

              // cuando se ha cerrado el último mes del año, ejecutamos un method para determinar si existen o no
              // asientos del tipo cierre anual; en base a ésto, proponemos construir/reconstruir estos asientos o
              // cerrar el año

              // el usuario puede venir del cierre (ie: lo acaba de ejecutar). Si acaba de agregar asientos automáticos, proponemos
              // que efectúe el cierre anual ...
              if ($scope.parametros && _.isArray($scope.parametros.mesACerrar) && $scope.parametros.mesACerrar[0] === -30) {
                  $scope.mesesArray.push({ mes: -20, nombre: 'Cierre anual para el año ' + parseInt($scope.ultimoMesCerrado.ano) });

                  $scope.showProgress = false;
                  $scope.$apply();
              }
              else {
                  Meteor.call('determinarSiExisteAsientoAutomaticoCierreAnual', $scope.ultimoMesCerrado.ano, companiaSeleccionadaDoc, (err, result) => {

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

                    let result3 = JSON.parse(result);

                    if (result3.cantidadAsientosTipoCierreAnual > 0) {

                        // ya existen asientos de tipo cierre anual; proponemos reconstruirlos
                        $scope.alerts.push({
                            type: 'info',
                            msg: `El cierre mensual para el <b>último</b> mes del año ha sido ejecutado.<br />
                                  Hemos encontrado que <b>ya existen</b> asientos de tipo <em>cierre anual</em> para el año fiscal
                                  ${$scope.ultimoMesCerrado.ano.toString()}. <br /><br />
                                  Ud. puede volver a construirlos ahora, o ejecutar el cierre anual directamente.
                            `
                        });

                        $scope.mesesArray.push({ mes: -30, nombre: 'Reconstruir asientos de tipo cierre anual' });
                        $scope.mesesArray.push({ mes: -20, nombre: 'Cierre anual para el año ' + parseInt($scope.ultimoMesCerrado.ano) });

                        $scope.showProgress = false;
                        $scope.$apply();
                    }
                    else {

                        // no existen asientos de tipo cierre anual; proponemos agregarlos
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: `El cierre mensual para el <b>último</b> mes del año ha sido ejecutado.<br />
                                  Hemos encontrado que <b>no existen</b> asientos de tipo <em>cierre anual</em> para el año fiscal
                                  ${$scope.ultimoMesCerrado.ano.toString()}. <br /><br />
                                  Ud. debe construirlos ahora; también puede ejecutar el cierre anual directamente.
                            `
                        });

                        $scope.mesesArray.push({ mes: -30, nombre: 'Construir asientos de tipo cierre anual' });
                        $scope.mesesArray.push({ mes: -20, nombre: 'Cierre anual para el año ' + parseInt($scope.ultimoMesCerrado.ano) });

                        $scope.showProgress = false;
                        $scope.$apply();
                    }
              })
          }
      }
      else if (parseInt($scope.ultimoMesCerrado.mes) == 13) {
          $scope.mesesArray.push({ mes: 13, nombre: 'Traspaso de saldos al año ' + (parseInt($scope.ultimoMesCerrado.ano) + 1) });
          $scope.showProgress = false;
          $scope.$apply();
      }
      else {
          $scope.mesesArray = determinarMesesHastaElUltimoMesFiscal($scope.ultimoMesCerrado.mes, mesesDelAnoFiscal);
          $scope.showProgress = false;
          $scope.$apply();
      }
    })
}




function determinarMesesHastaElUltimoMesFiscal(mes, mesesDelAnoFiscal) {

    // esta función determina los meses que faltan, desde el mes que se pasa, hasta diciembre ...

    let mesesArray = [];

    for (let i = mes + 1; i <= 12; i++) {
        mesesArray.push({ mes: i, nombre: _.find(mesesDelAnoFiscal, (m) => { return m.mesFiscal === i; }).nombreMes });
    };

    return mesesArray;
};
