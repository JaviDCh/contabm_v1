

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Contab_Consultas_CuentasYMovimientos_Lista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    let desde = $stateParams.desde;
    let hasta = $stateParams.hasta;

    let contabSysNet_app_address = Meteor.settings.public.contabSysNet_app_address;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada) { 
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    }
    // ------------------------------------------------------------------------------------------------

    // construimos el url que se debe usar para obtener el reporte (sql server reporting services - asp.net)
    $scope.reportLink = "#";
    if (desde && hasta && contabSysNet_app_address) {
        $scope.reportLink = `${contabSysNet_app_address}/ReportViewer4.aspx?user=${Meteor.userId()}&cia=${companiaContab.numero}&report=cuentasYMovimientos&desde=${desde}&hasta=${hasta}`;
    }

    $scope.regresarALista = function () {
        $state.go("contab.consulta_cuentasYMovimientos.filtro", { origen: $scope.origen });
    }

    $scope.exportarExcel = function() {

        let modalInstance = $modal.open({
            templateUrl: 'client/contab/consultas/cuentasYSusMovimientos/exportarExcelModal.html',
            controller: 'ContabCuentasYSusMovimientosConsultaExportarExcel_Controller',
            size: 'lg',
            resolve: {
                desde: () => {
                    return desde;
                },
                hasta: () => {
                    return hasta;
                },
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
    };


    let saldosDeCuentasContables_ui_grid_api = null;
    let saldoContableSeleccionado = {};

    $scope.saldosDeCuentasContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            saldosDeCuentasContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                saldoContableSeleccionado = {};

                if (row.isSelected) {
                    saldoContableSeleccionado = row.entity;
                    mostrarMovimientosCuentaSeleccionada(saldoContableSeleccionado);
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


    $scope.saldosDeCuentasContables_ui_grid.columnDefs = [
        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta contable',
            width: '130',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'nombreCuentaContable',
            field: 'nombreCuentaContable',
            displayName: 'Descripcion',
            width: '200',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'simboloMoneda',
            field: 'simboloMoneda',
            displayName: 'Mon',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'saldoInicial',
            field: 'saldoInicial',
            displayName: 'Inicial',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'debe',
            field: 'debe',
            displayName: 'Debe',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'haber',
            field: 'haber',
            displayName: 'Haber',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'saldoFinal',
            field: 'saldoFinal',
            displayName: 'Final',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'cantidadMovimientos',
            field: 'cantidadMovimientos',
            displayName: 'Cant mvtos',
            width: '85',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellClass: 'ui-grid-centerCell',

            type: 'number'
        },
    ];


    $scope.saldosContables = []
    $scope.saldosDeCuentasContables_ui_grid.data = [];
    $scope.showProgress = true;

    // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
    $scope.subscribe('tempConsulta_cuentasContablesYSusMovimientos', () => [], {
        onReady: function () {
            $scope.saldosContables = Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: Meteor.userId() }, { sort: { cuentaContable: true }}).fetch();
            $scope.movimientos = Temp_Consulta_Contab_CuentasYSusMovimientos2.find({ user: Meteor.userId() }).fetch();

            $scope.saldosDeCuentasContables_ui_grid.data = $scope.saldosContables;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: $scope.saldosContables.length.toString() + " registros han sido seleccionados ..."
            });

            $scope.showProgress = false;
            $scope.$apply();
        },
        onStop: function (error) {
          if (error) {
            console.log('An error happened - ', error);
          } else {
          };
        }
      });


    // esta variable está en settings e indica el url de la app ContabSysNet; desde allí, existen
    // páginas para generar algunos reportes (con sql server reporting services)
    if (!contabSysNet_app_address) {
        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'danger',
            msg: `Error: no existe, en <em>settings</em>, la dirección de la aplicación <em>ContabSysNet</em>.
                  Aunque Ud. puede continuar y revisar los datos que ha determinado esta consulta, no podrá
                  obtener un reporte para la misma.
                 `
        });
    };



    function mostrarMovimientosCuentaSeleccionada(cuentaContable) {
        $scope.showProgress = true;

        let modalInstance = $modal.open({
            templateUrl: 'client/contab/consultas/cuentasYSusMovimientos/mostrarMovimientosModal.html',
            controller: 'CuentasContablesYMovimientos_MostrarMovimientos_Modal_Controller',
            size: 'lg',
            resolve: {
                movimientos: () => {
                    // pasamos al modal los movimientos que corresonden a la cuenta contable seleccionada en la lista
                    return _.filter($scope.movimientos, (x) => { return x.registroCuentaContableID == cuentaContable._id });
                },
                ciaSeleccionada: () => {
                    return companiaContab;
                },
            },
        }).result.then(
              function (resolve) {
                  $scope.showProgress = false;
                  return true;
              },
              function (cancel) {
                  $scope.showProgress = false;
                  return true;
              });
    };
  }
]);
