


import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { MesesDelAnoFiscal } from '/imports/collections/contab/mesesAnoFiscal'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_MesesDelAnoFiscal_Controller",
['$scope', '$meteor', '$modal', 'uiGridConstants', '$reactive',
 function ($scope, $meteor, $modal, uiGridConstants, $reactive) {

    //   debugger;
      $scope.showProgress = true;

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

      let mesesDelAnoFiscal_ui_grid_api = null;

      $scope.mesesDelAnoFiscal_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableFiltering: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {
              mesesDelAnoFiscal_ui_grid_api = gridApi;
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },
          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.mesesDelAnoFiscal_ui_grid.columnDefs = [
          {
              name: 'mesFiscal',
              field: 'mesFiscal',
              displayName: 'Mes fiscal',
              width: 90,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'mesCalendario',
              field: 'mesCalendario',
              displayName: 'Mes',
              width: 90,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'nombreMes',
              field: 'nombreMes',
              displayName: 'Descripción',
              width: 150,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'ano',
              field: 'ano',
              displayName: 'Año',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mesesAnoFiscal_ano',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia contab',
              cellFilter: 'companiaAbreviaturaFilter',
              width: 100,
              enableFiltering: false,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
      ];

      $scope.helpers({
          mesesDelAnoFiscal: () => {
            return MesesDelAnoFiscal.find({ cia: companiaSeleccionadaDoc && companiaSeleccionadaDoc.numero ? companiaSeleccionadaDoc.numero : -99},
                                         { sort: { mesFiscal: 1 } });
          }
      });

      $scope.mesesDelAnoFiscal_ui_grid.data = $scope.mesesDelAnoFiscal;

      $scope.alerts.length = 0;
      $scope.alerts.push({
          type: 'info',
          msg: `${$scope.mesesDelAnoFiscal.length.toString()} registros leídos para la <em>compañía Contab</em> seleccionada ...`
      });

      $scope.showProgress = false;
}
]);
