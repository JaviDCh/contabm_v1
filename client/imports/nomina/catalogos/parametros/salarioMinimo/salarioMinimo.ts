

import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { mensajeErrorDesdeMethod_preparar } from '../../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { nominaParametrosSalarioMinimo_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.salarioMinimo'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.nomina.catalogos").controller("catalogos_nomina_parametros_salarioMinimo_Controller",
['$scope', function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    let items_ui_grid_api = null;
    let itemSeleccionado = null; 

    $scope.items_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableFiltering: false,
        enableCellEdit: false,
        enableCellEditOnFocus: true,           
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            items_ui_grid_api = gridApi;
            
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                itemSeleccionado = null;
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
                } else {
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
            return row.id;
        },
        getRowIdentity: function (row) {
            return row.id;
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
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'id',
            field: 'id',
            displayName: 'id',
            width: 80, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'desde',
            field: 'desde',
            displayName: 'Desde',
            cellFilter: 'dateFilter',
            width: 100,
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
            width: 150, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.salariosMinimos, (x:any) => { return x._id === item._id; });
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

        // obtenemos el último de los elementos en la lista 
        let ultimo : any | undefined = lodash.maxBy($scope.salariosMinimos, 'id'); 
        let proximoID: number = 0; 

        if (!ultimo) { 
            proximoID = 1; 
        } else { 
            proximoID = ultimo.id + 1; 
        }

        let today =  new Date(); 

        let item = {
            // "new Mongo.ObjectID()._str" produce un error en TS (no está en la definición?),
            id: proximoID,
            desde: new Date(today.getFullYear(), today.getMonth(), today.getDate()),        // ponemos el día de hoy, pero sin time ... 
            docState: 1
        };

        $scope.salariosMinimos.push(item);
        $scope.items_ui_grid.data = $scope.salariosMinimos;
    }


    $scope.save = function() { 

        $scope.showProgress = true;
        
        let editedItems = lodash.filter($scope.salariosMinimos, function (item:any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = nominaParametrosSalarioMinimo_schema.namedContext().validate(item);

                if (!isValid) {
                    nominaParametrosSalarioMinimo_schema.namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${nominaParametrosSalarioMinimo_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
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
        
        Meteor.call('nomina.parametros.salarioMinimo.save', editedItems, (err, saveMethodResult) => {
            
            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.items_ui_grid.data = $scope.salariosMinimos;
                
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            }

            // luego de grabar, y si no se ha producido un error, leemos nuevamente los registros desde la base de datos 
            Meteor.call('nomina.parametros.salarioMinimo.leerDesdeSqlServer', (err, result) => {

                if (err) { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
                
                    $scope.items_ui_grid.data = $scope.salariosMinimos;

                    $scope.showProgress = false;
                    $scope.$apply();

                    return; 
                }


                if (result.error) { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message,
                    });

                    $scope.items_ui_grid.data = $scope.salariosMinimos;
                
                    $scope.showProgress = false;
                    $scope.$apply(); 
                } else { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
                    });
                    
                    $scope.salariosMinimos = []; 
                    $scope.salariosMinimos = JSON.parse(result.salariosMinimos); 
                    
                    // convertimos las fechas pues vienen como strings al ser serializadas 
                    for (let item of $scope.salariosMinimos) { 
                        item.desde = item.desde ? new Date(item.desde) : null;
                    }
                    
                    $scope.items_ui_grid.data = $scope.salariosMinimos;
                    
                    $scope.showProgress = false;
                    $scope.$apply(); 
                }
            })
        })
    }


    $scope.showProgress = true;
    $scope.salariosMinimos = []; 

    Meteor.call('nomina.parametros.salarioMinimo.leerDesdeSqlServer', (err, result) => { 

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
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: result.message,
            });
        
            $scope.showProgress = false;
            $scope.$apply(); 
        } else { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message,
            });
            
            $scope.salariosMinimos = JSON.parse(result.salariosMinimos); 
            
            // convertimos las fechas pues vienen como strings al ser serializadas 
            for (let item of $scope.salariosMinimos) { 
                item.desde = item.desde ? new Date(item.desde) : null;
            }
            
            $scope.items_ui_grid.data = $scope.salariosMinimos;
            
            $scope.showProgress = false;
            $scope.$apply(); 
        }
    })

}
])
