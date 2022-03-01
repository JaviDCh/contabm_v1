


import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { mensajeErrorDesdeMethod_preparar } from '../../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { nomina_deduccionesNomina_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.deduccionesNomina'; 

import { Companias } from '../../../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../../../imports/collections/companiaSeleccionada';

import { GruposEmpleados } from '../../../../../../models/nomina/catalogos'; 
import { Empleados } from '../../../../../../models/nomina/empleados'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.nomina.catalogos").controller("catalogos_nomina_parametros_deduccionesNomina_Controller",
['$scope', function ($scope) {

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
        gruposEmpleados: () => { 
            return GruposEmpleados.find({ 
                cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999, 
                grupoNominaFlag: false, 
            }); 
        },
        gruposNomina: () => { 
            return GruposEmpleados.find({ 
                cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999, 
                grupoNominaFlag: true, 
            }); 
        }, 
        empleados: () => { 
            return Empleados.find({ cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999 }, 
                                  { fields: { empleado: 1, alias: 1 }, sort: { alias: true, }} ); 
        }, 
        companias: () => { 
            return Companias.find({}, { fields: { numero: 1, abreviatura: 1, }})
        }
    })

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

    $scope.tipoDeduccionArray = [
        { id: "SSO", descripcion: "SSO" }, 
        { id: "LPH", descripcion: "LPH" }, 
        { id: "PF", descripcion: "PF" }, 
    ]


    $scope.topeBaseArray = [
        { id: "Monto", descripcion: "Monto" }, 
        { id: "SalMin", descripcion: "Salarios mínimos" }, 
    ]

    $scope.baseArray = [
        { id: "Sueldo", descripcion: "Sueldo" }, 
        { id: "Salario", descripcion: "Salario" }, 
        { id: "SalInt", descripcion: "Salario integral" }, 
    ]

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
            width: 40, 
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: 60, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.tipoDeduccionArray:"id":"descripcion"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.tipoDeduccionArray,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
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
            name: 'cia',
            field: 'cia',
            displayName: 'Cia Contab',
            width: 80, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.companias:"numero":"abreviatura"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'numero',
            editDropdownValueLabel: 'abreviatura',
            editDropdownOptionsArray: $scope.companias,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'grupoNomina',
            field: 'grupoNomina',
            displayName: 'Grupo de nómina',
            width: 120, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.gruposNomina:"grupo":"nombre"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'grupo',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.gruposNomina,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'grupoEmpleados',
            field: 'grupoEmpleados',
            displayName: 'Grupo de empleados',
            width: 120, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.gruposEmpleados:"grupo":"nombre"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'grupo',
            editDropdownValueLabel: 'nombre',
            editDropdownOptionsArray: $scope.gruposEmpleados,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'empleado',    
            field: 'empleado',
            displayName: 'Empleado',
            width: 120, 
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
            name: 'aporteEmpleado',
            field: 'aporteEmpleado',
            displayName: 'Aporte empl',
            width: 90, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'aporteEmpresa',
            field: 'aporteEmpresa',
            displayName: 'Aporte empr',
            width: 90, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'currencyFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'base',
            field: 'base',
            displayName: 'Base',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.baseArray:"id":"descripcion"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.baseArray,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'tope',
            field: 'tope',
            displayName: 'Tope',
            width: 65, 
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
            name: 'topeBase',
            field: 'topeBase',
            displayName: 'Base del tope',
            width: 100, 
            enableFiltering: false,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            cellFilter: 'mapDropdown:row.grid.appScope.topeBaseArray:"id":"descripcion"',
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.topeBaseArray,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'suspendidoFlag',
            field: 'suspendidoFlag',
            displayName: 'Susp',
            width: 50, 
            enableFiltering: false,
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
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.deduccionesNomina, (x:any) => { return x.id === item.id; });
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
        let ultimo : any | undefined = lodash.maxBy($scope.deduccionesNomina, 'id'); 
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
            suspendidoFlag: false, 
            docState: 1
        };

        $scope.deduccionesNomina.push(item);
        $scope.items_ui_grid.data = $scope.deduccionesNomina;
    }


    $scope.save = function() { 

        $scope.showProgress = true;
        
        let editedItems = lodash.filter($scope.deduccionesNomina, function (item:any) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = nomina_deduccionesNomina_schema.namedContext().validate(item);

                if (!isValid) {
                    nomina_deduccionesNomina_schema.namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${nomina_deduccionesNomina_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
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
        
        Meteor.call('nomina.parametros.deduccionesNomina.save', editedItems, (err, saveMethodResult) => {
            
            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.items_ui_grid.data = $scope.deduccionesNomina;
                
                $scope.showProgress = false;
                $scope.$apply();

                return; 
            }

            // luego de grabar, y si no se ha producido un error, leemos nuevamente los registros desde la base de datos 
            Meteor.call('nomina.parametros.deduccionesNomina.leerDesdeSqlServer', (err, result) => {

                if (err) { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
                
                    $scope.items_ui_grid.data = $scope.deduccionesNomina;

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

                    $scope.items_ui_grid.data = $scope.deduccionesNomina;
                
                    $scope.showProgress = false;
                    $scope.$apply(); 
                } else { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
                    });
                    
                    $scope.deduccionesNomina = []; 
                    $scope.deduccionesNomina = JSON.parse(result.deduccionesNomina); 
                    
                    // convertimos las fechas pues vienen como strings al ser serializadas 
                    for (let item of $scope.deduccionesNomina) { 
                        item.desde = item.desde ? new Date(item.desde) : null;
                    }
                    
                    $scope.items_ui_grid.data = $scope.deduccionesNomina;
                    
                    $scope.showProgress = false;
                    $scope.$apply(); 
                }
            })
        })
    }


    $scope.showProgress = true;
    $scope.deduccionesNomina = []; 

    Meteor.call('nomina.parametros.deduccionesNomina.leerDesdeSqlServer', (err, result) => { 

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
            
            $scope.deduccionesNomina = JSON.parse(result.deduccionesNomina); 
            
            // convertimos las fechas pues vienen como strings al ser serializadas 
            for (let item of $scope.deduccionesNomina) { 
                item.desde = item.desde ? new Date(item.desde) : null;
            }
            
            $scope.items_ui_grid.data = $scope.deduccionesNomina;

            Meteor.subscribe('nomina.gruposEmpleados', () => [],
            {
                onReady: function() {

                    $scope.helpers({ 
                        gruposEmpleados: () => { 
                            return GruposEmpleados.find({ 
                                cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999, 
                                grupoNominaFlag: false, 
                            }); 
                        },
                        gruposNomina: () => { 
                            return GruposEmpleados.find({ 
                                cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999, 
                                grupoNominaFlag: true, 
                            }); 
                        }, 
                    })

                    // cuando la tabla de grupos de empleados está en el cliente, establecemos el catálogo para el ddl en el ui-grid ... 
                    $scope.items_ui_grid.columnDefs[5].editDropdownOptionsArray =  $scope.gruposNomina; 
                    $scope.items_ui_grid.columnDefs[6].editDropdownOptionsArray =  $scope.gruposEmpleados; 

                    $scope.showProgress = false;
                    $scope.$apply();
                }
            })
        }
    })

}
])
