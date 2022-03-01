
angular.module("contabm").controller('CuentasContablesYMovimientos_MostrarMovimientos_Modal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'uiGridConstants', 'movimientos', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, uiGridConstants, movimientos, ciaSeleccionada) {

    $scope.showProgress = false;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    let asientosContables_ui_grid_api = null;
    let movimientoContableSeleccionado = {};

    $scope.asientosContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            asientosContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                movimientoContableSeleccionado = {};

                if (row.isSelected) {
                    movimientoContableSeleccionado = row.entity;
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

    $scope.asientosContables_ui_grid.columnDefs = [
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'date'
        },
        {
            name: 'numeroAsiento',
            field: 'numeroAsiento',
            displayName: '#',
            width: '50',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'simboloMonedaOriginal',
            field: 'simboloMonedaOriginal',
            displayName: 'Mon orig',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: '140',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Ref',
            width: '60',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'asientoTipoCierreAnualFlag',
            field: 'asientoTipoCierreAnualFlag',
            displayName: 'ca',
            width: '45',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'debe',
            field: 'debe',
            displayName: 'Debe',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

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
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
    ];

    $scope.asientosContables_ui_grid.data = _.isArray(movimientos) ? movimientos : [];

    $scope.showProgress = false;
}
]);
