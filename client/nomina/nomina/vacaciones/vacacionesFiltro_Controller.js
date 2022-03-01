
import { Empleados } from '/models/nomina/empleados'; 
import { Filtros } from '/imports/collections/general/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Nomina_VacacionesFilter_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    // debugger;
    $scope.showProgress = false;

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0,
        message: ''
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'nomina', process: 'nomina_vacaciones' });
    EventDDP.addListener('nomina_vacaciones_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // -------------------------------------------------------------------------------------------------------

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;

    let companiaContab = $scope.$parent.companiaSeleccionada; 

    $scope.helpers({
        empleados: () => {
            return Empleados.find({ cia: companiaContab.numero });
        },
    });

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };

    $scope.nuevo = function () {
        $state.go("nomina.vacaciones.vacacion", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
    };

    // -------------------------------------------------------------------------
    // aplicamos el filtro indicado por el usuario y abrimos la lista
    // -------------------------------------------------------------------------
    $scope.aplicarFiltroYAbrirLista = function () {

          $scope.showProgress = true;

          Meteor.call('vacaciones', JSON.stringify($scope.filtro), companiaContab.numero, (err, result) => {

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

              if (parseInt(result) == 0) {
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'warning',
                      msg: "0 registros seleccionados. Por favor revise el <em>criterio de selección</em> indicado e indique uno diferente.<br />" +
                          "(Nota: el filtro <b>solo</b> regresará registros si existe una <em>compañía seleccionada</em>.)"
                  });

                  $scope.showProgress = false;
                  $scope.$apply();
                  return;
              };

              // ------------------------------------------------------------------------------------------------------
              // guardamos el filtro indicado por el usuario
              if (Filtros.findOne({ nombre: 'nomina.vacaciones', userId: Meteor.userId() }))
                  // el filtro existía antes; lo actualizamos
                  // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                  Filtros.update(Filtros.findOne({ nombre: 'nomina.vacaciones', userId: Meteor.userId() })._id,
                                 { $set: { filtro: $scope.filtro } },
                                 { validate: false });
              else
                  Filtros.insert({
                      _id: new Mongo.ObjectID()._str,
                      userId: Meteor.userId(),
                      nombre: 'nomina.vacaciones',
                      filtro: $scope.filtro
                  });
              // ------------------------------------------------------------------------------------------------------

              $scope.showProgress = false;

              // activamos el state Lista ...
              $state.go('nomina.vacaciones.lista', { origen: $scope.origen, pageNumber: -1 });
          });
      };

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'nomina.vacaciones', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);
}
]);
