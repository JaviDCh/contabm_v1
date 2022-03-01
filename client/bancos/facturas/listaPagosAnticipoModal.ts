

import * as angular from 'angular'; 
import * as lodash from 'lodash';

angular.module("contabm").controller('ListaPagosAnticipoModal_Controller',
['$scope', '$modalInstance', 'pagosAnticipoArray', 'ciaSeleccionada', 
function ($scope, $modalInstance, pagosAnticipoArray, ciaSeleccionada) {

    $scope.alerts = [];

    $scope.closeAlert = function (index: any) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    let itemsSeleccionadosEnLaLista = [];

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss(itemsSeleccionadosEnLaLista);
    }

    $scope.showProgress = true;

    let list_ui_grid_api = null;

    $scope.list_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableFiltering: false,
        enableRowHeaderSelection: false,
        multiSelect: true,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            list_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row: any) {

                if (row.isSelected) {
                    // el item no existía en la lista y fue seleccionado; lo agregamos 
                    itemsSeleccionadosEnLaLista.push(row.entity as never); 
                }
                else { 
                    // el item existía en la lista y fue deseleccionado 
                    lodash.remove(itemsSeleccionadosEnLaLista, (x: any) => x._id === row.entity._id); 
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row: any) {
            return row._id;
        },
        getRowIdentity: function (row: any) {
            return row._id;
        }
    };


    $scope.list_ui_grid.columnDefs = [
        {
            name: 'numeroPago',
            field: 'numeroPago',
            displayName: 'Número',
            width: '100',
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: '350',
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
    ];

    $scope.list_ui_grid.data = pagosAnticipoArray;

    let message = `Hemos leído <b>${pagosAnticipoArray.length.toString()}</b> pagos de anticipo registrados para esta compañía. 
                   Estos son pagos <em>sin facturas asociadas</em>.<br />
                   Si Ud. selecciona un pago en la lista, el monto de anticipo en la factura será actualizado con su monto.<br /><br />
                   <b>Nota importante:</b> si algún pago de anticipo aplica a esta factura, Ud. deberá <b>después</b> abrir el pago y 
                   asociar la factura que está ahora registrando. De esa forma, disminuirá el monto del pago del saldo pendiente de la 
                   factura.
                  `
    message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: message, 
    });

    $scope.showProgress = false; 
}]);
