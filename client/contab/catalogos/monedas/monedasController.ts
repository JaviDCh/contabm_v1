
import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { Monedas } from '../../../../imports/collections/monedas';
import { mensajeErrorDesdeMethod_preparar } from '../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm.contab.catalogos").controller("Catalogos_Monedas_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.monedas_ui_grid = {

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
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      }


      $scope.monedas_ui_grid.columnDefs = [
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
              name: 'moneda',
              field: 'moneda',
              displayName: 'Número',
              width: "*",
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
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'simbolo',
              field: 'simbolo',
              displayName: 'Símbolo',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'nacionalFlag',
              field: 'nacionalFlag',
              displayName: 'Nacional',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'defaultFlag',
              field: 'defaultFlag',
              displayName: 'Default',
              width: "*",
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
              width: 25
          },
      ]

      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1) {
              // si el item es nuevo, simplemente lo eliminamos del array
              lodash.remove($scope.monedas, (x: any) => { return x._id === item._id; });
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
          let item = {
              _id: new Mongo.ObjectID()._str,
              moneda: 0,
              nacionalFlag: false,
              defaultFlag: false,
              docState: 1
          };

          $scope.monedas.push(item);

          $scope.monedas_ui_grid.data = [];
          if (lodash.isArray($scope.monedas)) {
              $scope.monedas_ui_grid.data = $scope.monedas;
          }
      }



      let monedasSubscriptionHandle: object = {};

      $scope.save = function () {
           $scope.showProgress = true;

           let editedItems = lodash.filter($scope.monedas, function (item:any) { return item.docState; });

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores: string[] = [];

           editedItems.forEach((item:any) => {
               if (item.docState != 3) {
                   isValid = Monedas.simpleSchema().namedContext().validate(item);

                   if (!isValid) {
                       Monedas.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                           errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + Monedas.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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

           Meteor.call('contab.monedasSave', editedItems, (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result
                });

                 // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                 // se queda el '*' para registros nuevos en el ui-grid ...
                 $scope.monedas = [];
                 $scope.monedas_ui_grid.data = [];

                 // NOTA: el publishing de este collection es 'automático'; muchos 'catálogos' se publican
                 // de forma automática para que estén siempre en el cliente ... sin embargo, para asegurarnos
                 // que la data está en el cliente y refrescar el ui-grid, suscribimos aquí a la tabla en
                 // mongo, pues de otra forma no sabríamos cuando la data está en el client
                 monedasSubscriptionHandle = Meteor.subscribe("monedas", {
                     onReady: function () {
                         $scope.helpers({
                             monedas: () => {
                               return Monedas.find({}, { sort: { descripcion: 1 } });
                             }
                         });

                         $scope.monedas_ui_grid.data = [];
                         $scope.monedas_ui_grid.data = $scope.monedas;

                         $scope.showProgress = false;
                         $scope.$apply();
                     },
                   })
             })
         }


      $scope.helpers({
          monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
          }
      });

      $scope.monedas_ui_grid.data = $scope.monedas;
}
]);
