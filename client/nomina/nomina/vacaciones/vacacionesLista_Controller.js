
import numeral from 'numeral'; 

angular.module("contabm").controller("Nomina_VacacionesList_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    // debugger;
    $scope.showProgress = true;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;
    var pageNumber = $stateParams.pageNumber;

    let companiaContab = $scope.$parent.companiaSeleccionada;

    $scope.nuevo = function () {
        $state.go('nomina.vacaciones.vacacion', {
            origen: $scope.origen,
            id: "0",
            pageNumber: 0,                          // nota: por ahora no vamos a paginar; tal vez luego, cuando esto funcione bien ...
            vieneDeAfuera: false
        });
    };

    function abrirPaginaDetalles(id) {
        // vamos al state específico, dependiendo de si estamos consultando/editando
        //debugger;
        $state.go('nomina.vacaciones.vacacion', {
            origen: $scope.origen,
            id: id,
            pageNumber: 0,
            vieneDeAfuera: false
        });
    };

    $scope.regresar = function () {
        $state.go('nomina.vacaciones.filter', { origen: $scope.origen });
    };


    let vacaciones_ui_grid_api = null;
    let vacacionSeleccionada = {};

    $scope.vacaciones_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            vacaciones_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                vacacionSeleccionada = {};

                if (row.isSelected) {
                    vacacionSeleccionada = row.entity;
                    abrirPaginaDetalles(vacacionSeleccionada.vacacionID);
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


    $scope.vacaciones_ui_grid.columnDefs = [
        {
            name: 'nombreEmpleado',
            field: 'nombreEmpleado',
            displayName: 'Empleado',
            width: '150',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaIngreso',
            field: 'fechaIngreso',
            displayName: 'Ingreso',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'nombreGrupoNomina',
            field: 'nombreGrupoNomina',
            displayName: 'Grupo de nómina',
            width: '150',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'salida',
            field: 'salida',
            displayName: 'Salida',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'regreso',
            field: 'regreso',
            displayName: 'Regreso',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'fechaReintegro',
            field: 'fechaReintegro',
            displayName: 'Reintegro',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'montoBono',
            field: 'montoBono',
            displayName: 'Monto del bono',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaNomina',
            field: 'fechaNomina',
            displayName: 'F nómina',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'cantDiasPago_Total',
            field: 'cantDiasPago_Total',
            displayName: 'Cant días pago',
            width: '110',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'anoVacaciones',
            field: 'anoVacaciones',
            displayName: 'Año',
            width: '70',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'numeroVacaciones',
            field: 'numeroVacaciones',
            displayName: 'Número',
            width: '70',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
    ];

    $scope.subscribe("vacacionesLista", () => [],
    {
          onReady: function() {

            // debugger;
            $scope.helpers({
                tempVacacionesLista: () => {
                    return Temp_Consulta_Vacaciones_Lista.find(
                        { user: Meteor.userId() },
                        { sort: { nombreEmpleado: true, salida: true }}
                    );
                },
            });

            $scope.vacaciones_ui_grid.data = [];
            $scope.vacaciones_ui_grid.data = $scope.tempVacacionesLista;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: numeral($scope.tempVacacionesLista.length).format('0,0') + " registros han sido seleccionados ..."
            });

            $scope.showProgress = false;
            $scope.$apply();
          }
    });

  }
]);
