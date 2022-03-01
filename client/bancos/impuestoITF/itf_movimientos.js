

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Bancos_ImpuestoITF_Movimientos_Controller",
['$scope', '$meteor', '$modal', '$state', 'uiGridConstants', function ($scope, $meteor, $modal, $state, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // ------------------------------------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionadaDoc = {};

    if (companiaSeleccionada)
        companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });
    // ------------------------------------------------------------------------------------------------------------------------------

    $scope.regresarAlFiltro = () => {
        $state.go('bancos.impuestoTransaccionesFinancieras.filtro');
    };



    let movimientoBancarioSeleccionado = null;
    let movimientosBancarios_ui_grid_api = null;

    $scope.movimientosBancarios_ui_grid = {
        enableSorting: true,
        enableFiltering: true,
        showGridFooter: true,
        showColumnFooter: true,
        enableCellEdit: false,
        // enableRowSelection: true,
        // enableRowHeaderSelection: false,
        // multiSelect: false,
        // enableSelectAll: false,
        enableCellEditOnFocus: true,
        // selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            movimientosBancarios_ui_grid_api = gridApi;

            // gridApi.selection.on.rowSelectionChanged($scope, function (row) {
            //     // debugger;
            //     movimientoBancarioSeleccionado = {};
            //
            //     if (row.isSelected) {
            //         // asignamos al array de compañías en el análisis contable
            //         movimientoBancarioSeleccionado = row.entity;
            //     }
            //     else
            //         return;
            // });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.movimientosBancarios_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'agregarITF',
            field: 'agregarITF',
            displayName: 'ITF',
            width: '40',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'banco',
            field: 'banco',
            displayName: 'Banco',
            width: '60',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuentaBancaria',
            field: 'cuentaBancaria',
            displayName: 'Cuenta',
            width: '170',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'transaccion',
            field: 'transaccion',
            displayName: 'Número',
            width: '80',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
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
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'beneficiario',
            field: 'beneficiario',
            displayName: 'Beneficiario',
            width: '180',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: '180',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableFiltering: true,
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            ooterCellClass: 'ui-grid-rightCell',

            type: 'string'
        },
        // {
        //     name: 'fechaEntregado',
        //     field: 'fechaEntregado',
        //     displayName: 'Entregado',
        //     width: '80',
        //     cellFilter: 'dateFilter',
        //     headerCellClass: 'ui-grid-centerCell',
        //     cellClass: 'ui-grid-centerCell',
        //     enableColumnMenu: false,
        //     enableCellEdit: false,
        //     enableSorting: true,
        //     type: 'string'
        // },
    ];



    // $scope.helpers({
    //     temp_movimientosBancarios_generar_itf: () => {
    //         return Temp_MovimientosBancarios_Generar_ITF.find({ user: Meteor.userId() });
    //     },
    // });

    $scope.showProgress = true;
    $scope.temp_movimientosBancarios_generar_itf = [];

    $scope.subscribe("movimientosBancarios", () => [],
    {
          onReady: function() {

            //   debugger;

                $scope.helpers({
                    movimientosBancarios: () => MovimientosBancarios.find({ user: Meteor.userId() },
                                                                          { sort: { fecha: 1, transaccion: 1, tipo: 1 }}),
                });

                let recordCount = MovimientosBancarios.find({ user: Meteor.userId() }).count();
                let recordCount_itf = MovimientosBancarios.find({ user: Meteor.userId(), tipo: 'IT' }).count();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok,  <b>${recordCount.toString()}</b> <em>movimientos bancarios</em> fueron leídos desde el servidor; <br />
                          De éstos, <b>${recordCount_itf.toString()}</b> corresponden a movimientos del tipo 'IT' que ya existían,
                          pues fueron registrados antes.
                    `
                });

                $scope.movimientosBancarios_ui_grid.data = $scope.movimientosBancarios;

                $scope.showProgress = false;
                $scope.$apply();
          }
    });

    $scope.generarITF = () => {
        // debugger;
        $scope.showProgress = true;
        // este método genera movimientos itf, para los movimientos seleccionados y el usuario (current)

        // construimos y pasamos al method un arrary con los registros seleccionados; éstos son los que el method va a tratar ...,

        let movimientosSeleccionados = [];

        _.chain($scope.movimientosBancarios)
         .filter((m) => { return m.tipo != 'IT' && m.agregarITF; })
         .forEach((m) => { movimientosSeleccionados.push(m._id); })
         .value();

        $scope.movimientosBancarios = [];

        $meteor.call('bancos_itf_generarMovimientosITF', movimientosSeleccionados).then(
            function (data) {

                $scope.subscribe("movimientosBancarios", () => [],
                {
                      onReady: function() {

                            $scope.movimientosBancarios = [];
                            // $scope.movimientosBancarios = MovimientosBancarios.find({ user: Meteor.userId() }).fetch();

                            $scope.helpers({
                                movimientosBancarios: () => MovimientosBancarios.find({ user: Meteor.userId() },
                                                                                      { sort: { fecha: 1, transaccion: 1, tipo: 1 }}),
                            });

                            $scope.movimientosBancarios_ui_grid.data = [];
                            $scope.movimientosBancarios_ui_grid.data = $scope.movimientosBancarios;

                            $scope.alerts.length = 0;
                            $scope.alerts.push({
                                type: 'info',
                                msg: data
                            });

                            $scope.showProgress = false;
                            $scope.$apply();
                      }
                });
            },
            function (err) {

                let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                if (err.errorType)
                    errorMessage += " (" + err.errorType + ")";

                errorMessage += "<br />";

                if (err.message)
                    // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                    errorMessage += err.message + " ";
                else {
                    if (err.reason)
                        errorMessage += err.reason + " ";

                    if (err.details)
                        errorMessage += "<br />" + err.details;
                };

                if (!err.message && !err.reason && !err.details)
                    errorMessage += err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
    };


    $scope.grabar = () => {
        $scope.showProgress = true;
        // este método genera movimientos itf, para los movimientos seleccionados y el usuario (current)
        $meteor.call('bancos_itf_grabarMovimientosITF_ASqlServer', companiaSeleccionadaDoc.numero).then(
            function (data) {

                $scope.subscribe("movimientosBancarios", () => [],
                {
                      onReady: function() {
                          $scope.showProgress = false;
                          $state.go('bancos.impuestoTransaccionesFinancieras.resultados', {
                                     cantidadMovimientosITFLeidos: data.cantidadMovimientosITFLeidos,
                                     cantidadMovimientosITFAgregados: data.cantidadMovimientosITFAgregados
                          });
                      }
                });
            },
            function (err) {

                let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                if (err.errorType)
                    errorMessage += " (" + err.errorType + ")";

                errorMessage += "<br />";

                if (err.message)
                    // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                    errorMessage += err.message + " ";
                else {
                    if (err.reason)
                        errorMessage += err.reason + " ";

                    if (err.details)
                        errorMessage += "<br />" + err.details;
                };

                if (!err.message && !err.reason && !err.details)
                    errorMessage += err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
    };

    // $scope.movimientosBancarios_ui_grid.data = $scope.temp_movimientosBancarios_generar_itf;
    $scope.movimientosBancarios_ui_grid.data = [];
}
]);
