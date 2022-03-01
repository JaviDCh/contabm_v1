
angular.module("contabm").controller('MostrarCuotasFactura_Modal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'companiaContabSeleccionada', 'factura',
function ($scope, $modalInstance, $modal, $meteor, companiaContabSeleccionada, factura) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Okey");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.companiaContabSeleccionada = companiaContabSeleccionada;




    let cuotasFactura_ui_grid_api = null;
    let cuotaFacturaSeleccionada = {};

    $scope.cuotasFactura_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableFiltering: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cuotasFactura_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                cuotaFacturaSeleccionada = null;
                if (row.isSelected) {
                    cuotaFacturaSeleccionada = row.entity;
                }
                else {
                    return;
                };
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        // nótese que usamos 'id', y no '_id', pues estos registros vienen de sql con un id único
        // (y nosotros no agregamos un _id mongo) ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.cuotasFactura_ui_grid.columnDefs = [
        {
            name: 'numeroCuota',
            field: 'numeroCuota',
            displayName: '#',
            width: 40,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'diasVencimiento',
            field: 'diasVencimiento',
            displayName: 'Días venc',
            width: 80,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaVencimiento',
            field: 'fechaVencimiento',
            displayName: 'F venc',
            width: 80,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'proporcionCuota',
            field: 'proporcionCuota',
            displayName: '%',
            width: 60,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'montoCuota',
            field: 'montoCuota',
            displayName: 'Monto',
            width: 120,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'iva',
            field: 'iva',
            displayName: 'Iva',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'retencionSobreIva',
            field: 'retencionSobreIva',
            displayName: 'Ret iva',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'retencionSobreIslr',
            field: 'retencionSobreIslr',
            displayName: 'Ret islr',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'otrosImpuestos',
            field: 'otrosImpuestos',
            displayName: 'Otros imp',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'otrasRetenciones',
            field: 'otrasRetenciones',
            displayName: 'Otras ret',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'totalCuota',
            field: 'totalCuota',
            displayName: 'Total',
            width: 120,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'anticipo',
            field: 'anticipo',
            displayName: 'Anticipo',
            width: 120,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'saldoCuota',
            field: 'saldoCuota',
            displayName: 'Saldo',
            width: 120,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull4decimals',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'estadoCuota',
            field: 'estadoCuota',
            displayName: 'Estado',
            width: 80,
            enableFiltering: false,
            cellFilter: 'nombreEstadoFactura',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
    ];

    $scope.cuotasFactura_ui_grid.data = factura.cuotasFactura;
}
]);
