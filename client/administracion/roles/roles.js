

angular.module("contabm").controller("RolesController",
 ['$scope', '$stateParams', '$meteor',
  function ($scope, $stateParams, $meteor) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.roles_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              // marcamos el contrato como actualizado cuando el usuario edita un valor
              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue)
                      if (!rowEntity.docState)
                          rowEntity.docState = 2;
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


      $scope.roles_ui_grid.columnDefs = [
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
              {
                  name: 'name',
                  field: 'name',
                  displayName: 'Rol',
                  width: 250,
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
              }
      ];

      $scope.deleteItem = function (item) {
          item.docState = 3;
      };

      $scope.nuevo = function () {
          $scope.roles.push({
              _id: new Mongo.ObjectID()._str,
              docState: 1
          });
      };

      $scope.save = function () {
          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          let editedItems = _.filter($scope.roles, (item) => { return item.docState; });

          // nótese como validamos cada item antes de intentar guardar en el servidor

          let isValid = false;
          let errores = [];

          $scope.roles.length = 0;

          $meteor.call('rolesSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                $scope.helpers({
                    roles: () => {
                        return Meteor.roles.find({}, { sort: { name: 1 } });
                    },
                });

                $scope.roles_ui_grid.data = $scope.roles;
                $scope.showProgress = false;
            },
            function (err) {

                let errorMessage = err.message ? err.message : err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.helpers({
                    roles: () => {
                        return Meteor.roles.find({}, { sort: { name: 1 } });
                    },
                });

                $scope.roles_ui_grid.data = $scope.roles;
                $scope.showProgress = false;
            });
      };

      $scope.helpers({
          roles: () => {
              return Meteor.roles.find({}, { sort: { name: 1 } });
          },
      });

      $scope.roles_ui_grid.data = $scope.roles;
  }
]);
