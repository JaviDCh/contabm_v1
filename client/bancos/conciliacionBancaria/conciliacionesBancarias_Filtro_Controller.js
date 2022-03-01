
import lodash from 'lodash';

import { Monedas } from '/imports/collections/monedas'; 
import { Filtros } from '/imports/collections/general/filtros'; 
import { Bancos } from '/imports/collections/bancos/bancos';

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_ConciliacionesBancarias_Filter_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;

    let companiaContab = $scope.$parent.companiaSeleccionada;
    // ------------------------------------------------------------------------------------------------

    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope
    $scope.helpers({
        bancos: () => {
            return Bancos.find( {}, { fields: { banco: 1, nombre: 1 }} );
        },

        monedas: () => {
            return Monedas.find( {}, { fields: { moneda: 1, descripcion: 1, simbolo: 1 }} );
        },
    });

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };

    $scope.nuevo = function () {
        $state.go('bancos.conciliacionesBancarias.conciliacionBancaria', {
            origen: $scope.origen,
            id: "0",
            limit: 0
        });
    };

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };

    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;

        let filtro = $scope.filtro;
        filtro.cia = companiaContab.numero;

          Meteor.call('conciliacionBancariaPrepararLista', JSON.stringify(filtro), companiaContab, (err, result) => {

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
                      type: 'warning',
                      msg: result.message
                  });

                  $scope.showProgress = false;
                  $scope.$apply();
                  return;
              };

              if (lodash.isInteger(result.cantidadRecs) && parseInt(result.cantidadRecs) === 0) {
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
            if (Filtros.findOne({ nombre: 'bancos.conciliacionBancaria', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'bancos.conciliacionBancaria', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'bancos.conciliacionBancaria',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------

            $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('bancos.conciliacionesBancarias.lista', { origen: $scope.origen, limit: 50 });
        });
    };


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'bancos.conciliacionBancaria', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);

    $scope.cuentasBancarias = $scope.$parent.cuentasBancarias;


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosConciliacionesBancarias' });
    EventDDP.addListener('bancos_leerBancosConciliacionesBancarias_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
