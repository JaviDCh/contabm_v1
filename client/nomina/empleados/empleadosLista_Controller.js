
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Nomina_EmpleadosList_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    //debugger;

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;
    var pageNumber = $stateParams.pageNumber;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    // ------------------------------------------------------------------------------------------------

    $scope.regresarALista = function () {
        $state.go("nomina.empleados.filter", { origen: $scope.origen });
    };


    $scope.nuevo = function () {
        $state.go('nomina.empleados.empleado', {
            origen: $scope.origen,
            id: "0",
            pageNumber: 0,                          // nota: por ahora no vamos a paginar; tal vez luego, cuando esto funcione bien ...
            vieneDeAfuera: false
        });
    };

    $scope.abrirPaginaDetalles = function (siniestroID) {
        // vamos al state específico, dependiendo de si estamos consultando/editando
        //debugger;
        $state.go('contab.asientosContables.asientoContable', {
            origen: $scope.origen,
            id: data.asientoContableMongoID,        // TODO: asociar el id del asiento contable seleccionado en la lista
            pageNumber: 0,                          // nota: por ahora no vamos a paginar; tal vez luego, cuando esto funcione bien ...
            vieneDeAfuera: false
        });
    };

    $scope.regresar = function () {
        $state.go('nomina.empleados.filter', { origen: $scope.origen });
    };


    let empleados_ui_grid_api = null;
    let empleadoSeleccionado = {};

    $scope.empleados_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            empleados_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                empleadoSeleccionado = {};

                if (row.isSelected) {
                    empleadoSeleccionado = row.entity;

                    $state.go('nomina.empleados.empleado', {
                        origen: $scope.origen,
                        id: empleadoSeleccionado.empleado.toString(),
                        pageNumber: 0,
                        vieneDeAfuera: false
                    });

                    $scope.showProgress = false;
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


    $scope.empleados_ui_grid.columnDefs = [
        {
            name: 'empleado',
            field: 'empleado',
            displayName: '#',
            width: '60',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'nombre',
            field: 'nombre',
            displayName: 'Nombre',
            width: '150',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cedula',
            field: 'cedula',
            displayName: 'Cédula',
            width: '70',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'fechaIngreso',
            field: 'fechaIngreso',
            displayName: 'F ingreso',
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
            name: 'fechaRetiro',
            field: 'fechaRetiro',
            displayName: 'F retiro',
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
            name: 'departamento',
            field: 'departamento',
            displayName: 'Departamento',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cargo',
            field: 'cargo',
            displayName: 'Cargo',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'status',
            field: 'status',
            displayName: 'Estado',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'situacionActual',
            field: 'situacionActual',
            displayName: 'Situación actual',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'tipoNomina',
            field: 'tipoNomina',
            displayName: 'Tipo de nómina',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'email',
            field: 'email',
            displayName: 'e-mail',
            width: '110',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ];


    $scope.empleados = []
    $scope.empleados_ui_grid.data = [];
    $scope.showProgress = true;

    // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
    // debugger;
    Meteor.subscribe('tempConsulta_empleados', () => {

        $scope.empleados = Temp_Consulta_Empleados.find({ user: Meteor.userId() }, { sort: { nombre: true }}).fetch();

        $scope.empleados_ui_grid.data = $scope.empleados;

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: $scope.empleados.length.toString() + " registros han sido seleccionados ..."
        });

        $scope.showProgress = false;
        $scope.$apply();
    });

  }
]);
