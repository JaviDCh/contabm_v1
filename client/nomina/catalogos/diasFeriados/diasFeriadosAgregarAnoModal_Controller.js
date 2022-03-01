
import moment from 'moment'; 
import { DialogModal } from '/client/generales/angularGenericModal'; 

angular.module("contabm").controller('DiasFeriadosAgregarAno_Modal_Controller',
['$scope', '$modalInstance', '$modal', 'diasFeriados', 'diasFiestaNacional',
function ($scope, $modalInstance, $modal, diasFeriados, diasFiestaNacional) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function (asientoContableID) {
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.diasFeriadosTipoList = [
        { tipo: 0, descripcion: "Sábado" },
        { tipo: 1, descripcion: "Domingo" },
        { tipo: 2, descripcion: "Feriado" },
        { tipo: 3, descripcion: "Fiesta nacional" },
        { tipo: 4, descripcion: "Bancario" },
    ];


    $scope.submitted = false;
    $scope.parametros = {};

    $scope.diasFeriadosAgregarDiasFeriadosAnoForm_submit = () => {
        $scope.submitted = true;

        $scope.alerts.length = 0;

        if (!$scope.parametros || !$scope.parametros.ano) {

            DialogModal($modal, "<em>Nómina - Registro de días feriados</em>",
                                `Error: Ud. debe indicar el año para el cual desea agregar los días
                                 feriados. Indique un año; por ejemplo: 2015.
                                `,
                                false);
            return;
        }

        if ($scope.parametros.ano < 2000 || $scope.parametros.ano > 2050) {

            DialogModal($modal, "<em>Nómina - Registro de días feriados</em>",
                                `Error: aparentemente, el año no es un valor numérico o no está bien
                                 formado. Ud. debe indicar un año; por ejemplo: 2015.
                                `,
                                false);
            return;
        }

        if (!_.isArray(diasFiestaNacional) || !diasFiestaNacional.length) {
            DialogModal($modal, "<em>Nómina - Registro de días feriados</em>",
                                `Error: aparentemente, la lista de días de fiesta y bancarios no
                                 contiene registros.<br />
                                 La lista de días de fiesta debe contener las fechas que Ud. desea
                                 agregar al año indicado.<br />
                                 Por favor indique cuales son los días de fiesta, en la lista
                                 correspondiente, y luego regrese a ejecutar esta función.
                                `,
                                false);
            return;
        }


        if ($scope.diasFeriadosAgregarDiasFeriadosAnoForm.$valid) {
            $scope.submitted = false;
            $scope.diasFeriadosAgregarDiasFeriadosAnoForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            $scope.showProgress = true;
            $scope.diasFeriadosAnoIndicado = [];

            let cantidadSabados = 0;
            let cantidadDomingos = 0;
            let cantidadDiasFeriados = 0;
            let cantidadDiasBancarios = 0;

            let dia = new Date($scope.parametros.ano, 0, 1);
            let diaFinalAno = new Date($scope.parametros.ano, 11, 31);

            // agregamos sábados y domingos
            while (dia <= diaFinalAno) {

                // determinamos si el día es sábado o domingo; de serlo, agregamos al array
                if (dia.getDay() === 6) {
                    let diaFeriado = {
                        _id: new Mongo.ObjectID()._str,
                        claveUnica: 0,
                        fecha: dia,
                        tipo: 0,            // sábado
                        docState: 1,
                    };
                    $scope.diasFeriadosAnoIndicado.push(diaFeriado);
                    cantidadSabados++;
                }

                if (dia.getDay() === 0) {
                    let diaFeriado = {
                        _id: new Mongo.ObjectID()._str,
                        claveUnica: 0,
                        fecha: dia,
                        tipo: 1,                // domingo
                        docState: 1,
                    };
                    $scope.diasFeriadosAnoIndicado.push(diaFeriado);
                    cantidadDomingos++;
                }

                // agregamos un día
                dia = moment(dia).add(1, 'days').toDate();
            }

            // recorremos la lista de días feriados y los agregamos al array
            diasFiestaNacional.forEach((fiestaNacional) => {

                // la fecha puede haber sido registrada para cualquier año; la adecuamos para este año ...
                let fecha = new Date($scope.parametros.ano,
                                     fiestaNacional.fecha.getMonth(),
                                     fiestaNacional.fecha.getDate());

                switch (fiestaNacional.tipo) {
                    case "FER": {
                        let diaFeriado = {
                            _id: new Mongo.ObjectID()._str,
                            claveUnica: 0,
                            fecha: fecha,
                            tipo: 3,
                            docState: 1,
                        };
                        $scope.diasFeriadosAnoIndicado.push(diaFeriado);
                        cantidadDiasFeriados++;

                        break;
                    }
                    case "BANC": {
                        let diaFeriado = {
                            _id: new Mongo.ObjectID()._str,
                            claveUnica: 0,
                            fecha: fecha,
                            tipo: 4,
                            docState: 1,
                        };
                        $scope.diasFeriadosAnoIndicado.push(diaFeriado);
                        cantidadDiasBancarios++;

                        break;
                    }
                    default:
                }
            })

            $scope.diasFeriados_ui_grid.data = [];
            $scope.diasFeriados_ui_grid.data = $scope.diasFeriadosAnoIndicado;

            DialogModal($modal, "<em>Nómina - Registro de días feriados</em>",
                        `Ok, las fechas que corresponden a los días feriados de un año han sido calculadas.<br /><br />
                         En total, se agregaron: ${cantidadSabados.toString()} sábados, ${cantidadDomingos.toString()} domingos,
                         ${cantidadDiasFeriados.toString()} feriados, ${cantidadDiasBancarios.toString()} bancarios.<br /><br />
                         Ahora, Ud. puede revisar estas fechas y luego hacer un <em>click</em>
                         en <b><em>2) Agregar días feriados</em></b>  para agregar esta lista (de fechas) a la lista original.
                        `,
                        false);
            $scope.showProgress = false;
        }
    }

    $scope.agregarItemsArrayDiasFeriados = function() {

        // agregamos las fechas calculadas al array original (diasFeriados)
        let cantidadRegistrosAgregados = 0;

        $scope.diasFeriadosAnoIndicado.forEach((diaFeriado) => {
            diasFeriados.push(diaFeriado);
            cantidadRegistrosAgregados++;
        })

        DialogModal($modal, "<em>Nómina - Registro de días feriados</em>",
                    `Ok, <b>${cantidadRegistrosAgregados.toString()}</b> fechas, que corresponden a días
                     feriados calculados, han sido agregadas a la lista
                     original.<br /><br />
                     Ud. podrá ver estas fechas cuando cierre este diálogo y revise la lista de
                     días feriados.<br /><br />
                     Las fechas calculadas para el año indicado <b>solo</b> serán agregadas a la
                     base de datos, cuando Ud. cierre este diálogo y haga un <em>click</em> en
                     <b><em>Grabar</em></b>.
                    `,
                    false);
    }



    let diasFeriados_ui_grid_api = null;
    let diaFeriadoSeleccionado = {};
    $scope.diasFeriadosAnoIndicado = [];

    $scope.diasFeriados_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableFiltering: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            diasFeriados_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                diaFeriadoSeleccionado = {};
                if (row.isSelected) {
                    diaFeriadoSeleccionado = row.entity;
                }
                else
                    return;
            });

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };
                };
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

    $scope.diasFeriados_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '120',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 120,
            enableFiltering: false,
            cellFilter: 'mapDropdown:row.grid.appScope.diasFeriadosTipoList:"tipo":"descripcion"',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.diasFeriadosTipoList,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteDiaFeriado(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ];


    $scope.deleteDiaFeriado = function (item) {
        if (item.docState && item.docState === 1)
            // si el item es nuevo, simplemente lo eliminamos del array
            _.remove($scope.diasFeriadosAnoIndicado, (x) => { return x._id === item._id; });
        else
            item.docState = 3;
    };

    $scope.nuevoDiaFeriado = function () {
        let item = {
            _id: new Mongo.ObjectID()._str,
            claveUnica: 0,
            fecha: new Date(),
            docState: 1
        };

        $scope.diasFeriadosAnoIndicado.push(item);

        $scope.diasFeriados_ui_grid.data = [];
        $scope.diasFeriados_ui_grid.data = $scope.diasFeriadosAnoIndicado;
    };


    $scope.diasFeriados_ui_grid.data = [];
    $scope.diasFeriados_ui_grid.data = $scope.diasFeriadosAnoIndicado;
}
]);
