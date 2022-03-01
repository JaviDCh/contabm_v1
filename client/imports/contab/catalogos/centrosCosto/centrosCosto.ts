


import * as angular from 'angular';
import * as angularMeteor from 'angular-meteor';
import * as lodash from 'lodash';
import * as moment from 'moment'; 

import { CentrosCosto_SimpleSchema } from '../../../../../imports/models/contab/catalogos/centrosCosto';
import { mensajeErrorDesdeMethod_preparar } from '../../../clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

export default angular.module("centrosCosto", [ 'angular-meteor' ])
    .controller("Contab_Catalogos_CentrosCosto_Controller", ['$scope', function ($scope) {

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

    let list_ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.list_ui_grid = {

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

            list_ui_grid_api = gridApi;

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
            return row.centroCosto;
        },
        getRowIdentity: function (row) {
            return row.centroCosto;
        }
    }

    $scope.list_ui_grid.columnDefs = [
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
            name: 'centroCosto',
            field: 'centroCosto',
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
            name: 'descripcionCorta',
            field: 'descripcionCorta',
            displayName: 'Abreviatura',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            enableFiltering: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'suspendido',
            field: 'suspendido',
            displayName: 'Suspendido?',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
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
            lodash.remove($scope.centrosCosto, (x: any) => { return x.centroCosto === item.centroCosto; });
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
        if ($scope.centrosCosto.length) {
            let maxItem: { centroCosto: number } | undefined = lodash.maxBy($scope.centrosCosto, 'centroCosto'); 
            if (maxItem && maxItem.centroCosto) { 
                proximo = maxItem.centroCosto;
            }
        }

        proximo++;

        let item = {
            centroCosto: proximo,
            suspendido: false, 
            docState: 1
        };

        $scope.centrosCosto.push(item);
    }


    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = lodash.filter($scope.centrosCosto, function (item: any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item: any) => {
            if (item.docState != 3) {
                isValid = CentrosCosto_SimpleSchema.namedContext().validate(item);

                if (!isValid) {
                    CentrosCosto_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CentrosCosto_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + "." as never);
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

        $scope.centrosCosto = [];
        $scope.list_ui_grid.data = [];

        Meteor.call('contab.centrosCosto.grabarSqlServer', editedItems, (err, result) => {

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
                .then((resolve: any) => {
                    $scope.centrosCosto = JSON.parse(resolve.centrosCosto);
                    $scope.list_ui_grid.data = $scope.centrosCosto;

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
        .then((resolve: any) => {
            $scope.centrosCosto = [];
            $scope.list_ui_grid.data = [];

            $scope.centrosCosto = JSON.parse(resolve.centrosCosto);

            $scope.list_ui_grid.data = $scope.centrosCosto;

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

// nótese que esta es una versión simplificada de esta función, pues siempre existirá *un solo* registro para cada compañía Contab
function inicializarItem() {
    return new Promise(function (resolve, reject) {
        // leemos el registro desde sql server; nótese que el pk del registro es la cia contab a la cual corresponde
        Meteor.call('contab.centrosCosto.leerDesdeSqlServer', (err, result) => {

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
