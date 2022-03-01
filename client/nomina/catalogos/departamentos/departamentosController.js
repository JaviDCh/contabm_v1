

import lodash from 'lodash'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Catalogos_Nomina_departamentos_Controller",
['$scope', '$meteor', function ($scope, $meteor) {

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
            return row.departamento;
        },

        getRowIdentity: function (row) {
            return row.departamento;
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
            name: 'departamento',
            field: 'departamento',
            displayName: '#',
            width: "60",
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
            width: "200",
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
            cellClass: 'ui-grid-centerCell',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]


    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1) {
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.departamentos, (x) => { return x.departamento === item.departamento; });
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
        let ultimo = lodash.maxBy($scope.departamentos, 'departamento'); 
        let proximoID = 0; 

        if (!ultimo) { 
            proximoID = 1; 
        } else { 
            proximoID = ultimo.departamento + 1; 
        }

        let item = {
            _id: new Mongo.ObjectID()._str,
            departamento: proximoID,
            docState: 1
        };

        $scope.departamentos.push(item);
    }


    $scope.save = function () {

        $scope.showProgress = true;

        let editedItems = lodash.filter($scope.departamentos, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = Departamentos.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Departamentos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${Departamentos.simpleSchema().label(error.name)}</b></em>; error de tipo '${error.type}'.`);
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

        Meteor.call('nomina.catalogos.departamentos.save', editedItems, (err, saveMethodResult) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.items_ui_grid.data = $scope.departamentos;

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // refrescamos el helper ... 
            // nótese que la tabla se publica en forma automática, sin necesidad de hacer un subscribe ... 
            $scope.helpers({
                departamentos: () => {
                    return Departamentos.find({}, { sort: { departamento: 1 } });
                }
            })

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
            });

            $scope.items_ui_grid.data = $scope.departamentos;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    $scope.helpers({
        departamentos: () => {
        return Departamentos.find({}, { sort: { departamento: 1 } });
        }
    });

    $scope.items_ui_grid.data = $scope.departamentos;
}
]);
