
import numeral from 'numeral';
import { Monedas } from '/imports/collections/monedas.js';
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 
import { Filtros } from '/imports/collections/general/filtros'; 
import { TiposProveedor } from '/imports/collections/bancos/catalogos'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.bancos.catalogos").controller("Catalogos_Bancos_DefinicionCuentasContables_Controller",
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

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionada = {};

      if (companiaSeleccionadaUser)
          companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID,
                                                   { fields: { numero: true, nombre: true, nombreCorto: true } });

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionada && !_.isEmpty(companiaSeleccionada))
          $scope.companiaSeleccionada = companiaSeleccionada;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.conceptosArray = [
          { id: 1, descripcion: "Compañías (CxP)" },
          { id: 2, descripcion: "Compras" },
          { id: 3, descripcion: "Impuestos retenidos" },
          { id: 4, descripcion: "Iva" },
          { id: 5, descripcion: "Retención s/Iva" },
          { id: 6, descripcion: "Otras" },
          { id: 7, descripcion: "Compañías (CxC)" },
          { id: 8, descripcion: "Ventas" },
          { id: 9, descripcion: "Iva por pagar" },
          { id: 10, descripcion: "Islr retenido por clientes" },
          { id: 11, descripcion: "Iva retenido por clientes" },
          { id: 12, descripcion: "Anticipo en pago de facturas" },
          { id: 13, descripcion: "Impuestos y retenciones varias (CxP)" },
          { id: 14, descripcion: "Impuestos y retenciones varias (CxC)" },
          { id: 15, descripcion: "Movimientos bancarios - comisiones" },
          { id: 16, descripcion: "Movimientos bancarios - impuestos" },
      ];

      $scope.helpers({
          tiposProveedor: () => {
            return TiposProveedor.find({}, { sort: { descripcion: 1 } });
          },
          monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
          },
          cuentasContables: () => {
              return CuentasContables2.find({ cia:  companiaSeleccionada ? companiaSeleccionada.numero : -999 },
                                            { sort: { cuenta: 1, }})
          },
      });

      let cuentasContables_ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.cuentasContables_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          showGridFooter: true,
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

              cuentasContables_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  itemSeleccionado = {};
                  if (row.isSelected) {
                      itemSeleccionado = row.entity;
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
      }

      $scope.cuentasContablesLista = CuentasContables2.find({ cia: $scope.companiaSeleccionada.numero, totDet: 'D', actSusp: 'A' },
                                                            { sort: { cuenta: true }}).fetch();
      $scope.cuentasContablesLista.forEach((x) => { x.cuentaDescripcionCia = x.cuentaDescripcionCia(); }); 

      // para permitir que el usuario deseleccione en los ddl's ... nótese unshift to insert the item at the beggining of array 
      $scope.tiposProveedor.unshift({ tipo: null, descripcion: '', }); 
      $scope.monedas.unshift({ moneda: null, descripcion: '', }); 

      $scope.cuentasContables_ui_grid.columnDefs = [
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
              enableFiltering: false,
              width: 25
          },
          {
              name: 'rubro',
              field: 'rubro',
              displayName: 'Rubro',
              width: 120,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.tiposProveedor:"tipo":"descripcion"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'tipo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.tiposProveedor,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              filterCellFiltered: true,
              type: 'number'
          },
          {
              name: 'compania',
              field: 'compania',
              displayName: 'Compañía',
              width: 200,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.proveedores:"proveedor":"nombre"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'proveedor',
              editDropdownValueLabel: 'nombre',
              editDropdownOptionsArray: $scope.proveedores,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              filterCellFiltered: true,
              type: 'number'
          },
          {
              name: 'moneda',
              field: 'moneda',
              displayName: 'Moneda',
              width: 100,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              
              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'moneda',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.monedas,
              cellFilter: 'mapDropdown:row.grid.appScope.monedas:"moneda":"descripcion"',

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'number'
          },
          {
              name: 'concepto',
              field: 'concepto',
              displayName: 'Concepto',
              width: 200,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.conceptosArray:"id":"descripcion"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.conceptosArray,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'number'
          },
          {
              name: 'concepto2',
              field: 'concepto2',
              displayName: 'Concepto (2)',
              width: 120,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'number'
          },
          {
              name: 'cuentaContableID',
              field: 'cuentaContableID',
              displayName: 'Cuenta contable',
              width: 200,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'cuentaDescripcionCia',
              editDropdownOptionsArray: $scope.cuentasContablesLista,
              cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"id":"cuentaDescripcionCia"',

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'number'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              enableFiltering: false,
              width: 25
          },
      ];


      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.cuentasContablesDefinicion, (x) => { return x._id === item._id; });
          else
              item.docState = 3;
      }

      $scope.nuevo = function () {
          let item = {
              _id: new Mongo.ObjectID()._str,
              claveUnica: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
              user: Meteor.userId(),
              docState: 1
          };

          $scope.cuentasContablesDefinicion.push(item);

          $scope.cuentasContables_ui_grid.data = [];
          $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesDefinicion;
      }


      // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
      $scope.limpiarFiltro = function () {
          $scope.filtro = {};
      }

      // -------------------------------------------------------------------------------------------
      // leemos una lista de proveedores (solo id y abreviatura) para el ddl
      let proveedores_subscriptionHandle = null;
      $scope.showProgress = true;
      proveedores_subscriptionHandle =
      Meteor.subscribe('proveedoresLista', limit, () => {

          $scope.helpers({
              proveedores: () => {
                  return Proveedores.find({}, { sort: { nombre: 1, } });
              },
          });

          // para agregar un 'empty option' al ddl de compañías ... unshift to insert the item at the beggining of array ... 
          $scope.proveedores.unshift({ proveedor: null, nombre: '', }); 

          // nótese como construimos el ddl en el ui-grid, solo cuando tenemos la lista (de proveedores) ...
          $scope.cuentasContables_ui_grid.columnDefs[2].cellFilter = 'mapDropdown:row.grid.appScope.proveedores:"proveedor":"nombre"';
          $scope.cuentasContables_ui_grid.columnDefs[2].editDropdownOptionsArray = $scope.proveedores;

          $scope.showProgress = false;
          $scope.$apply();
      });


      // -------------------------------------------------------------------------------------------
      $scope.aplicarFiltro = function () {

          $scope.showProgress = true;

          Meteor.call('bancos_cuentasContablesDefinicion_leerDesdeSql', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

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

              // ------------------------------------------------------------------------------------------------------
              // guardamos el filtro indicado por el usuario
              if (Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() }))
                  // el filtro existía antes; lo actualizamos
                  // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                  Filtros.update(Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() })._id,
                                 { $set: { filtro: $scope.filtro } },
                                 { validate: false });
              else
                  Filtros.insert({
                      _id: new Mongo.ObjectID()._str,
                      userId: Meteor.userId(),
                      nombre: 'bancos.cuentasContablesDefinicion',
                      filtro: $scope.filtro
                  });
              // ------------------------------------------------------------------------------------------------------
              // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
              leerPrimerosRegistrosDesdeServidor(50);

              // usamos jquery para hacer un click en el link que collapsa el filtro (bootstrap collapse);
              $("#collapseLink").click();
          });
      }


      // ------------------------------------------------------------------------------------------------------
      // si hay un filtro anterior, lo usamos
      // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
      $scope.filtro = {};
      var filtroAnterior = Filtros.findOne({ nombre: 'bancos.cuentasContablesDefinicion', userId: Meteor.userId() });

      if (filtroAnterior)
          $scope.filtro = _.clone(filtroAnterior.filtro);
      // ------------------------------------------------------------------------------------------------------

      $scope.cuentasContablesDefinicion = []
      $scope.cuentasContables_ui_grid.data = [];

      let recordCount = 0;
      let limit = 0;

      function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
          // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
          limit = cantidadRecs;
          Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_CuentasContables_Definicion', (err, result) => {

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

              // el método regresa la cantidad de items en el collection (siempre para el usuario)
              recordCount = result;
              $scope.leerRegistrosDesdeServer(limit);
          });
      }


      let subscriptionHandle = null;
      $scope.leerRegistrosDesdeServer = function (limit) {
          // la idea es 'paginar' los registros que se suscriben, de 50 en 50
          // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
          $scope.showProgress = true;

          // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
          // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
          // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
          // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
          // de los subscriptions también ...
          if (subscriptionHandle && subscriptionHandle.stop) {
              subscriptionHandle.stop();
          };

          subscriptionHandle =
          Meteor.subscribe('temp.bancos.consulta.cuentasContablesDefinicion.list', limit, () => {
              let meteorUserId = Meteor.userId();
              $scope.cuentasContablesDefinicion = [];
              $scope.cuentasContablesDefinicion =
                    Temp_Consulta_Bancos_CuentasContables_Definicion.find({ user: meteorUserId },
                                                                          { sort: { rubro: 1, cuentaContable: 1, }}).
                                                                     fetch();

              $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesDefinicion;

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: `${numeral($scope.cuentasContablesDefinicion.length).format('0,0')} registros
                        (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
              });

              $scope.showProgress = false;
              $scope.$apply();
          });
      };

      $scope.leerMasRegistros = function () {
          limit += 50;    // la próxima vez, se leerán 50 más ...
          $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
      };

      $scope.leerTodosLosRegistros = function () {
          // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
          limit = recordCount;
          $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
      };

      $scope.save = function () {
           $scope.showProgress = true;

           // eliminamos los items eliminados; del $scope y del collection
           let editedItems = _.filter($scope.cuentasContablesDefinicion, function (item) { return item.docState; });

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores = [];

           // nótese como validamos contra un mondelo 'temp...', pues los registros no están realmente en mongo,
           // solo se copian cuando el usuario filtra en la página para consultar o editar
           editedItems.forEach((item) => {
               if (item.docState != 3) {
                   isValid = Temp_Consulta_Bancos_CuentasContables_Definicion.simpleSchema().namedContext().validate(item);

                   if (!isValid) {
                       Temp_Consulta_Bancos_CuentasContables_Definicion.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                           errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + Temp_Consulta_Bancos_CuentasContables_Definicion.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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
           $meteor.call('bancos.cuentasContablesDefinicionSave', editedItems).then(
             function (data) {

                 $scope.alerts.length = 0;
                 $scope.alerts.push({
                     type: 'info',
                     msg: data
                 });

                 // leemos nuevamente los registros desde el servidor
                 $scope.cuentasContables_ui_grid.data = [];
                 leerPrimerosRegistrosDesdeServidor(limit);
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
         EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerCuentasContablesDefinicionDesdeSqlServer' });
         EventDDP.addListener('bancos_leerCuentasContablesDefinicionDesdeSqlServer_reportProgressDesdeSqlServer', function(process) {

             $scope.processProgress.current = process.current;
             $scope.processProgress.max = process.max;
             $scope.processProgress.progress = process.progress;
             // if we don't call this method, angular wont refresh the view each time the progress changes ...
             // until, of course, the above process ends ...
             $scope.$apply();
         });
         // ------------------------------------------------------------------------------------------------------

         // ------------------------------------------------------------------------------------------------
         // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
         // para limpiar los items en minimongo ...
         $scope.$on('$destroy', function() {
             if (subscriptionHandle && subscriptionHandle.stop) {
                 subscriptionHandle.stop();
             };
         });
}
]);
