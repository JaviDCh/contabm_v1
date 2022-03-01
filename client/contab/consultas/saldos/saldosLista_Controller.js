
import lodash from 'lodash';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { MesesDelAnoFiscal } from '/imports/collections/contab/mesesAnoFiscal'; 

angular.module("contabm").controller("Contab_Consultas_Saldos_Lista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

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
        $state.go("contab.consulta_saldos.filtro", { origen: $scope.origen });
    };

    $scope.exportarExcel = function() {

        let modalInstance = $modal.open({
            templateUrl: 'client/contab/consultas/saldos/exportarExcelModal.html',
            controller: 'ContabSaldosConsultaExportarExcel_Controller',
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
    };


    let saldosContables_ui_grid_api = null;
    let saldoContableSeleccionado = {};

    $scope.saldosContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: true,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            saldosContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                saldoContableSeleccionado = {};

                if (row.isSelected) {
                    saldoContableSeleccionado = row.entity;
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


    $scope.helpers({
        mesesDelAnoFiscal: () => {
          return MesesDelAnoFiscal.find({ cia: companiaContab && companiaContab.numero ? companiaContab.numero : -99});
        }
    });


    $scope.saldosContables_ui_grid.columnDefs = [
        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta contable',
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
            name: 'nombreCuentaContable',
            field: 'nombreCuentaContable',
            displayName: 'Descripcion',
            width: '150',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
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
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'simboloMonedaOriginal',
            field: 'simboloMonedaOriginal',
            displayName: 'Mon orig',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'inicial',
            field: 'inicial',
            displayName: 'Inicial',
            width: '100',
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
            name: 'mes01',
            field: 'mes01',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 1; }).nombreMes,
            width: '100',
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
            name: 'mes02',
            field: 'mes02',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 2; }).nombreMes,
            width: '100',
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
            name: 'mes03',
            field: 'mes03',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 3; }).nombreMes,
            width: '100',
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
            name: 'mes04',
            field: 'mes04',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 4; }).nombreMes,
            width: '100',
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
            name: 'mes05',
            field: 'mes05',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 5; }).nombreMes,
            width: '100',
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
            name: 'mes06',
            field: 'mes06',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 6; }).nombreMes,
            width: '100',
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
            name: 'mes07',
            field: 'mes07',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 7; }).nombreMes,
            width: '100',
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
            name: 'mes08',
            field: 'mes08',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 8; }).nombreMes,
            width: '100',
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
            name: 'mes09',
            field: 'mes09',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 9; }).nombreMes,
            width: '100',
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
            name: 'mes10',
            field: 'mes10',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 10; }).nombreMes,
            width: '100',
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
            name: 'mes11',
            field: 'mes11',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 11; }).nombreMes,
            width: '100',
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
            name: 'mes12',
            field: 'mes12',
            displayName: lodash.find($scope.mesesDelAnoFiscal, (x) => { return x.mesFiscal === 12; }).nombreMes,
            width: '100',
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
            name: 'anual',
            field: 'anual',
            displayName: 'Anual',
            width: '100',
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
    ];


    $scope.saldosContables = []
    $scope.saldosContables_ui_grid.data = [];
    $scope.showProgress = true;

    let subscriptionHandle = null;

    subscriptionHandle =
    Meteor.subscribe('tempConsulta_saldosContables', () => {

        $scope.saldosContables = Temp_Consulta_SaldosContables.find({ user: Meteor.userId() }, { sort: { cuentaContableID: true }}).fetch();

        $scope.saldosContables_ui_grid.data = $scope.saldosContables;

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: $scope.saldosContables.length.toString() + " registros han sido seleccionados ..."
        });

        $scope.showProgress = false;
        $scope.$apply();
    })

    $scope.$on("$destroy", () => {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
  }
]);
