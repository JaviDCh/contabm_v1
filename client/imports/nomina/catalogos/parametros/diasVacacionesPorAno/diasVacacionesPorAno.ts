


import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { mensajeErrorDesdeMethod_preparar } from '../../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { DialogModal } from '../../../../../generales/angularGenericModal'; 

import { vacacPorAnoGenericas_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.cantidadDiasVacacionesPorAno'; 
import { vacacPorAnoParticulares_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.cantidadDiasVacacionesPorAno';

import { Companias } from '../../../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../../../imports/collections/companiaSeleccionada';

import { Empleados } from '../../../../../../models/nomina/empleados'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.nomina.catalogos").controller("catalogos_nomina_parametros_diasVacacionesPorAno_Controller",
['$scope', '$modal', function ($scope, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada: any = null;
    let ciaContabSeleccionada: any = null;

    if (Meteor.userId()) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    $scope.helpers({ 
        empleados: () => { 
            return Empleados.find({ cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999 }, 
                                  { fields: { empleado: 1, alias: 1 }, sort: { alias: true, }} ); 
        }, 
    })

    let vacacionesPorAno_genericos_ui_grid_api: any = null;
    let vacacionesPorAno_genericos_itemSeleccionado: any = null; 

    $scope.vacacionesPorAno_genericos_ui_grid = {

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

            vacacionesPorAno_genericos_ui_grid_api = gridApi;
            
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                vacacionesPorAno_genericos_itemSeleccionado = null;

                // los items en la 2da. lista siempre está asociados a items en la 1ra. 
                $scope.definicionAnticiposEmpleados_ui_grid.data = []; 

                if (row.isSelected) {
                    vacacionesPorAno_genericos_itemSeleccionado = row.entity;
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
            return row.claveUnica;
        },
        getRowIdentity: function (row) {
            return row.claveUnica;
        }
    }

    $scope.vacacionesPorAno_genericos_ui_grid.columnDefs = [
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
            name: 'claveUnica',
            field: 'claveUnica',
            displayName: 'id',
            width: 40, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: 50, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'dias',
            field: 'dias',
            displayName: 'Cant días',
            width: 80, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'diasAdicionales',
            field: 'diasAdicionales',
            displayName: 'Cant días adicionales',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'diasBono',
            field: 'diasBono',
            displayName: 'Cant días bono',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItemGenerales(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]

    
    $scope.deleteItemGenerales = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.vacacionesPorAno_genericos, (x:any) => { return x.claveUnica === item.claveUnica; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevoGenerales = function () {

        // obtenemos el último de los elementos en la lista 
        let ultimo : any | undefined = lodash.maxBy($scope.vacacionesPorAno_genericos, 'claveUnica'); 
        let proximoID: number = 0; 

        if (!ultimo) { 
            proximoID = 1; 
        } else { 
            proximoID = ultimo.claveUnica + 1; 
        }

        let item = {
            claveUnica: proximoID,
            docState: 1
        };

        $scope.vacacionesPorAno_genericos.push(item);
        $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
    }


    let vacacionesPorAno_empleado_ui_grid_api: any = null;
    let vacacionesPorAno_empleado_itemSeleccionado: any = null; 

    $scope.vacacionesPorAno_empleado_ui_grid = {

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

            vacacionesPorAno_empleado_ui_grid_api = gridApi;
            
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                vacacionesPorAno_empleado_itemSeleccionado = null;
                if (row.isSelected) {
                    vacacionesPorAno_empleado_itemSeleccionado = row.entity;
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
            return row.claveUnica;
        },
        getRowIdentity: function (row) {
            return row.claveUnica;
        }
    }


    $scope.vacacionesPorAno_empleado_ui_grid.columnDefs = [
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
            name: 'claveUnica',
            field: 'claveUnica',
            displayName: 'id',
            width: 40, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'empleado',    
            field: 'empleado',
            displayName: 'Empleado',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.empleados:"empleado":"alias"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'empleado',
            editDropdownValueLabel: 'alias',
            editDropdownOptionsArray: $scope.empleados,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'ano',
            field: 'ano',
            displayName: 'Año',
            width: 50, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'dias',
            field: 'dias',
            displayName: 'Cant días',
            width: 80, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'diasAdicionales',
            field: 'diasAdicionales',
            displayName: 'Cant días adicionales',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'diasBono',
            field: 'diasBono',
            displayName: 'Cant días bono',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItemEmpleado(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        }
    ]


    $scope.deleteItemEmpleado = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.vacacionesPorAno_empleado, (x:any) => { return x.claveUnica === item.claveUnica; });
        }
        else if (item.docState && item.docState === 3) {
            // permitimos hacer un 'undelete' de un item que antes se había eliminado en la lista (antes de grabar) ...
            delete item.docState;
        }
        else {
            item.docState = 3;
        }
    }

    $scope.nuevoEmpleado = function () {

        // obtenemos el último de los elementos en la lista 
        let ultimo : any | undefined = lodash.maxBy($scope.vacacionesPorAno_empleado, 'claveUnica'); 
        let proximoID: number = 0; 

        if (!ultimo) { 
            proximoID = 1; 
        } else { 
            proximoID = ultimo.claveUnica + 1; 
        }

        let item = {
            // "new Mongo.ObjectID()._str" produce un error en TS (no está en la definición?),
            claveUnica: proximoID,
            docState: 1
        };

        $scope.vacacionesPorAno_empleado.push(item);
        $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;
    }


    $scope.save = () => { 

        $scope.showProgress = true;
        
        //----------------------------------------------------------
        // validamos los items en la 1ra lista ... 
        let editedItems = lodash.filter($scope.vacacionesPorAno_genericos, function (item:any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = vacacPorAnoGenericas_schema.namedContext().validate(item);

                if (!isValid) {
                    vacacPorAnoGenericas_schema.namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${vacacPorAnoGenericas_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
                    });
                }
            }
        })

        //----------------------------------------------------------
        // validamos los items en la 2a lista ... 
        let editedItems2 = lodash.filter($scope.vacacionesPorAno_empleado, function (item:any) { return item.docState; });
        
        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        isValid = false;

        editedItems2.forEach((item) => {
            if (item.docState != 3) {
                isValid = vacacPorAnoParticulares_schema.namedContext().validate(item);

                if (!isValid) {
                    vacacPorAnoParticulares_schema.namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${vacacPorAnoParticulares_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
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

        $scope.vacacionesPorAno_genericos_ui_grid.data = []; 
        $scope.vacacionesPorAno_empleado_ui_grid.data = []; 

        Meteor.call('nomina.parametros.cantidadDiasVacacionesPorAno.save', editedItems, editedItems2, (err, saveMethodResult) => {
            
            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
                $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;
                
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            }

            // luego de grabar, y si no se ha producido un error, leemos nuevamente los registros desde la base de datos 
            Meteor.call('nomina.parametros.vacacionesPorAno.leerDesdeSqlServer', (err, result) => {

                if (err) { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
                
                    $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
                    $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;

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

                    $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
                    $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;
                
                    $scope.showProgress = false;
                    $scope.$apply(); 
                } else { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
                    });
                    
                    $scope.vacacionesPorAno_genericos = []; 
                    $scope.vacacionesPorAno_empleado = []; 

                    $scope.vacacionesPorAno_genericos = JSON.parse(result.vacacionesPorAno_genericos);
                    $scope.vacacionesPorAno_empleado = JSON.parse(result.vacacionesPorAno_empleado); 
                    
                    $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
                    $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;
                    
                    $scope.showProgress = false;
                    $scope.$apply(); 
                }
            })
        })
    }



    $scope.showProgress = true;
    $scope.vacacionesPorAno_genericos = []; 
    $scope.vacacionesPorAno_empleado = []; 

    Meteor.call('nomina.parametros.vacacionesPorAno.leerDesdeSqlServer', (err, result) => { 

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
            
            $scope.vacacionesPorAno_genericos = JSON.parse(result.vacacionesPorAno_genericos);
            $scope.vacacionesPorAno_empleado = JSON.parse(result.vacacionesPorAno_empleado); 
            
            $scope.vacacionesPorAno_genericos_ui_grid.data = $scope.vacacionesPorAno_genericos;
            $scope.vacacionesPorAno_empleado_ui_grid.data = $scope.vacacionesPorAno_empleado;

            $scope.showProgress = false;
            $scope.$apply();
        }
    })

}
])
