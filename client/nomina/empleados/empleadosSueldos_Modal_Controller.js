
import lodash from 'lodash';

angular.module("contabm").controller('empleadosSueldos_Modal_Controller',
['$scope', '$modalInstance', '$modal', 'empleado', 'companiaSeleccionadaDoc', 'origen',
function ($scope, $modalInstance, $modal, empleado, companiaSeleccionadaDoc, origen) {

    // debugger;
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionadaDoc = companiaSeleccionadaDoc;

    $scope.ok = function () {
        $modalInstance.close($scope.parametros);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.empleado = empleado;
    $scope.origen = origen;

    let sueldos_ui_grid_api = null;
    let sueldoSeleccionado = {};

    $scope.sueldos_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        minRowsToShow: 5,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            sueldos_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                sueldoSeleccionado = {};

                if (row.isSelected) {
                    sueldoSeleccionado = row.entity;
                }
                else
                    return;
            });

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;

                    if (!$scope.empleado.docState)
                        $scope.empleado.docState = 2;
                };
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row.id;
        },
        getRowIdentity: function (row) {
            return row.id;
        }
    };


    $scope.sueldos_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'sueldo',
            field: 'sueldo',
            displayName: 'Sueldo',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ];


    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1)
            // si el item es nuevo, simplemente lo eliminamos del array
            _.remove($scope.empleado.sueldos, (x) => { return x.id === item.id; });
        else
            item.docState = 3;

        if (!$scope.empleado.docState)
            $scope.empleado.docState = 2;
    };

    $scope.agregarSueldo = function () {

        if (!_.isArray($scope.empleado.sueldos))
            $scope.empleado.sueldos = [];

        // aunque asignamos un consecutivo a registros nuevos, sql server asignará siempre el identity que
        // corresponda (al hacer Insert para el registro)

        let nextID = lodash.maxBy($scope.empleado.sueldos, 'id');

        let sueldo = {
            id: nextID && nextID.id ? nextID.id + 1 : 1,
            desde: new Date(),
            empleadoID: $scope.empleado.empleado,
            docState: 1
        };

        $scope.empleado.sueldos.push(sueldo);

        if (!$scope.empleado.docState)
            $scope.empleado.docState = 2;
    };


    $scope.sueldos_ui_grid.data = [];
    if (_.isArray($scope.empleado.sueldos))
       $scope.sueldos_ui_grid.data = $scope.empleado.sueldos;
}
]);
