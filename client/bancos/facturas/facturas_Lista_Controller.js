
import numeral from 'numeral'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_Facturas_List_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.origen = $stateParams.origen;
    let limit = parseInt($stateParams.limit);

    let companiaContab = $scope.$parent.companiaSeleccionada;

    $scope.nuevo = function () {
        $state.go('bancos.facturas.factura', {
            origen: $scope.origen,
            id: "0",
            limit: limit
        });
    }

    $scope.regresar = function () {
        $state.go('bancos.facturas.filter', { origen: $scope.origen });
    }


    $scope.exportarAMicrosoftWord = () => {
        $modal.open({
            templateUrl: 'client/bancos/facturas/exportarAMicrosoftWordModal.html',
            controller: 'FacturasExportarAMicrosoftWordModalController',
            size: 'lg',
            resolve: {
                tiposArchivo: () => {
                    return ['BANCOS-FACTURAS', 'BANCOS-RET-IMP-IVA', 'BANCOS-RET-IMP-ISLR'];  
                },
                aplicacion: () => {
                    return 'bancos';
                },
                ciaSeleccionada: function () {
                    return $scope.companiaSeleccionada;
                },
                factura: () => {
                    return $scope.facturas[0];                          // pasamos la 1ra. factura en la lista 
                },
                user: () => {
                    return Meteor.user().emails[0].address;              // nómina, bancos, contab, ...
                },
                facturasFiltro: () => {
                    let filtro = '';
                    $scope.facturas.forEach((f) => {
                        if (!filtro) {
                            filtro = `(${f.claveUnica.toString()}`;
                        } else {
                            filtro += `, ${f.claveUnica.toString()}`;
                        }
                    });

                    filtro += ')';

                    return filtro;
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


    let list_ui_grid_api = null;
    let itemSeleccionadoEnLaLista = {};

    $scope.list_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: true,
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
                itemSeleccionadoEnLaLista = {};

                if (row.isSelected) {
                    itemSeleccionadoEnLaLista = row.entity;

                    $state.go('bancos.facturas.factura', {
                        origen: $scope.origen,
                        id: itemSeleccionadoEnLaLista.claveUnica,
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
            name: 'numeroFactura',
            field: 'numeroFactura',
            displayName: 'Número',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'numeroControl',
            field: 'numeroControl',
            displayName: 'Control',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emisión',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fechaRecepcion',
            field: 'fechaRecepcion',
            displayName: 'F recepción',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'simboloMoneda',
            field: 'simboloMoneda',
            displayName: 'Mon',
            width: '40',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'nombreCompania',
            field: 'nombreCompania',
            displayName: 'Compañía',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'cxPCxC',
            field: 'cxPCxC',
            displayName: 'CxC/CxP',
            width: '75',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'ncNdFlag',
            field: 'ncNdFlag',
            displayName: 'NC',
            width: '40',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'nombreFormaPago',
            field: 'nombreFormaPago',
            displayName: 'Forma pago',
            width: '85',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'nombreTipoServicio',
            field: 'nombreTipoServicio',
            displayName: 'Tipo',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'numeroComprobanteSeniat',
            field: 'numeroComprobanteSeniat',
            displayName: 'Comprobante',
            width: '100',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'montoNoImponible',
            field: 'montoNoImponible',
            displayName: 'No imponible',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'montoImponible',
            field: 'montoImponible',
            displayName: 'Imponible',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'ivaPorc',
            field: 'ivaPorc',
            displayName: 'Iva%',
            width: '60',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'iva',
            field: 'iva',
            displayName: 'Iva',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'totalFactura',
            field: 'totalFactura',
            displayName: 'Total',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'retencionIslr',
            field: 'retencionIslr',
            displayName: 'Ret islr',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'retencionIva',
            field: 'retencionIva',
            displayName: 'Ret iva',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'anticipo',
            field: 'anticipo',
            displayName: 'Anticipo',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldo',
            field: 'saldo',
            displayName: 'Saldo',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: function (grid, row, col, rowIndex, colIndex) {
                    // con el row viene el entiy con el valor de cada celda
                    let estado = row.entity && row.entity.estadoFactura ? row.entity.estadoFactura : 0;
                    if (estado === "Pag") {
                        // 3: pagada
                        return 'ui-grid-rightCell blue';
                    } else if (estado === "Anul") {
                        // 4: anulada
                        return 'ui-grid-rightCell green';
                    } else {
                        // 1/2: pendiente/parcial
                        return 'ui-grid-rightCell red';
                    }
                },
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },

        {
            name: 'estadoFactura',
            field: 'estadoFactura',
            displayName: 'Estado',
            width: '75',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: function (grid, row, col, rowIndex, colIndex) {
                    // con el row viene el entiy con el valor de cada celda
                    let estado = row.entity && row.entity.estadoFactura ? row.entity.estadoFactura : 0;
                    if (estado === "Pag") {
                        // 3: pagada
                        return 'ui-grid-leftCell blue';
                    } else if (estado === "Anul") {
                        // 4: anulada
                        return 'ui-grid-leftCell green';
                    } else {
                        // 1/2: pendiente/parcial
                        return 'ui-grid-leftCell red';
                    }
                },
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
    ];


    $scope.facturas = []
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
        Meteor.subscribe('temp.bancos.consulta.facturas.list', limit, () => {

            $scope.facturas = Temp_Consulta_Bancos_Facturas.find({ user: Meteor.userId() },
                                                                 { sort: {
                                                                        fechaEmision: 1,
                                                                        numeroFactura: 1,
                                                                 }}).fetch();

            // calculamos el porcentaje del iva, pues no siempre está en la tabla Facturas;
            // siempre, por supuesto, está en la tabla Facturas_Impuestos, pero no leemos desde allí
            // pues resulta costoso y no es necesario para esta consulta ...
            $scope.facturas.forEach((f) => {
                if (f.iva && f.montoImponible && f.montoImponible != 0) {
                    f.ivaPorc = f.iva *  100 / f.montoImponible;
                };
            });

            $scope.list_ui_grid.data = $scope.facturas;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.facturas.length).format('0,0')} registros
                      (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
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

    Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_Facturas', (err, result) => {

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
