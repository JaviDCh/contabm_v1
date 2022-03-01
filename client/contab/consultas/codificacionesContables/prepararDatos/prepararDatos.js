

import lodash from 'lodash';
import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Filtros } from '/imports/collections/general/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Contab_Consultas_CodificacionesContables_PrepararDatos_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

        $scope.processProgress = {
            current: 0,
            max: 0,
            progress: 0,
            message: ''
        };

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
        // ------------------------------------------------------------------------------------------------


        let codificaciones_ui_grid_api = null;

        $scope.filtro = {};
        $scope.filtro.codificacionSeleccionada = {};

        $scope.codificaciones_ui_grid = {

            enableSorting: true,
            showColumnFooter: false,
            enableRowSelection: true,
            enableRowHeaderSelection: false,
            multiSelect: false,
            enableSelectAll: false,
            selectionRowHeaderWidth: 0,
            rowHeight: 25,

            onRegisterApi: function (gridApi) {

              codificaciones_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  $scope.filtro.codificacionSeleccionada = {};

                  if (row.isSelected) {
                      $scope.filtro.codificacionSeleccionada = row.entity;
                  }
                  else
                      return;
              });
            },
            // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
            rowIdentity: function (row) {
              return row._id;
            },

            getRowIdentity: function (row) {
              return row._id;
            }
        };


        $scope.codificaciones_ui_grid.columnDefs = [
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 250,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
        ];


        $scope.showProgress = true;
      //   debugger;
        Meteor.subscribe('codificacionesContables', companiaSeleccionadaDoc.numero, () => {

            $scope.helpers({
                codificacionesContables: () => {
                  return CodificacionesContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
                }
            });

            $scope.codificaciones_ui_grid.data = [];
            if (_.isArray($scope.codificacionesContables))
               $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: $scope.codificacionesContables.length.toString() + " registros han sido seleccionados ..."
            });

            // para seleccionar el row en el ui-grid ... nótese que la 'codificaciónSeleccionada'
            // es establecida más abajo, pero antes que se ejecute este código y ya debe estar
            // allí para este momento; además, ui_grid_api también debe estar establecida para este
            // momento, pues se hace arriba cuando el ui-grid es inicializado (antes que este subscription)
            if ($scope.filtro.codificacionSeleccionada) {
                if (codificaciones_ui_grid_api) {
                    codificaciones_ui_grid_api.grid.modifyRows($scope.codificaciones_ui_grid.data);
                    codificaciones_ui_grid_api.selection.selectRow($scope.filtro.codificacionSeleccionada);
                };
            };

            $scope.showProgress = false;
            $scope.$apply();
        });


        $scope.prepararDatos = () => {

            if (!$scope.filtro) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar un filtro a este proceso."
                });

                return;
            };

            if (!$scope.filtro.codificacionSeleccionada || lodash.isEmpty($scope.filtro.codificacionSeleccionada)) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe seleccionar la codificación contable para la cual desea ejecutar este proceso."
                });

                return;
            };

            if (!$scope.filtro.periodo || !$scope.filtro.periodo.desde || !$scope.filtro.periodo.hasta) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar un período válido a este proceso."
                });

                return;
            };

            if (!lodash.isDate($scope.filtro.periodo.desde) || !lodash.isDate($scope.filtro.periodo.hasta)) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar un período válido a este proceso."
                });

                return;
            };

            if ($scope.filtro.periodo.desde > $scope.filtro.periodo.hasta) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "Ud. debe indicar un período válido a este proceso."
                });

                return;
            };

            if ($scope.filtro.periodo.desde.getDate() != 1) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: "La fecha inicial del período debe siempre corresponder a un 1ro. de mes."
                });

                return;
            };

            $scope.showProgress = true;

            // para medir y mostrar el progreso de la tarea ...
            $scope.processProgress.current = 0;
            $scope.processProgress.max = 0;
            $scope.processProgress.progress = 0;

            $meteor.call('codificacionesContables_consulta_prepararDatos',
                         $scope.filtro,
                         companiaSeleccionadaDoc).then(
                function (data) {

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: data
                    });

                    // ------------------------------------------------------------------------------------------------------
                    // guardamos el filtro indicado por el usuario

                    if (Filtros.findOne({ nombre: 'contab.consulta.codificacionesContables', userId: Meteor.userId() }))
                        // el filtro existía antes; lo actualizamos
                        // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                        Filtros.update(Filtros.findOne({ nombre: 'contab.consulta.codificacionesContables', userId: Meteor.userId() })._id,
                                       { $set: { filtro: $scope.filtro } },
                                       { validate: false });
                    else
                        Filtros.insert({
                            _id: new Mongo.ObjectID()._str,
                            userId: Meteor.userId(),
                            nombre: 'contab.consulta.codificacionesContables',
                            filtro: $scope.filtro
                        });
                    // ------------------------------------------------------------------------------------------------------

                    $scope.showProgress = false;
                },
                function (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                });
        };


        // -------------------------------------------------------------------------------------------------------
        // para recibir los eventos desde la tarea en el servidor ...
        EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'codificacionContable_prepararDatos' });
        EventDDP.addListener('contab_codificacionesContables_prepararDatos_reportProgress', function(process) {
            $scope.processProgress.current = process.current;
            $scope.processProgress.max = process.max;
            $scope.processProgress.progress = process.progress;
            $scope.processProgress.message = process.message ? process.message : null;
            // if we don't call this method, angular wont refresh the view each time the progress changes ...
            // until, of course, the above process ends ...
            $scope.$apply();
        });
        // -------------------------------------------------------------------------------------------------------

        $scope.filtro = {};

        // ------------------------------------------------------------------------------------------------------
        // si hay un filtro anterior, lo usamos
        // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
        $scope.filtro = {};
        var filtroAnterior = Filtros.findOne({ nombre: 'contab.consulta.codificacionesContables', userId: Meteor.userId() });

        // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
        if (filtroAnterior) {
            $scope.filtro = _.clone(filtroAnterior.filtro);
        };
        // ------------------------------------------------------------------------------------------------------

        $scope.helpers({
            monedas: () => {
              return Monedas.find();
            }
        });
}
]);
