
import numeral from 'numeral';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Bancos_MovimientosBancarios_List_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.origen = $stateParams.origen;
    let limit = parseInt($stateParams.limit);

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    // ------------------------------------------------------------------------------------------------

    $scope.nuevo = function () {
        $state.go('bancos.movimientosBancarios.movimientoBancario', {
            origen: $scope.origen,
            id: "0",
            limit: limit,
            vieneDeAfuera: false
        })
    }

    $scope.regresar = function () {
        $state.go('bancos.movimientosBancarios.filter', { origen: $scope.origen });
    }


    let list_ui_grid_api = null;
    let movimientoBancarioSeleccionado = {};

    $scope.list_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableFiltering: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            list_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                movimientoBancarioSeleccionado = {};

                if (row.isSelected) {
                    movimientoBancarioSeleccionado = row.entity;

                    $state.go('bancos.movimientosBancarios.movimientoBancario', {
                        origen: $scope.origen,
                        id: movimientoBancarioSeleccionado.claveUnica.toString(),
                        limit: limit,
                        vieneDeAfuera: false
                    });

                    $scope.showProgress = false;
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


    $scope.list_ui_grid.columnDefs = [
        {
            name: 'transaccion',
            field: 'transaccion',
            displayName: '#',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '60',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
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
            name: 'banco',
            field: 'banco',
            displayName: 'Banco',
            width: '50',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuentaBancaria',
            field: 'cuentaBancaria',
            displayName: 'Cuenta',
            width: '150',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: '50',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'beneficiario',
            field: 'beneficiario',
            displayName: 'Beneficiario',
            width: '140',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: '140',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'fechaEntregado',
            field: 'fechaEntregado',
            displayName: 'Entregado',
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
            name: 'usuario',
            field: 'usuario',
            displayName: 'Usuario',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ]


    $scope.movimientosBancarios = []
    $scope.list_ui_grid.data = [];
    $scope.showProgress = true;
    let subscriptionHandle = null;


    $scope.leerRegistrosDesdeServer = (limit) => {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        subscriptionHandle =
        Meteor.subscribe('temp.Bancos.Consulta.movimientosBancarios', limit, () => {

            $scope.movimientosBancarios = Temp_Consulta_Bancos_MovimientosBancarios.find({ user: Meteor.userId() },
                                                                                         { sort: {
                                                                                             fecha: 1,
                                                                                             transaccion: 1,
                                                                                         }}).fetch();

            $scope.list_ui_grid.data = $scope.movimientosBancarios;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.movimientosBancarios.length).format('0,0')} registros
                      (de ${numeral(recordCount).format('0,0')})
                      han sido seleccionados ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    // al abrir la página, mostramos los primeros 50 items
    // inicialmente, el limit siempre viene en 50; cuando seleccionamos un item de la lista, mantenemos
    // el limit ...
    // let limit = 50;
    let recordCount = 0;

    Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_MovimientosBancarios', (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
            return;
        }

        // el método regresa la cantidad de items en el collection (siempre para el usuario)
        recordCount = result;
        $scope.leerRegistrosDesdeServer(limit);
    })


    $scope.leerMasRegistros = () => {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = () => {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }


    $scope.exportarExcel = function() {

        let modalInstance = $modal.open({
            templateUrl: 'client/bancos/movimientosBancarios/exportarExcelModal.html',
            controller: 'BancosMovimientosBancariosExportarExcel_Controller',
            size: 'md',
            resolve: {
                ciaSeleccionada: () => {
                    return companiaContab;
                },
            },
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }
    // ------------------------------------------------------------------------------------------------

    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...

    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
  }
])
