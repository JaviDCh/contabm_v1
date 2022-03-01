

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_FiltrosConsultasContab_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = true;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      $scope.companiaSeleccionada = {};

      if (companiaSeleccionada)
          $scope.companiaSeleccionada = Companias.findOne(companiaSeleccionada.companiaID);
      // ------------------------------------------------------------------------------------------------

      // preparamos una lista de usuarios, adecuada para que la use el ddl en el ui-grid
      $scope.helpers({
          usuarios: () => {
            return Meteor.users.find();
          },
          filtros: () => {
            return FiltrosConsultasContab.find();
          }
      });




      let filtros_ui_grid_api = null;
      let filtroSeleccionada = {};

      $scope.filtros_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              filtros_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  filtroSeleccionada = {};

                  if (row.isSelected) {
                      filtroSeleccionada = row.entity;
                  }
                  else
                      return;
              });

              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue) {
                      if (!rowEntity.docState) {
                          rowEntity.docState = 2;
                      };
                  };
              });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };

      $scope.filtros_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
        //   {
        //       name: 'usuario',
        //       field: 'usuario',
        //       displayName: 'Usuario',
        //       width: 250,
        //       headerCellClass: 'ui-grid-leftCell',
        //       cellClass: 'ui-grid-leftCell',
        //       enableColumnMenu: false,
        //       enableCellEdit: true,
        //       enableSorting: true,
        //       type: 'string'
        //   },
          {
              name: 'usuario',
              field: 'usuario',
              displayName: 'Usuario',
              width: 250,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'userNameOrEmailFilter',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'email',
              editDropdownOptionsArray: [],

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'filtro',
              field: 'filtro',
              displayName: 'Filtro',
              width: 500,
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
      ];


      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.filtros, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevo = function () {
          let filtro = {
              _id: new Mongo.ObjectID()._str,
              cia: $scope.companiaSeleccionada.numero,
              docState: 1
          };

          $scope.filtros.push(filtro);

          $scope.filtros_ui_grid.data = [];
          if (_.isArray($scope.filtros))
             $scope.filtros_ui_grid.data = $scope.filtros;
      };


      let usersSubscriptionHandle = null;
      let filtrosSubscriptioHandle = null;

      usersSubscriptionHandle = Meteor.subscribe("meteorUsers", {
          onReady: function () {
              filtrosSubscriptioHandle = Meteor.subscribe("contab.filtrosConsultaContab", $scope.companiaSeleccionada.numero, {
                  onReady: function () {

                      // preparamos una lista que sea más fácil de usar para el ddl del ui-grid
                      let usersList = [];
                      Meteor.users.find().forEach((u) => {
                          usersList.push({ id: u._id, email: u.emails[0].address });
                      });

                      // ahora asociamos la lista anteior al cell específico en el ui-grid ...
                      $scope.filtros_ui_grid.columnDefs[1].editDropdownOptionsArray = usersList;

                      $scope.showProgress = false;
                      $scope.$apply();
                  },
                });
          },
        });


        $scope.save = function () {
            $scope.showProgress = true;

            // eliminamos los items eliminados; del $scope y del collection
            let editedItems = _.filter($scope.filtros, function (item) { return item.docState; });

            // nótese como validamos cada item antes de intentar guardar en el servidor

            let isValid = false;
            let errores = [];

            editedItems.forEach((item) => {
                if (item.docState != 3) {
                    isValid = FiltrosConsultasContab.simpleSchema().namedContext().validate(item);

                    if (!isValid) {
                        FiltrosConsultasContab.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                            errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + FiltrosConsultasContab.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                        });
                    }
                }
            });

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
            };


            // eliminamos la conexión entre angular y meteor
            // $scope.asegurados.stop();
            // $scope.asegurados.length = 0;

            $meteor.call('contab.filtrosConsultaSave', editedItems).then(
              function (data) {

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data
                  });

                  // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                  // se queda el '*' para registros nuevos en el ui-grid ...
                  $scope.filtros = [];
                  $scope.filtros_ui_grid.data = [];

                  filtrosSubscriptioHandle = Meteor.subscribe("contab.filtrosConsultaContab", $scope.companiaSeleccionada.numero, {
                      onReady: function () {
                          $scope.helpers({
                              filtros: () => {
                                return FiltrosConsultasContab.find();
                              }
                          });
                          $scope.filtros_ui_grid.data = $scope.filtros;

                          $scope.showProgress = false;
                          $scope.$apply();
                      },
                    });
              },
              function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: errorMessage
                  });

                  $scope.showProgress = false;
              });
          };

      $scope.filtros_ui_grid.data = $scope.filtros;

      // detenemos los publishers cuando el usuario deja la página
      $scope.$on("$destroy", () => {
          if (usersSubscriptionHandle && usersSubscriptionHandle.stop) {
              usersSubscriptionHandle.stop();
          };
          if (filtrosSubscriptioHandle && filtrosSubscriptioHandle.stop) {
              filtrosSubscriptioHandle.stop();
          };
      });
}
]);
