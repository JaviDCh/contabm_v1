

import lodash from 'lodash';

angular.module("contabm.bancos.catalogos").controller('BancosProveedores_MostrarPersonas_Controller',
['$scope', '$modalInstance', '$modal', 'proveedor', 'cargos', 'departamentos', 'titulos',
function ($scope, $modalInstance, $modal, proveedor, cargos, departamentos, titulos) {

    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close($scope.parametros);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.proveedor = proveedor;
    $scope.cargos = cargos;
    $scope.departamentos = departamentos;
    $scope.titulos = titulos;

    let personas_ui_grid_api = null;
    let personaSeleccionada = {};

    $scope.personas_ui_grid = {

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

            personas_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                personaSeleccionada = {};

                if (row.isSelected) {
                    personaSeleccionada = row.entity;
                }
                else
                    return;
            });

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState)
                        rowEntity.docState = 2;

                    if (!$scope.proveedor.docState)
                        $scope.proveedor.docState = 2;
                };
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row.persona;
        },
        getRowIdentity: function (row) {
            return row.persona;
        }
    };


    // cargo: { type: Sequelize.INTEGER, field: 'Cargo', allowNull: false, },
    // departamento: { type: Sequelize.INTEGER, field: 'Departamento', allowNull: true },
    // atributo: { type: Sequelize.INTEGER, field: 'Atributo', allowNull: true },

    $scope.personas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'titulo',
            field: 'titulo',
            displayName: 'Título',
            width: 50,
            enableFiltering: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'titulo',
            editDropdownValueLabel: 'titulo',
            editDropdownOptionsArray: $scope.titulos,
            cellFilter: 'mapDropdown:row.grid.appScope.titulos:"titulo":"titulo"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Nombre',
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
            name: 'apellido',
            field: 'apellido',
            displayName: 'Apellido',
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
            name: 'cargo',
            field: 'cargo',
            displayName: 'Cargo',
            width: 100,
            enableFiltering: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'cargo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.cargos,
            cellFilter: 'mapDropdown:row.grid.appScope.cargos:"cargo":"descripcion"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'departamento',
            field: 'departamento',
            displayName: 'Departamento',
            width: 100,
            enableFiltering: false,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'departamento',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.departamentos,
            cellFilter: 'mapDropdown:row.grid.appScope.departamentos:"departamento":"descripcion"',

            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'rif',
            field: 'rif',
            displayName: 'Rif',
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
            name: 'sueldo',
            field: 'diaCumpleAnos',
            displayName: 'Dia cumple',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'mesCumpleAnos',
            field: 'mesCumpleAnos',
            displayName: 'Mes cumple',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'telefono',
            field: 'telefono',
            displayName: 'Teléfono',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'fax',
            field: 'fax',
            displayName: 'Fax',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'celular',
            field: 'celular',
            displayName: 'Celular',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'email',
            field: 'email',
            displayName: 'Email',
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
            name: 'notas',
            field: 'notas',
            displayName: 'Notas',
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
            name: 'defaultFlag',
            field: 'defaultFlag',
            displayName: 'Default?',
            width: 60,
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
            _.remove($scope.proveedor.personas, (x) => { return x.persona === item.persona; });
        else
            item.docState = 3;

        if (!$scope.proveedor.docState)
            $scope.proveedor.docState = 2;
    };

    $scope.agregarPersona = function () {

        if (!lodash.isArray($scope.proveedor.personas))
            $scope.proveedor.personas = [];

        // aunque asignamos un consecutivo a registros nuevos, sql server asignará siempre el identity que
        // corresponda (al hacer Insert para el registro)
        let nextID = lodash.maxBy($scope.proveedor.personas, 'persona');
        let usuario =  Meteor.user();

        let persona = {
            persona: nextID && nextID.persona ? nextID.persona + 1 : 1,
            compania: $scope.proveedor.proveedor,
            ingreso: new Date(),
            ultAct: new Date(),
            usuario: usuario ? usuario.emails[0].address : null,
            docState: 1,
        };

        $scope.proveedor.personas.push(persona);

        if (!$scope.proveedor.docState) {
            $scope.proveedor.docState = 2;
        }

        $scope.personas_ui_grid.data = $scope.proveedor.personas;
    };


    $scope.personas_ui_grid.data = [];
    if (lodash.isArray($scope.proveedor.personas))
       $scope.personas_ui_grid.data = $scope.proveedor.personas;
}
]);
