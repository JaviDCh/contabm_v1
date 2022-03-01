


import * as angular from 'angular';
import * as angularMeteor from 'angular-meteor';
import * as lodash from 'lodash';
import { Mongo } from 'meteor/mongo'; 

import { UnidadTributaria } from '../../../../../imports/collections/bancos/unidadTributaria';
import { mensajeErrorDesdeMethod_preparar } from '../../../clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

export default angular.module("unidadTributaria", [ 'angular-meteor' ])
    .controller("Bancos_Catalogos_UnidadTributaria_Controller", ['$scope', function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    let list_ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.list_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: false,
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
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
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
            width: 25
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            cellFilter: 'dateFilter',
            width: 120,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'date'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            cellFilter: 'currencyFilter',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'factor',
            field: 'factor',
            displayName: 'Factor',
            width: 140,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableSorting: true,
            enableColumnMenu: false,
            enableCellEdit: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]


    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.unidadTributaria, (x: any) => { return x._id === item._id; });
        } else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {

        let item = {
            _id: new Mongo.ObjectID()._str,
            fecha: new Date(), 
            docState: 1
        };

        $scope.unidadTributaria.push(item);
    }


    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = $scope.unidadTributaria.filter((item: any) => { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item: any) => {
            if (item.docState != 3) {
                isValid = UnidadTributaria.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    UnidadTributaria.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + UnidadTributaria.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + "." as never);
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

        $scope.unidadTributaria = [];
        $scope.list_ui_grid.data = [];

        Meteor.call('bancos.unidadTributaria.save', editedItems, (err, result) => {

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

            if (subscriptionHandle) { 
                subscriptionHandle.stop(); 
            }

            subscriptionHandle = 
            Meteor.subscribe('unidadTributaria', () => { 

                $scope.helpers({
                    unidadTributaria: () => {
                        return UnidadTributaria.find({}, { sort: { fecha: 1 } });
                    },
                });
        
                $scope.list_ui_grid.data = $scope.unidadTributaria;

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result
                });

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }

    $scope.showProgress = true;

    // ---------------------------------------------------------
    // subscriptions ...
    let subscriptionHandle = 
    Meteor.subscribe('unidadTributaria', () => { 

        $scope.helpers({
            unidadTributaria: () => {
                return UnidadTributaria.find({}, { sort: { fecha: 1 } });
            },
        });

        $scope.list_ui_grid.data = $scope.unidadTributaria;
        $scope.showProgress = false;
        $scope.$apply();
    })
    // ---------------------------------------------------------
}])
