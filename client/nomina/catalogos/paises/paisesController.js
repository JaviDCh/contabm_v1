

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Catalogos_Nomina_paises_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    //   debugger;
      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let paisSeleccionado = {};

      $scope.paises_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,

          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            //   // marcamos el contrato como actualizado cuando el usuario edita un valor
            //   gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
            //       if (newValue != oldValue)
            //           if (!rowEntity.docState)
            //               rowEntity.docState = 2;
            //   });

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                paisSeleccionado = {};

                if (row.isSelected) {
                    paisSeleccionado = row.entity;

                    $scope.ciudades_ui_grid.data = [];
                    $scope.ciudades_ui_grid.data = lodash($scope.ciudades).
                                                   filter((x) => { return x.pais === paisSeleccionado.pais; }).
                                                   orderBy(['descripcion'], ['asc']).
                                                   value();
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


      $scope.paises_ui_grid.columnDefs = [
          {
              name: 'pais',
              field: 'pais',
              displayName: 'País',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Nombre',
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];











      $scope.ciudades_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            //   // marcamos el contrato como actualizado cuando el usuario edita un valor
            //   gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
            //       if (newValue != oldValue)
            //           if (!rowEntity.docState)
            //               rowEntity.docState = 2;
            //   });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.ciudades_ui_grid.columnDefs = [
          {
              name: 'ciudad',
              field: 'ciudad',
              displayName: 'Ciudad',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'pais',
              field: 'pais',
              displayName: 'País',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Nombre',
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
      ];


      $scope.helpers({
            paises: () => {
                return Paises.find({}, { sort: { descripcion: 1 } });
            },

            ciudades: () => {
                return Ciudades.find({}, { sort: { descripcion: 1 } });
            },
      });

      $scope.paises_ui_grid.data = $scope.paises;
    //   $scope.ciudades_ui_grid.data = $scope.ciudades;
}
]);
