
import moment from 'moment'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Catalogos_Nomina_DiasFeriados_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // para reportar el progreso de la tarea en la página
      $scope.processProgress = {
          current: 0,
          max: 0,
          progress: 0
      };

      $scope.diasFeriadosTipoList = [
          { tipo: 0, descripcion: "Sábado" },
          { tipo: 1, descripcion: "Domingo" },
          { tipo: 2, descripcion: "Feriado" },
          { tipo: 3, descripcion: "Fiesta nacional" },
          { tipo: 4, descripcion: "Bancario" },
      ];

      $scope.diasFiestaNacionalTipoList = [
          { tipo: "FER", descripcion: "Feriado" },
          { tipo: "BANC", descripcion: "Bancario" },
      ];


      $scope.AgregarDiasFeriadosParaUnAno = function() {

          var modalInstance = $modal.open({
              templateUrl: 'client/nomina/catalogos/diasFeriados/diasFeriadosAgregarAno_Modal.html',
              controller: 'DiasFeriadosAgregarAno_Modal_Controller',
              size: 'md',
              resolve: {
                  diasFeriados: () => {
                      return $scope.diasFeriados;
                  },
                  diasFiestaNacional: () => {
                      return $scope.diasFiestaNacional;
                  },
              },
          }).result.then(
                function (resolve) {
                    return true;
                },
                function (cancel) {
                    return true;
                });
      }


      let diasFeriados_ui_grid_api = null;
      let diaFeriadoSeleccionado = {};

      $scope.diasFeriados_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
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

              diasFeriados_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  diaFeriadoSeleccionado = {};
                  if (row.isSelected) {
                      diaFeriadoSeleccionado = row.entity;
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

      $scope.diasFeriados_ui_grid.columnDefs = [
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
              name: 'fecha',
              field: 'fecha',
              displayName: 'Fecha',
              width: '120',
              enableFiltering: false,
              cellFilter: 'dateFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              enableCellEdit: true,
              type: 'date'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 120,
              enableFiltering: false,
              cellFilter: 'mapDropdown:row.grid.appScope.diasFeriadosTipoList:"tipo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'tipo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.diasFeriadosTipoList,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteDiaFeriado(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];


      $scope.deleteDiaFeriado = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.diasFeriados, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevoDiaFeriado = function () {
          let item = {
              _id: new Mongo.ObjectID()._str,
              claveUnica: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
              fecha: new Date(),
              tipo: 3,                  // fiesta nacional
              docState: 1
          };

          $scope.diasFeriados.push(item);

          $scope.diasFeriados_ui_grid.data = [];
          $scope.diasFeriados_ui_grid.data = $scope.diasFeriados;
      };


      let diasFiestaNacional_ui_grid_api = null;
      let diaFiestaNacionalSeleccionado = {};

      $scope.diasFiestaNacional_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
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

              diasFiestaNacional_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  diaFiestaNacionalSeleccionado = {};
                  if (row.isSelected) {
                      diaFiestaNacionalSeleccionado = row.entity;
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

      $scope.diasFiestaNacional_ui_grid.columnDefs = [
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
              name: 'fecha',
              field: 'fecha',
              displayName: 'Fecha',
              width: '120',
              enableFiltering: false,
              cellFilter: 'dateFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              enableCellEdit: true,
              type: 'date'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: 120,
              enableFiltering: false,
              cellFilter: 'mapDropdown:row.grid.appScope.diasFiestaNacionalTipoList:"tipo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'tipo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.diasFiestaNacionalTipoList,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteDiaFiestaNacional(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];


      $scope.deleteDiaFiestaNacional = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.diasFiestaNacional, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      };

      $scope.nuevoDiaFiestaNacional = function () {
          let item = {
              _id: new Mongo.ObjectID()._str,
              claveUnica: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
              fecha: new Date(),
              tipo: "FER", 
              docState: 1
          };

          $scope.diasFiestaNacional.push(item);

          $scope.diasFiestaNacional_ui_grid.data = [];
          $scope.diasFiestaNacional_ui_grid.data = $scope.diasFiestaNacional;
      };


      $scope.showProgress = true;

      $scope.diasFeriados = [];
      $scope.diasFiestaNacional = [];

      $scope.diasFeriados_ui_grid.data = [];
      $scope.diasFiestaNacional_ui_grid.data = [];

      function leerRegistrosDesdeElServidor() {
          Meteor.call('nomina_diasFeriados_LeerDesdeSql', (err, result) => {

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
              };

              $scope.diasFeriados = JSON.parse(result.diasFeriados);
              $scope.diasFiestaNacional = JSON.parse(result.diasFiestaNacional);

              // el date al ser serializado se convierte en string ...
              $scope.diasFeriados.forEach((x) => {
                  x.fecha = moment(x.fecha).toDate();
              })

              // el date al ser serializado se convierte en string ...
              $scope.diasFiestaNacional.forEach((x) => {
                  x.fecha = moment(x.fecha).toDate();
              })

              $scope.diasFeriados_ui_grid.data = $scope.diasFeriados;
              $scope.diasFiestaNacional_ui_grid.data = $scope.diasFiestaNacional;

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: result.message,
              });

              $scope.showProgress = false;
              $scope.$apply();
          });
      }

      leerRegistrosDesdeElServidor();


      $scope.saveDiasFiestaNacional = function () {
           $scope.showProgress = true;

           // eliminamos los items eliminados; del $scope y del collection
           let editedItems = _.filter($scope.diasFiestaNacional, function (item) { return item.docState; });

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores = [];

           // nótese como validamos contra un mondelo 'temp...', pues los registros no están realmente en mongo,
           // solo se copian cuando el usuario filtra en la página para consultar o editar
           editedItems.forEach((item) => {
               if (item.docState != 3) {
                   isValid = DiasFiestaNacional.simpleSchema().namedContext().validate(item);

                   if (!isValid) {
                       DiasFiestaNacional.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                           errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + DiasFiestaNacional.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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

           $meteor.call('nomina.diasFiestaNacionalSave', editedItems).then(
             function (data) {

                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'info',
                     msg: data
                 });

                 leerRegistrosDesdeElServidor();
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
















         $scope.saveDiasFeriados = function () {
              $scope.showProgress = true;

              // eliminamos los items eliminados; del $scope y del collection
              let editedItems = _.filter($scope.diasFeriados, function (item) { return item.docState; });

              // nótese como validamos cada item antes de intentar guardar (en el servidor)
              let isValid = false;
              let errores = [];

              // nótese como validamos contra un mondelo 'temp...', pues los registros no están realmente en mongo,
              // solo se copian cuando el usuario filtra en la página para consultar o editar
              editedItems.forEach((item) => {
                  if (item.docState != 3) {
                      isValid = DiasFeriados.simpleSchema().namedContext().validate(item);

                      if (!isValid) {
                          DiasFeriados.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                              errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + DiasFeriados.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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

              $meteor.call('nomina.diasFeriadosSave', editedItems).then(
                function (data) {

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: data
                    });

                    leerRegistrosDesdeElServidor();
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

         // ------------------------------------------------------------------------------------------------------
         // para recibir los eventos desde la tarea en el servidor ...
         EventDDP.setClient({ myuserId: Meteor.userId(), app: 'nomina', process: 'leerNominaleerDiasFeriadosDesdeSqlServer' });
         EventDDP.addListener('nomina_leerDiasFeriados_reportProgressDesdeSqlServer', function(process) {

             $scope.processProgress.current = process.current;
             $scope.processProgress.max = process.max;
             $scope.processProgress.progress = process.progress;
             // if we don't call this method, angular wont refresh the view each time the progress changes ...
             // until, of course, the above process ends ...
             $scope.$apply();
         });
         // ------------------------------------------------------------------------------------------------------
}
]);
