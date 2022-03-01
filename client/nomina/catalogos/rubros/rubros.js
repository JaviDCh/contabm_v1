

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Catalogos_Rubros_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    //   debugger;
      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.tiposRubro1Array = [
          { tipo: "A", descripcion: "Asignación" },
          { tipo: "D", descripcion: "Deducción" },
      ];

      $scope.tiposRubro2Array = [
          { tipo: 1, descripcion: "Sueldo" },
          { tipo: 2, descripcion: "Cuotas de préstamo" },
          { tipo: 3, descripcion: "Interéses s/préstamos otorgados" },
          { tipo: 4, descripcion: "Bono vacacional" },
          { tipo: 5, descripcion: "Sso" },
          { tipo: 6, descripcion: "Lph" },
          { tipo: 7, descripcion: "Pf" },
          { tipo: 8, descripcion: "Islr" },
          { tipo: 9, descripcion: "Utilidades" },
          { tipo: 10, descripcion: "Ince" },
      ];


      let rubros_ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.rubros_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableFiltering: true,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              rubros_ui_grid_api = gridApi;

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

      $scope.rubros_ui_grid.columnDefs = [
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
              name: 'nombreCortoRubro',
              field: 'nombreCortoRubro',
              displayName: 'ID',
              width: 100,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 250,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 120,
              enableFiltering: false,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.tiposRubro1Array:"tipo":"descripcion"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'tipo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.tiposRubro1Array,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'sueldoFlag',
              field: 'sueldoFlag',
              displayName: 'Sueldo?',
              width: 80,
              enableFiltering: false,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'salarioFlag',
              field: 'salarioFlag',
              displayName: 'Salario?',
              width: 80,
              enableFiltering: false,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'tipoRubro',
              field: 'tipoRubro',
              displayName: 'Tipo de rubro',
              width: 150,
              enableFiltering: false,
              cellFilter: 'mapDropdown:row.grid.appScope.tiposRubro2Array:"tipo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'tipo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.tiposRubro2Array,

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
              _.remove($scope.cuentasContables, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevo = function () {
          let item = {
              _id: new Mongo.ObjectID()._str,
              rubro: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
              sueldoFlag: false,
              salarioFlag: false,
              docState: 1
          };

          $scope.maestraRubros.push(item);

          $scope.rubros_ui_grid.data = [];
          if (_.isArray($scope.maestraRubros))
             $scope.rubros_ui_grid.data = $scope.maestraRubros;
      };

      let maestraRubrosSubscriptionHandle = null;

      $scope.save = function () {
           $scope.showProgress = true;

           // eliminamos los items eliminados; del $scope y del collection
           let editedItems = _.filter($scope.maestraRubros, function (item) { return item.docState; });

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores = [];

           editedItems.forEach((item) => {
               if (item.docState != 3) {
                   isValid = MaestraRubros.simpleSchema().namedContext().validate(item);

                   if (!isValid) {
                       MaestraRubros.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                           errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + MaestraRubros.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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

           $meteor.call('nomina.maestraRubrosSave', editedItems).then(
             function (data) {

                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'info',
                     msg: data
                 });

                 // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                 // se queda el '*' para registros nuevos en el ui-grid ...
                 $scope.maestraRubros = [];
                 $scope.rubros_ui_grid.data = [];

                 // NOTA: el publishing de este collection es 'automático'; muchos 'catálogos' se publican
                 // de forma automática para que estén siempre en el cliente ... sin embargo, para asegurarnos
                 // que la data está en el cliente y refrescar el ui-grid, suscribimos aquí a la tabla en
                 // mongo, pues de otra forma no sabríamos cuando la data está en el client
                 maestraRubrosSubscriptionHandle = Meteor.subscribe("maestraRubros", {
                     onReady: function () {

                         $scope.helpers({
                             maestraRubros: () => {
                               return MaestraRubros.find({}, { sort: { nombreCortoRubro: 1 } });
                             }
                         });

                         $scope.rubros_ui_grid.data = [];
                         $scope.rubros_ui_grid.data = $scope.maestraRubros;

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




      $scope.rubros_ui_grid.data = [];

      $scope.helpers({
          maestraRubros: () => {
            return MaestraRubros.find({}, { sort: { nombreCortoRubro: 1 } });
          }
      });

      $scope.rubros_ui_grid.data = $scope.maestraRubros;
}
]);
