


import * as lodash from 'lodash';
import * as angular from 'angular';

import { CuentasContables2 } from '../../../../imports/collections/contab/cuentasContables2';  

angular.module("contabm").controller('BuscarCuentasContables_Modal_Controller',
['$scope', '$modalInstance', 'companiaContabSeleccionada', 'partidaSeleccionada', 
function ($scope, $modalInstance, companiaContabSeleccionada, partidaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.showProgress = true;

    $scope.ok = function () {
        $modalInstance.close({
            cuentaContableID: itemSeleccionado.id,
        })
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    let cuentasContables = CuentasContables2.find({ totDet: 'D', actSusp: 'A', cia: companiaContabSeleccionada.numero, }, 
                                                  { fields: { _id: 1, id: 1, cuenta: 1, descripcion: 1, }, 
                                                    sort: { cuenta: 1, }}).
                                             fetch(); 


    let cuentasContables_ui_grid_api = null;
    let itemSeleccionado: any = {};

    $scope.cuentasContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cuentasContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    // el usuario seleccionó una cuenta; la asignamos a la partida seleccionada y cerramos el modal ... 
                    itemSeleccionado = row.entity;
                    $scope.ok(); 
                }
                else { 
                    return;
                } 
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    $scope.cuentasContables_ui_grid.columnDefs = [
        {
            name: 'cuenta',
            field: 'cuenta',
            displayName: 'Cuenta',
            width: 200,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 300,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ]


    $scope.cuentasContables_ui_grid.data = cuentasContables; 


    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: `Haga un <em>click</em> sobre alguna cuenta contable para seleccionarla ... `
    });

    $scope.showProgress = false;

}
])