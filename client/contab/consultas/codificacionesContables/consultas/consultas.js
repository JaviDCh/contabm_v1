

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Contab_Consultas_CodificacionesContables_Consultas_Controller",
['$scope', '$meteor', '$modal', 'uiGridConstants', '$interval', function ($scope, $meteor, $modal, uiGridConstants, $interval) {

    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
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

    $scope.exportarExcel = function() {

        if (!codificacionSeleccionada || _.isEmpty(codificacionSeleccionada)) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe seleccionar una codificación contable antes de intentar exportar su contenido."
            });
            return;
        };

        let modalInstance = $modal.open({
            templateUrl: 'client/contab/consultas/codificacionesContables/consultas/exportarExcelModal.html',
            controller: 'ContabCodificacionesContablesConsultaExportarExcel_Controller',
            size: 'md',
            resolve: {
                codificacionContable: () => {
                    return codificacionSeleccionada;
                },
                ciaSeleccionada: () => {
                    return companiaSeleccionadaDoc;
                },
            },
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    };
    // ------------------------------------------------------------------------------------------------


    let codificaciones_ui_grid_api = null;

    let codificacionSeleccionada = {};
    $scope.codificacionSeleccionada = {};           // para mostrar la codificación seleccionada en html

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
              codificacionSeleccionada = {};
              $scope.codificacionSeleccionada = {};

              if (row.isSelected) {
                  $scope.showProgress = true;

                  codificacionSeleccionada = row.entity;
                  $scope.codificacionSeleccionada = row.entity;

                  // suscribimos a los movimientos para la codificación contable seleccionada ...
                  Meteor.subscribe('codificacionesContables_movimientos', codificacionSeleccionada, () => {
                      // debugger;
                      $scope.helpers({
                          codificacionesContables_movimientos: () => {
                            return CodificacionesContables_movimientos.find(
                                {
                                    codificacionContable_ID: codificacionSeleccionada._id,
                                    user: Meteor.userId(),
                                },
                                { sort: { simboloMoneda: 1, codigoContable: 1, cuentaContable: 1, fecha: 1 } });
                          }
                      });

                      $scope.codificacionContable_movimientos_ui_grid.data = [];
                      if (_.isArray($scope.codificacionesContables_movimientos)) {
                          $scope.codificacionContable_movimientos_ui_grid.data = $scope.codificacionesContables_movimientos;

                          $scope.alerts.length = 0;
                          $scope.alerts.push({
                              type: 'info',
                              msg: $scope.codificacionesContables_movimientos.length.toString() + " movimientos han sido seleccionados ..."
                          });
                      } else {
                          $scope.alerts.length = 0;
                          $scope.alerts.push({
                              type: 'info',
                              msg: "0 movimientos han sido seleccionados ..."
                          });
                      };


                      $scope.showProgress = false;
                      $scope.$apply();
                  });
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


    let codificacionContable_movimientos_ui_grid_api = null;
    let movimientoSeleccionado = {};

    $scope.codificacionContable_movimientos_ui_grid = {

        enableSorting: true,
        enableFiltering: true,
        showColumnFooter: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

          codificacionContable_movimientos = gridApi;

          // -----------------------------------------------------------------------------------------------------
          // cuando el ui-grid está en un bootstrap tab y tiene más columnas de las que se pueden ver,
          // al hacer horizontal scrolling los encabezados no se muestran sincronizados con las columnas;
          // lo que sigue es un 'workaround'
          // -----------------------------------------------------------------------------------------------------
          angularInterval = $interval( function() {
            codificacionContable_movimientos.core.handleWindowResize();
          }, 200);

          gridApi.selection.on.rowSelectionChanged($scope, function (row) {
              movimientoSeleccionado = {};

              if (row.isSelected) {
                  movimientoSeleccionado = row.entity;
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

    $scope.codificacionContable_movimientos_ui_grid.columnDefs = [
        {
            name: 'simboloMoneda',
            field: 'simboloMoneda',
            displayName: 'Mon',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'codigoContable',
            field: 'codigoContable',
            displayName: 'Código',
            width: 150,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nombreCodigoContable',
            field: 'nombreCodigoContable',
            displayName: 'Nombre código',
            width: 150,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'simboloMonedaOriginal',
            field: 'simboloMonedaOriginal',
            displayName: 'Mon orig',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },

        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nombreCuentaContable',
            field: 'nombreCuentaContable',
            displayName: 'Nombre cuenta',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'comprobante',
            field: 'comprobante',
            displayName: 'Compbte',
            width: 60,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Referencia',
            width: 80,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'saldoInicial',
            field: 'saldoInicial',
            displayName: 'Saldo inicial',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'debe',
            field: 'debe',
            displayName: 'Debe',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'haber',
            field: 'haber',
            displayName: 'Haber',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldo',
            field: 'saldo',
            displayName: 'Saldo',
            width: 120,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: false,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
    ];


    $scope.showProgress = true;
  //   debugger;
    Meteor.subscribe('codificacionesContables', companiaSeleccionadaDoc.numero, () => {
        // debugger;
        $scope.helpers({
            codificacionesContables: () => {
              return CodificacionesContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
            }
        });

        $scope.codificaciones_ui_grid.data = [];
        if (_.isArray($scope.codificacionesContables))
           $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

        // $scope.alerts.length = 0;
        // $scope.alerts.push({
        //     type: 'info',
        //     msg: $scope.codificacionesContables.length.toString() + " registros han sido seleccionados ..."
        // });

        $scope.showProgress = false;
        $scope.$apply();
    });

    $scope.codificacionContable_movimientos_ui_grid.data = [];
}
]);
