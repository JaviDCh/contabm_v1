
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Filtros } from '/imports/collections/general/filtros'; 

angular.module("contabm").controller("Bancos_ImpuestoITF_resultados_Controller",
['$scope', '$meteor', '$modal', '$state', '$stateParams', 'uiGridConstants',
function ($scope, $meteor, $modal, $state, $stateParams, uiGridConstants) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    let cantidadMovimientosITFLeidos = parseInt($stateParams.cantidadMovimientosITFLeidos);
    let cantidadMovimientosITFAgregados = parseInt($stateParams.cantidadMovimientosITFAgregados);

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

    $scope.movimientosBancarios_ui_grid = {
        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableCellEditOnFocus: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 0,

        onRegisterApi: function (gridApi) {
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
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-check" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
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
            width: '100',
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
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '40',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
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
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'fechaEntregado',
            field: 'fechaEntregado',
            displayName: 'Entregado',
            width: '80',
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'string'
        },
    ];

    $scope.generarAsientoContable = () => {

        $scope.showProgress = true;

        $meteor.call('bancos_itf_generarAsientoContable', companiaSeleccionada.companiaID).then(
            function (data) {
                // debugger;
                DialogModal($modal,
                          "<em>Bancos - Impuesto ITF - Contabilización</em>",
                          `Ok, los asientos contables para los registros de impuesto (itf) han sido agregados. <br /><br />
                          En total, se han agregado ${data.cantidadAsientosAgregados.toString()} asientos contables
                          para el mismo número de cuentas bancarias,
                          y para un total de ${data.cantidadMovimientosBancariosTipoITFLeidos.toString()}
                          registros de impuesto. <br /><br />
                          A todos los asientos contables registrados, se les ha asociado el número de lote:
                          '${data.numeroLote}'. <br /><br />
                          Los asientos contables serán <em>filtrados</em> y mostrados cuando Ud. cierre este diálogo.
                          `,
                          true)
                .then(
                    function (resolve) {
                        // construímos un filtro para leer los asientos y abrimos el state asientos-filter ...
                        if (Filtros.findOne({ nombre: 'asientosContables', userId: Meteor.userId() }))
                            // el filtro existía antes; lo actualizamos
                            // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                            Filtros.update(Filtros.findOne({ nombre: 'asientosContables', userId: Meteor.userId() })._id,
                                           { $set: { filtro: { lote: data.numeroLote } } },
                                           { validate: false });
                        else
                            Filtros.insert({
                                _id: new Mongo.ObjectID()._str,
                                userId: Meteor.userId(),
                                nombre: 'asientosContables',
                                filtro: { lote: data.numeroLote }
                            });

                        $scope.showProgress = false;
                        $state.go('contab.asientosContables.filter', { origen: 'edicion' });
                    },
                    function (err) {
                        $scope.showProgress = false;
                        return true;
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



    $scope.movimientosBancarios = MovimientosBancarios.find({
        user: Meteor.userId()
    },
    { sort: { fecha: 1, transaccion: 1, tipo: 1 }}).fetch();

    $scope.alerts.length = 0;
    $scope.alerts.push({
        type: 'info',
        msg: `Ok, en total, hemos leído ${cantidadMovimientosITFLeidos} movimientos bancarios de tipo ITF.<br />
            De éstos, <b>${cantidadMovimientosITFAgregados} han sido agregados a la base de datos</b>, pues eran registros nuevos.`
    });

    $scope.movimientosBancarios_ui_grid.data = $scope.movimientosBancarios;
}
]);
