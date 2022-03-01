

import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { CajaChica_Rubros_SimpleSchema } from '../../../../../imports/collections/bancos/cajaChica.cajasChicas'; 
import { mensajeErrorDesdeMethod_preparar } from '../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm.contab.catalogos").controller("Catalogos_Bancos_CajaChica_Rubros_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    let ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.items_ui_grid = {

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

            ui_grid_api = gridApi;

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
            return row.rubro;
        },

        getRowIdentity: function (row) {
            return row.rubro;
        }
    }

    $scope.items_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableFiltering: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'rubro',
            field: 'rubro',
            displayName: 'Rubro',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableFiltering: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableFiltering: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableFiltering: false,
            enableSorting: false,
            width: 25
        },
    ]



    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.cajaChica_rubros, (x: any) => { return x.rubro === item.rubro; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevo = function () {

        // el pk para cada item en sql en un Identity. Determinamos un valor consecutivo para cada item al agregar 
        // en la lista, pero al grabar en el server ponemos en cero para registros nuevos para que sql server 
        // determine el verdadero valor al agregar el registro ... 
        let id = {} as any; 
        if (Array.isArray($scope.cajaChica_rubros) && $scope.cajaChica_rubros.length) { 
            id = lodash.maxBy($scope.cajaChica_rubros, "rubro"); 
        }

        let item = {
            rubro: id && lodash.isFinite(id.rubro) ? id.rubro + 1 : 0,       // isFiniite is true even if the argument is zero  ,
            docState: 1
        };

        $scope.cajaChica_rubros.push(item);

        $scope.items_ui_grid.data = [];
        if (lodash.isArray($scope.cajaChica_rubros)) {
            $scope.items_ui_grid.data = $scope.cajaChica_rubros;
        }
    }

    $scope.save = function () {
        $scope.showProgress = true;

        let editedItems = lodash.filter($scope.cajaChica_rubros, function (item: any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        editedItems.forEach((item:any) => {
            if (item.docState != 3) {
                isValid = CajaChica_Rubros_SimpleSchema.namedContext().validate(item);

                if (!isValid) {
                    CajaChica_Rubros_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CajaChica_Rubros_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                    })
                }
            }
        })

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }

        $scope.items_ui_grid.data = [];
        Meteor.call('bancos.cajaChica.catalogos.rubros.save', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.cajaChica_rubros = [];
                leerItemsDesdeSqlServer().then(
                    (result: any) => { 
                        $scope.cajaChica_rubros = JSON.parse(result);
                        $scope.items_ui_grid.data = $scope.cajaChica_rubros;
                
                        $scope.showProgress = false;
                        $scope.$apply();
                    }, 
                    (err) => { 
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: errorMessage
                        });
            
                        $scope.showProgress = false;
                        $scope.$apply();
                    }
                )
                return; 
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            $scope.cajaChica_rubros = [];
            leerItemsDesdeSqlServer().then(
                (result: any) => { 
                    $scope.cajaChica_rubros = JSON.parse(result);
                    $scope.items_ui_grid.data = $scope.cajaChica_rubros;
            
                    $scope.showProgress = false;
                    $scope.$apply();
                }, 
                (err) => { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
            
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
                }
            )
        })
    }

    
    $scope.showProgress = true;
    leerItemsDesdeSqlServer().then(
        (result: any) => { 
            $scope.cajaChica_rubros = JSON.parse(result);
            $scope.items_ui_grid.data = $scope.cajaChica_rubros;
    
            $scope.showProgress = false;
            $scope.$apply();
        }, 
        (err) => { 
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
        }
    )
}
])


function leerItemsDesdeSqlServer() { 
    return new Promise((resolve, reject) => { 
        Meteor.call('bancos.cajaChica.catalogos.rubros.LeerDesdeSql', (err, result) => {

            if (err) {
                reject(err); 
            }
    
            resolve(result); 
        })
    })
}