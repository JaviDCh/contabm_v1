
import { Companias } from '/imports/collections/companias';﻿

angular.module("contabm").controller("UsuariosCompaniasController",
 ['$scope', '$stateParams', '$meteor', '$modal',
  function ($scope, $stateParams, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.helpers({
          companias: () => {
              return Companias.find({}, { sort: { nombre: true } });
          },

          users: () => {
              return Meteor.users.find({}, { sort: { 'emails.0.address': 1 } });
          },
      });

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
                  $scope.companiasPermitidasUsuarioSeleccionado = [];
                  $scope.usuariosCompanias_ui_grid.data = [];

                  if (row.isSelected) {
                        usuarioSeleccionado = row.entity;

                        if (_.isArray(usuarioSeleccionado.companiasPermitidas)) {
                            // agregamos los roles del usuario seleccionado al array intermedio para el 2do grid
                            usuarioSeleccionado.companiasPermitidas.forEach(companiaID => {
                                $scope.companiasPermitidasUsuarioSeleccionado.push({ companiaID: companiaID });
                            });
                        };

                        $scope.usuariosCompanias_ui_grid.data = $scope.companiasPermitidasUsuarioSeleccionado;
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


      $scope.usuariosCompanias_ui_grid = {

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


      $scope.usuariosCompanias_ui_grid.columnDefs = [
              {
                  name: 'companiaID',
                  field: 'companiaID',
                  displayName: 'Compañía',
                  width: 250,
                  cellFilter: 'companiaNombreFilter',
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
                  cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
                  enableCellEdit: false,
                  enableSorting: false,
                  width: 25
              }
      ];

      $scope.deleteItem = function (item) {
        //   debugger;
          if (usuarioSeleccionado) {
              _.remove(usuarioSeleccionado.companiasPermitidas, c => { return c === item.companiaID; });
              _.remove($scope.companiasPermitidasUsuarioSeleccionado, c => { return c.companiaID === item.companiaID; });

              if (!usuarioSeleccionado.docState)
                  usuarioSeleccionado.docState = 2;
          };
      };


      let companiaSeleccionada = {};
      let companias_ui_grid_gridApi;

      $scope.companias_ui_grid = {

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

              companias_ui_grid_gridApi = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {

                    companiaSeleccionada = {};

                    if (row.isSelected) {
                        companiaSeleccionada = row.entity;

                        // agregamos (si no existe!) la compañía seleccionada al array de compañías permitidas para el usuario seleccionado
                        if (usuarioSeleccionado && !_.isEmpty(usuarioSeleccionado)) {
                            if (!_.isArray(usuarioSeleccionado.companiasPermitidas))
                                usuarioSeleccionado.companiasPermitidas = [];

                            // la compañía pudo haber sido agregada antes; de ser así, no hacemos nada ...
                            if (!_.some(usuarioSeleccionado.companiasPermitidas, item => { return item === companiaSeleccionada._id; })) {
                                usuarioSeleccionado.companiasPermitidas.push(companiaSeleccionada._id);
                                $scope.companiasPermitidasUsuarioSeleccionado.push({ companiaID: companiaSeleccionada._id });

                                if (!usuarioSeleccionado.docState)
                                    usuarioSeleccionado.docState = 2;

                                $scope.usuariosCompanias_ui_grid.data = $scope.companiasPermitidasUsuarioSeleccionado;
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


      $scope.companias_ui_grid.columnDefs = [
              {
                  name: 'nombre',
                  field: 'nombre',
                  displayName: 'Compañía',
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

          $scope.showProgress = true;

          // eliminamos los items eliminados; del $scope y del collection
          let editedItems = _.cloneDeep(_.filter($scope.users, function (item) { return item.docState; }));

          // nótese como validamos cada item antes de intentar guardar en el servidor

          let isValid = false;
          let errores = [];

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

          // por algna razón, cuando agregamos un item al scope y luego a mongo, el item en $scope no se 'sincroniza' en forma
          // adecuada; por eso, lo eliminamos. Luego, con reactivity, será mostrado, nuevamente, en el view ...
          _.remove($scope.users, (x) => { return x.docState && x.docState === 1; });

          $meteor.call('usuariosRolesSave', editedItems).then(
              function (data) {

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data
                  });

                  // analisisContable_ui_grid_api.core.notifyDataChange(uiGridConstants.dataChange.ALL);
                  $scope.usuariosCompanias_ui_grid.data = [];
                  $scope.showProgress = false;
              },
              function (err) {

                  let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.<br />";
                  if (err.errorType)
                  errorMessage += err.errorType + " ";

                  if (err.message)
                  errorMessage += err.message + " ";

                  if (err.reason)
                  errorMessage += err.reason + " ";

                  if (err.details)
                  errorMessage += "<br />" + err.details;

                  if (!err.message && !err.reason && !err.details)
                  errorMessage += err.toString();

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: errorMessage
                  });

                  // hubo un error; antes de hacer el save eliminamos en $scope los items nuevos (docState == 1). Los recuperamos ...
                  _.filter(editedItems, (item) => { return item.docState && item.docState === 1; }).forEach((item) => {
                      $scope.users.push(item);
                  });

                  $scope.showProgress = false;
              });
      };

    //   $scope.usersArray = [];
      $scope.showProgress = true;

      Meteor.subscribe("allUsers", () => [],
      {
            onReady: function() {
                $scope.showProgress = false;
                $scope.$apply();
            }
      });

      // las compañías, como todos los catálogos, siempre existe en el cliente
      $scope.usuarios_ui_grid.data = $scope.users;
      $scope.companias_ui_grid.data = $scope.companias;
      //
    //   $scope.companiasPermitidasUsuarioSeleccionado = [];
    //   $scope.usuariosCompanias_ui_grid.data = $scope.companiasPermitidasUsuarioSeleccionado;

      $scope.usuariosEditados = function() {
          return _.some($scope.users, u => { return u.docState; });
      };
  }
]);
