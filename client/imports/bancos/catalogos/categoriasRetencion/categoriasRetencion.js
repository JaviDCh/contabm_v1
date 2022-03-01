
import angular from 'angular';
import angularMeteor from 'angular-meteor';
import lodash from 'lodash';
import moment from 'moment'; 

import { CategoriasRetencion } from '/imports/models/bancos/catalogos/categoriasRetencion';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

export default angular.module("categoriasRetencion", [ angularMeteor ])
    .controller("Bancos_Catalogos_CategoriasRetencion_Controller", ['$scope', function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.tiposPersona = [ 
        { tipo: "PN", descripcion: "Per nat"}, 
        { tipo: "PJ", descripcion: "Per jur"}, 
    ]

    let categoriasRetencion_ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.categoriasRetencion_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableCellEdit: false,
        enableFiltering: true,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            categoriasRetencion_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
                }
                else { 
                    return;
                }    
            })

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    }
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row.categoria;
        },
        getRowIdentity: function (row) {
            return row.categoria;
        }
    }


    $scope.categoriasRetencion_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            enableFiltering: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'categoria',
            field: 'categoria',
            displayName: '#',
            width: 40,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripcion',
            width: 250,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'tipoPersona',
            field: 'tipoPersona',
            displayName: 'Tipo (nat/jur)',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'tipo',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tiposPersona,
            cellFilter: 'mapDropdown:row.grid.appScope.tiposPersona:"tipo":"descripcion"',

            enableFiltering: false,
            type: 'string'
        },
        {
            name: 'fechaAplicacion',
            field: 'fechaAplicacion',
            displayName: 'Fecha',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'dateFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: false,
            type: 'date'
        },
        {
            name: 'codigoIslr',
            field: 'codigoIslr',
            displayName: 'Código',
            width: 60,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: true,
            type: 'string'
        },
        {
            name: 'porcentajeRetencion',
            field: 'porcentajeRetencion',
            displayName: 'Ret (%)',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: false, 
            type: 'number'
        },
        {
            name: 'aplicaSustraendo',
            field: 'aplicaSustraendo',
            displayName: 'Sustraendo?',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: false, 
            type: 'boolean'
        },
        {
            name: 'minimo',
            field: 'minimo',
            displayName: 'Mínimo',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterAndNull',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: false, 
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            enableFiltering: false, 
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.categoriasRetencion, (x) => { return x.categoria === item.categoria; });
        } else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {
        // cómo leemos los items directamente desde sql, no vienen con _id, sino el pk propio de sql. Lo usamos en el ui-grid para
        // identificar los items en la lista; por eso debemos actualizarlo aquí para que se muestre correctamente en la lista. Claro que
        // al grabar en sql, éste asignará el pk apropiado (que corresponda)

        // el array puede venir vacío
        let proximo = 0;
        if ($scope.categoriasRetencion.length) {
            proximo = lodash.maxBy($scope.categoriasRetencion, 'categoria').categoria;
        }

        proximo++;

        let item = {
            categoria: proximo,
            tipoPersona: "PJ", 
            fechaAplicacion: new Date(), 
            docState: 1
        };

        $scope.categoriasRetencion.push(item);
    }


    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = _.filter($scope.categoriasRetencion, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = CategoriasRetencion.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    CategoriasRetencion.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CategoriasRetencion.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                    });
                }
            }
        })

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {
                            if (previous == "") {
                                return current;          // first value
                            }
                            else {
                                return previous + "<br />" + current;
                            }
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        $scope.categoriasRetencion = [];
        $scope.categoriasRetencion_ui_grid.data = [];

        Meteor.call('bancos.categoriasRetencion.grabarSqlServer', editedItems, (err, result) => {

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

            inicializarItem()
                .then((resolve) => {
                    $scope.categoriasRetencion = JSON.parse(resolve.categoriasRetencion);
                    $scope.categoriasRetencion_ui_grid.data = $scope.categoriasRetencion;

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: result.message        // este es el mensaje de meteor method y no el del promise (inicializarItem)
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                })
                .catch((err) => {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: err.message
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                })
        })
    }


    $scope.showProgress = true;
    inicializarItem()
        .then((resolve) => {
            $scope.categoriasRetencion = [];
            $scope.categoriasRetencion_ui_grid.data = [];

            $scope.categoriasRetencion = JSON.parse(resolve.categoriasRetencion);

            // las fechas siempre vienen como strings cuando se serializan desde el server; por eso, convertimos los strings a date nuevamente ... 
            $scope.categoriasRetencion.forEach((x) => { 
                x.fechaAplicacion = x.fechaAplicacion ? moment(x.fechaAplicacion).toDate() : null; 
            })

            $scope.categoriasRetencion_ui_grid.data = $scope.categoriasRetencion;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: resolve.message
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
        .catch((err) => {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: err.message
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
])


function inicializarItem() {
    return new Promise(function (resolve, reject) {
        Meteor.call('bancos.categoriasRetencion.leerDesdeSqlServer', (err, result) => {

             if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                 reject(Error(errorMessage));
             }

            if (result.error) {
                reject(result.message);
            } else {
                resolve(result);
            }
        })
    })
}
