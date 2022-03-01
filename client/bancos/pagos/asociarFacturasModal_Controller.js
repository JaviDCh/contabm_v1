
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('AsociarFacturasModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'uiGridConstants', 'companiaContabSeleccionada', 'pago',
function ($scope, $modalInstance, $modal, $meteor, uiGridConstants, companiaContabSeleccionada, pago) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Okey");
    };

    $scope.cancel = function (cancel) {
        $modalInstance.dismiss(cancel);
    };

    $scope.companiaContabSeleccionada = companiaContabSeleccionada;

    let facturas_ui_grid_api = null;
    let facturaSeleccionada = {};

    $scope.facturas_ui_grid = {

        enableSorting: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,

        showGridFooter: true,

        showColumnFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: true,
        multiSelect: true,
        enableSelectAll: false,
        selectionRowHeaderWidth: 30,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            facturas_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                facturaSeleccionada = null;
                if (row.isSelected) {
                    facturaSeleccionada = row.entity;

                    // algunas veces el pago viene con un monto; casi siempre cuando es un pago de anticipo. 
                    // cuando no lo es, normalmente el usuario deja el monto en blanco para que se actualice con 
                    // el monto de las facturas pagadas 

                    // si el pago viene con un monto, intentamos usarlo 

                    if (pago.monto && pago.monto <= facturaSeleccionada.saldoCuota) { 
                        // el monto pagado con la factura no debe exceder su propio monto 
                        facturaSeleccionada.montoAPagar = pago.monto;
                    } else { 
                        // la factura tiene un monto mayor al del pago; tomamos el monto del pago como monto a pagar 
                        // normalmente, ésto ocurre con pagos de anticipo 
                        facturaSeleccionada.montoAPagar = facturaSeleccionada.saldoCuota;
                    }
                    
                    facturas_ui_grid_api.core.refresh();
                }
                else {
                    row.entity.montoAPagar = 0;
                    facturas_ui_grid_api.core.refresh();
                }
            })
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
    }

    $scope.facturas_ui_grid.columnDefs = [
        {
            name: 'numeroFactura',
            field: 'numeroFactura',
            displayName: 'Factura',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ncNdFlag',
            field: 'ncNdFlag',
            displayName: 'Nc/Nd',
            width: 50,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'fechaEmision',
            field: 'fechaEmision',
            displayName: 'F emis',
            width: 80,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'fechaRecepcion',
            field: 'fechaRecepcion',
            displayName: 'F recep',
            width: 80,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
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
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'numeroCuota',
            field: 'numeroCuota',
            displayName: '#',
            width: 30,
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'montoCuota',
            field: 'montoCuota',
            displayName: 'Monto',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
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
            cellFilter: 'currencyFilter',
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
            cellFilter: 'currencyFilter',
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
            cellFilter: 'currencyFilter',
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
            cellFilter: 'currencyFilter',
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
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'anticipo',
            field: 'anticipo',
            displayName: 'Anticipo',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'totalCuota',
            field: 'totalCuota',
            displayName: 'Total',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'montoPagadoAntes',
            field: 'montoPagadoAntes',
            displayName: 'Pagado antes',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldoCuota',
            field: 'saldoCuota',
            displayName: 'Saldo',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'montoAPagar',
            field: 'montoAPagar',
            displayName: 'A pagar',
            width: 100,
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
    ]

    let facturasPendientesArray = [];
    $scope.facturas_ui_grid.data = [];

    $scope.leerFacturasPendientes = () => {

        $scope.showProgress = true;

        Meteor.call('bancosPagosLeerFacturasPendientes',
                                  pago.proveedor,
                                  pago.moneda,
                                  pago.fecha,
                                  pago.anticipoFlag,
                                  pago.cia,
             (err, result) => {

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

              if (result.error) {
                  // el método que intenta grabar los cambis puede regresar un error cuando,
                  // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: result.message
                  });
                  $scope.showProgress = false;
                  $scope.$apply();

              } else {
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: result.message
                  });

                  facturasPendientesArray = [];

                  facturasPendientesArray = JSON.parse(result.facturasPendientes);
                  $scope.facturas_ui_grid.data = facturasPendientesArray;

                  $scope.showProgress = false;
                  $scope.$apply();
              }
            })
    }

    $scope.grabarPagos = () => {

        // nótese como obtenemos los selected rows en el ui-grid
        let selectedRows = facturas_ui_grid_api.selection.getSelectedRows();

        if (!selectedRows || !_.isArray(selectedRows) || !selectedRows.length) {
            DialogModal($modal, "<em>Bancos - Pagos</em>",
            `Aparentemente, Ud. no ha seleccionado ninguna factura en la lista.<br />
             Por favor seleccione al menos una factura en la lista antes de intentar
             ejecutar esta función.
            `, false).then();

            return;
        }

        // todos los pagos a efectuar deben tener un monto a pagar ...
        selectedRows.forEach((pago) => {
            if (!pago.montoAPagar) {
                DialogModal($modal, "<em>Bancos - Pagos</em>",
                `Aparentemente, Ud. no ha indicado un monto a pagar para alguna de las facturas seleccionadas.<br />
                 Por favor indique un monto a pagar para cada factura seleccionada en la lista.
                `, false).then();

                return;
            }
        })

        // construimos un array con los datos que necesitamos para agregar los pagos ...
        let pagosArray = [];
        let pagoItem = {};

        selectedRows.forEach((factura) => {
            pagoItem = {
                claveUnicaPago: pago.claveUnica,
                claveUnicaFactura: factura.claveUnicaFactura,
                claveUnicaCuotaFactura: factura.claveUnicaCuotaFactura,
                montoAPagar: factura.montoAPagar,
            };
            pagosArray.push(pagoItem);
        });


        $scope.showProgress = true;
        $meteor.call('bancosPagosAgregarPagos', JSON.stringify(pagosArray)).then(
            function (data) {

                if (data.error) {
                    // el método que intenta grabar los cambis puede regresar un error cuando,
                    // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: data.message
                    });
                    $scope.showProgress = false;
                } else {
                    DialogModal($modal, "<em>Bancos - Pagos</em>", data.message, false).then(
                        function (resolve) {
                            // cuando el usuario cierre el modal que muestra el mensaje,
                            // cerramos el modal y regresamos al pago
                            $scope.cancel('pagosOK');
                            return;
                        },
                        function (cancel) {
                            $scope.cancel('pagosOK');
                            return;
                        });
                };
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
                $scope.showProgress = false;
            });

    }
}
]);
