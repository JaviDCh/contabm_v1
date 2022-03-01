
import numeral from 'numeral'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_ConciliacionesBancarias_List_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.origen = $stateParams.origen;
    let limit = parseInt($stateParams.limit);

    let companiaContab = $scope.$parent.companiaSeleccionada;

    $scope.nuevo = function () {
        $state.go('bancos.conciliacionesBancarias.conciliacionBancaria', {
            origen: $scope.origen,
            id: "0",
            limit: limit
        });
    };

    $scope.regresar = function () {
        $state.go('bancos.conciliacionesBancarias.filter', { origen: $scope.origen });
    };


    let list_ui_grid_api = null;
    let itemSeleccionadoEnLaLista = {};

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
                //debugger;
                itemSeleccionado = {};

                if (row.isSelected) {
                    itemSeleccionadoEnLaLista = row.entity;

                    $state.go('bancos.conciliacionesBancarias.conciliacionBancaria', {
                        origen: $scope.origen,
                        id: itemSeleccionadoEnLaLista.conciliacionID,
                        limit: limit
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


    $scope.list_ui_grid.columnDefs = [
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
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
            name: 'hasta',
            field: 'hasta',
            displayName: 'Hasta',
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
            name: 'nombreBanco',
            field: 'nombreBanco',
            displayName: 'Banco',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'simboloMoneda',
            field: 'simboloMoneda',
            displayName: 'Moneda',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuentaBancaria',
            field: 'cuentaBancaria',
            displayName: 'Cuenta bancaria',
            width: '250',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'observaciones',
            field: 'observaciones',
            displayName: 'Observaciones',
            width: '250',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'nombreCia',
            field: 'nombreCia',
            displayName: 'Cia',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ];


    $scope.conciliacionesBancarias = []
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
        };

        subscriptionHandle =
        Meteor.subscribe('temp.bancos.consulta.conciliacionesBancarias.list', limit, () => {

            $scope.conciliacionesBancarias = Temp_Bancos_ConciliacionesBancarias_Lista.find({ user: Meteor.userId() },
                                                                                            { sort: {
                                                                                                desde: 1,
                                                                                                cuentaBancaria: 1,
                                                                                            }}).fetch();

            $scope.list_ui_grid.data = $scope.conciliacionesBancarias;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.conciliacionesBancarias.length).format('0,0')} registros
                      (de ${numeral(recordCount).format('0,0')})
                      han sido seleccionados ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        });
    };


    // al abrir la página, mostramos los primeros 50 items
    // inicialmente, el limit siempre viene en 50; cuando seleccionamos un item de la lista, mantenemos
    // el limit ...
    // let limit = 50;
    let recordCount = 0;

    Meteor.call('getCollectionCount', 'Temp_Bancos_ConciliacionesBancarias_Lista', (err, result) => {

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
        };

        // el método regresa la cantidad de items en el collection (siempre para el usuario)
        recordCount = result;
        $scope.leerRegistrosDesdeServer(limit);
    });


    $scope.leerMasRegistros = () => {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    };

    $scope.leerTodosLosRegistros = () => {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    };



    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...

    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        };
    });
  }
]);
