

import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { CompaniaSeleccionada } from '../../../../../imports/collections/companiaSeleccionada';
import { Companias } from '../../../../../imports/collections/companias';

import { CajaChica_CajasChicas_SimpleSchema } from '../../../../../imports/collections/bancos/cajaChica.cajasChicas'; 
import { mensajeErrorDesdeMethod_preparar } from '../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm.contab.catalogos").controller("Catalogos_Bancos_CajaChica_CajasChicas_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let ciaContab = {} as any;

    if (companiaSeleccionada) { 
        ciaContab = Companias.findOne(companiaSeleccionada.companiaID);
    }
        
    $scope.companiaSeleccionada = {};
    let numeroCiaContabSeleccionada = -9999;

    if (ciaContab) {
        $scope.companiaSeleccionada = ciaContab;
        numeroCiaContabSeleccionada = ciaContab.numero;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    let ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.items_ui_grid = {

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
            return row.cajaChica;
        },

        getRowIdentity: function (row) {
            return row.cajaChica;
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
            name: 'cajaChica',
            field: 'cajaChica',
            displayName: '##',
            width: 80,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 180,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
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
            lodash.remove($scope.cajaChica_cajasChicas, (x: any) => { return x.cajaChica === item.cajaChica; });
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
        if (Array.isArray($scope.cajaChica_cajasChicas) && $scope.cajaChica_cajasChicas.length) { 
            id = lodash.maxBy($scope.cajaChica_cajasChicas, "cajaChica"); 
        }

        let item = {
            cajaChica: id && lodash.isFinite(id.cajaChica) ? id.cajaChica + 1 : 0,       // isFiniite is true even if the argument is zero  ,
            ciaContab: $scope.companiaSeleccionada.numero, 
            docState: 1
        };

        $scope.cajaChica_cajasChicas.push(item);

        $scope.items_ui_grid.data = [];
        if (lodash.isArray($scope.cajaChica_cajasChicas)) {
            $scope.items_ui_grid.data = $scope.cajaChica_cajasChicas;
        }
    }

    $scope.save = function () {
        $scope.showProgress = true;

        let editedItems = lodash.filter($scope.cajaChica_cajasChicas, function (item: any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        editedItems.forEach((item:any) => {
            if (item.docState != 3) {
                isValid = CajaChica_CajasChicas_SimpleSchema.namedContext().validate(item);

                if (!isValid) {
                    CajaChica_CajasChicas_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CajaChica_CajasChicas_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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
        Meteor.call('bancos.cajaChica.catalogos.cajasChicas.save', editedItems, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.cajaChica_cajasChicas = [];
                leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                    (result: any) => { 
                        $scope.cajaChica_cajasChicas = JSON.parse(result);
                        $scope.items_ui_grid.data = $scope.cajaChica_cajasChicas;
                
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

            $scope.cajaChica_cajasChicas = [];
            leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                (result: any) => { 
                    $scope.cajaChica_cajasChicas = JSON.parse(result);
                    $scope.items_ui_grid.data = $scope.cajaChica_cajasChicas;
            
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
    leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
        (result: any) => { 
            $scope.cajaChica_cajasChicas = JSON.parse(result);
            $scope.items_ui_grid.data = $scope.cajaChica_cajasChicas;
    
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


function leerItemsDesdeSqlServer(ciaContabID) { 
    return new Promise((resolve, reject) => { 
        Meteor.call('bancos.cajaChica.catalogos.cajasChicas.LeerDesdeSql', ciaContabID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            resolve(result); 
        })
    })
}