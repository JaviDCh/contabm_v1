

import { GruposContables } from '/imports/collections/contab/gruposContables'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_GruposContables_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.gruposContables_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  itemSeleccionado = {};
                  if (row.isSelected) {
                      itemSeleccionado = row.entity;
                  }
                  else
                      return;
              });

              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue) {
                      if (!rowEntity.docState) {
                          rowEntity.docState = 2;
                      };
                  };
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


      $scope.gruposContables_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'grupo',
              field: 'grupo',
              displayName: 'Grupo',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 150,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'ordenBalanceGeneral',
              field: 'ordenBalanceGeneral',
              displayName: 'Orden bal gen',
              width: 100,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];

      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.gruposContables, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevo = function () {
          let item = {
              _id: new Mongo.ObjectID()._str,
              docState: 1
          };

          $scope.gruposContables.push(item);

          $scope.gruposContables_ui_grid.data = [];
          if (_.isArray($scope.gruposContables))
             $scope.gruposContables_ui_grid.data = $scope.gruposContables;
      };

      $scope.showProgress = true;
      let gruposContablesSubscriptioHandle = null;

      gruposContablesSubscriptioHandle = Meteor.subscribe("gruposContables", {
          onReady: function () {
                      $scope.showProgress = false;
                      $scope.$apply();
                  },
        });

     $scope.save = function () {
        //   debugger;
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          let editedItems = _.filter($scope.gruposContables, function (item) { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar (en el servidor)
          let isValid = false;
          let errores = [];

          editedItems.forEach((item) => {
              if (item.docState != 3) {
                  isValid = GruposContables.simpleSchema().namedContext().validate(item);

                  if (!isValid) {
                      GruposContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + GruposContables.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                      });
                  }
              }
          });

          if (errores && errores.length) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                      errores.reduce(function (previous, current) {

                          if (previous == "")
                              // first value
                              return current;
                          else
                              return previous + "<br />" + current;
                      }, "")
              });

              $scope.showProgress = false;
              return;
          };


          // eliminamos la conexión entre angular y meteor
          // $scope.asegurados.stop();
          // $scope.asegurados.length = 0;

          $meteor.call('contab.gruposContablesSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                // se queda el '*' para registros nuevos en el ui-grid ...
                $scope.gruposContables = [];
                $scope.gruposContables_ui_grid.data = [];

                // NOTA: el publishing de este collection es 'automático'; muchos 'catálogos' se publican
                // de forma automática para que estén siempre en el cliente ...

                gruposContablesSubscriptioHandle = Meteor.subscribe("gruposContables", {
                    onReady: function () {

                        $scope.helpers({
                            gruposContables: () => {
                              return GruposContables.find({}, { sort: { grupo: 1 } });
                            }
                        });

                        $scope.gruposContables_ui_grid.data = [];
                        $scope.gruposContables_ui_grid.data = $scope.gruposContables;

                        $scope.showProgress = false;
                        $scope.$apply();
                    },
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
        };

      $scope.helpers({
          gruposContables: () => {
            return GruposContables.find({}, { sort: { grupo: 1 } });
          }
      });

      $scope.gruposContables_ui_grid.data = $scope.gruposContables;

      // detenemos los publishers cuando el usuario deja la página
      $scope.$on("$destroy", () => {
          if (gruposContablesSubscriptioHandle && gruposContablesSubscriptioHandle.stop) {
              gruposContablesSubscriptioHandle.stop();
          };
      });
}
]);
