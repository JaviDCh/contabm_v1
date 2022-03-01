
import { DialogModal } from '/client/generales/angularGenericModal'; 

angular.module("contabm").controller("UsuariosRolesController",
 ['$scope', '$stateParams', '$meteor', '$modal',
  function ($scope, $stateParams, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let usuarioSeleccionado = {};

      $scope.usuarios_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: false,
          enableRowSelection: true,
          enableRowHeaderSelection: true,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                  usuarioSeleccionado = {};
                  $scope.rolesUsuarioSeleccionado = [];
                  $scope.usuariosRoles_ui_grid.data = [];

                  if (row.isSelected) {
                        usuarioSeleccionado = row.entity;

                        if (_.isArray(usuarioSeleccionado.roles)) {
                            // agregamos los roles del usuario seleccionado al array intermedio para el 2do grid
                            usuarioSeleccionado.roles.forEach(rol => {
                                $scope.rolesUsuarioSeleccionado.push({ name: rol });
                            });
                        };

                        $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado
                    }
                    else
                        return;
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


      $scope.usuarios_ui_grid.columnDefs = [
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
                  name: '_id',
                  field: '_id',
                  displayName: 'Usuario',
                  cellFilter: 'userNameOrEmailFilter',
                  width: 250,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'string'
              }
      ];


      $scope.usuariosRoles_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        //   rowIdentity: function (row) {
        //       return row._id;
        //   },
        //   getRowIdentity: function (row) {
        //       return row._id;
        //   }
      };


      $scope.usuariosRoles_ui_grid.columnDefs = [
              {
                  name: 'name',
                  field: 'name',
                  displayName: 'Rol',
                  width: 200,
                  headerCellClass: 'ui-grid-leftCell',
                  cellClass: 'ui-grid-leftCell',
                  enableColumnMenu: false,
                  enableCellEdit: false,
                  enableSorting: true,
                  type: 'string'
              },
              {
                  name: 'delButton',
                  displayName: '',
                  cellTemplate: '<span ng-click="grid.appScope.deleteUserRol(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                  enableCellEdit: false,
                  enableSorting: false,
                  width: 25
              }
      ];

      $scope.deleteUserRol = function (item) {

          if (usuarioSeleccionado) {
              _.remove(usuarioSeleccionado.roles, r => { return r === item.name; });
              _.remove($scope.rolesUsuarioSeleccionado, r => { return r === item; });

              if (!usuarioSeleccionado.docState)
                  usuarioSeleccionado.docState = 2;
          };
      };


      let selectedRol = [];
      let roles_ui_grid_gridApi;

      $scope.roles_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: false,
          enableRowSelection: true,
          enableRowHeaderSelection: true,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              roles_ui_grid_gridApi = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                    selectedRol = {};

                    if (row.isSelected) {
                        selectedRol = row.entity;

                        // agregamos (si no existe!) el rol seleccionado al array de roles del usuario
                        if (!_.isEmpty(usuarioSeleccionado)) {
                            if (!_.isArray(usuarioSeleccionado.roles))
                                usuarioSeleccionado.roles = [];

                            // el rol puede ya existir ...
                            if (!_.some(usuarioSeleccionado.roles, rol => { return rol === selectedRol.name; })) {
                                usuarioSeleccionado.roles.push(selectedRol.name);
                                $scope.rolesUsuarioSeleccionado.push({ name: selectedRol.name });

                                if (!usuarioSeleccionado.docState)
                                    usuarioSeleccionado.docState = 2;

                                $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;
                            };
                        }
                    }
                    else
                        return;
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
              }
      ];


      $scope.grabar = function () {

          // antes que nada, revisamos que haya algo que grabar
            if (!_.some($scope.users, u => { return u.docState; })) {
                DialogModal($modal, "<em>Roles de usuarios</em>", "Aparentemente, <em>no se han efectuado cambios</em> en los datos. " +
                                    "No hay nada que grabar.", false).then();
                return;
            };

          $scope.showProgress = true;

          var editedItems = _.filter($scope.users, function (item) { return item.docState; });

          $scope.users.length = 0;

          $meteor.call('usuariosRolesSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                $meteor.subscribe("allUsers").then(
                    function(subscriptionHandle) {

                        $scope.helpers({
                            users: () => {
                                return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
                            },
                        });

                        // al volver a hacer el binding en los ui-grids, se eliminan cualquier selección que exista en algunos rows ...
                        $scope.usuarios_ui_grid.data = $scope.users;
                        $scope.showProgress = false;

                        $scope.rolesUsuarioSeleccionado = [];
                        $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;

                        // para deseleccionar los rows que puedan estarlo ...
                        roles_ui_grid_gridApi.grid.selection.selectedCount = 0;
                        roles_ui_grid_gridApi.grid.selection.selectAll = false;
                    },
                    function() {
                    }
                );
            },
            function (err) {

                var errorMessage = err.message ? err.message : err.toString();

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.helpers({
                    users: () => {
                        return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
                    },
                });

                // al volver a hacer el binding en los ui-grids, se eliminan cualquier selección que exista en algunos rows ...
                $scope.usuarios_ui_grid.data = $scope.users;

                $scope.showProgress = false;
            });
      };

    //   $scope.usersArray = [];
      $scope.showProgress = true;

      $meteor.subscribe("allUsers").then(
          function(subscriptionHandle) {
              $scope.helpers({
                  users: () => {
                      return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
                  },
              });

              $scope.usuarios_ui_grid.data = $scope.users;

              $scope.showProgress = false;
          },
          function() {
          }
      );



      // Meteor.roles siempre existe en el cliente
      $scope.helpers({
          roles: () => {
              return Meteor.roles.find({}, { sort: { name: 1 } });
          },
      });

      $scope.roles_ui_grid.data = $scope.roles;

      $scope.rolesUsuarioSeleccionado = [];
      $scope.usuariosRoles_ui_grid.data = $scope.rolesUsuarioSeleccionado;

      $scope.usuariosEditados = function() {
          return _.some($scope.users, u => { return u.docState; });
      };
  }
]);
