

import numeral from 'numeral';
import moment from 'moment';
import lodash from 'lodash';

import { Monedas } from '/imports/collections/monedas.js';
import { Companias } from '/imports/collections/companias';

import { Proveedores_SimpleSchema } from '/imports/collections/bancos/proveedoresClientes'; 

import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { Filtros } from '/imports/collections/general/filtros'; 
import { TiposProveedor, FormasDePago } from '/imports/collections/bancos/catalogos'; 

angular.module("contabm.bancos.catalogos").controller("ProveedoresClientes_Lista_Controller",
['$stateParams', '$scope', '$meteor', '$modal', function ($stateParams, $scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      $scope.setIsEdited = function (value) {
          if ($scope.proveedor.docState)
              return;

          $scope.proveedor.docState = 2;
      };

      // para reportar el progreso de la tarea en la página
      $scope.processProgress = {
          current: 0,
          max: 0,
          progress: 0
      };

      $scope.proveedorClienteArray = [
          { tipo: 1, descripcion: "Proveedor" },
          { tipo: 2, descripcion: "Cliente" },
          { tipo: 3, descripcion: "Ambos" },
          { tipo: 4, descripcion: "Relacionado" },
      ];

      $scope.nacionalidadArray = [
          { tipo: 1, descripcion: "Nacional" },
          { tipo: 2, descripcion: "Extranjero" },
      ];

      $scope.naturalJuridicoArray = [
          { tipo: 1, descripcion: "Natural" },
          { tipo: 2, descripcion: "Juridico" },
      ];

      $scope.helpers({
          tiposProveedor: () => {
            return TiposProveedor.find({}, { sort: { descripcion: 1 } });
          },
          formasPago: () => {
            return FormasDePago.find({}, { fields: { formaDePago: 1, descripcion: 1, }, sort: { descripcion: 1 } });
          },
          monedas: () => {
            return Monedas.find({}, { sort: { descripcion: 1 } });
          },
          cargos: () => {
            return Cargos.find({}, { sort: { descripcion: 1 } });
          },
          departamentos: () => {
            return Departamentos.find({}, { sort: { descripcion: 1 } });
          },
      });


      $scope.refresh0 = function () {
          if ($scope.proveedor && $scope.proveedor.docState) {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Proveedores</em>",
                                        `Aparentemente, Ud. ha efectuado cambios; aún así,
                                         desea <em>refrescar el registro</em> y perder los cambios?`,
                                        true);

              promise.then(
                  function (resolve) {
                      $scope.refresh();
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $scope.refresh();
      };

      $scope.refresh = () => {
          // si el usuario hace un click en Refresh, leemos nuevamente el proveedor seleccionado en la lista ...
          $scope.proveedor = {};
          // $scope.aplicarFiltro();

          if (itemSeleccionado) {
              inicializarItem(itemSeleccionado.proveedor, $scope);
          }

          $scope.alerts = [];
      };

      // este es el tab 'activo' en angular bootstrap ui ...
      // NOTA IMPORTANTE: esta propiedad cambio a partir de 1.2.1 en angular-ui-bootstrap. Sin embargo, parece que
      // atmosphere no tiene esta nueva versión (se quedó en 0.13.0) y no pudimos instalarla desde NPM. La verdad,
      // cuando podamos actualizar angular-ui-bootstrap a una nueve vesión, la propiedad 'active' va en el tabSet
      // y se actualiza con el index de la página (0, 1, 2, ...). Así resulta mucho más intuitivo y fácil
      // establecer el tab 'activo' en ui-bootstrap ...
      $scope.activeTab = { tab1: true, tab2: false, tab3: false, };

      let proveedores_ui_grid_api = null;
      let itemSeleccionado = {};

      let itemSeleccionadoParaSerEliminado = false;

      $scope.proveedores_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          showGridFooter: true,
          enableFiltering: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              proveedores_ui_grid_api = gridApi;
              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  itemSeleccionado = {};
                  if (row.isSelected) {
                      itemSeleccionado = row.entity;

                      if (itemSeleccionadoParaSerEliminado) {
                        // cuando el usuario hace un click en 'x' para eliminar el item en la lista, no lo mostramos en el tab que sigue
                        itemSeleccionadoParaSerEliminado = false;
                        return;
                      }

                      // leemos, desde sql, el proveedor seleccionado en la lista
                      inicializarItem(itemSeleccionado.proveedor, $scope);
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

      $scope.proveedores_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
              enableColumnMenu: false,
              enableSorting: false,
              pinnedLeft: true,
              width: 25
          },
          {
              name: 'proveedor',
              field: 'proveedor',
              displayName: '##',
              width: 60,
              enableFiltering: true,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',

              enableColumnMenu: false,
              enableSorting: true,
              pinnedLeft: true,
              type: 'number'
          },
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Nombre',
              width: 250,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              pinnedLeft: true,
              type: 'string'
          },
          {
              name: 'ciudad',
              field: 'ciudad',
              displayName: 'Ciudad',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'proveedorCliente',
              field: 'proveedorCliente',
              displayName: 'Tipo',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'tipoProveedor',
              field: 'tipoProveedor',
              displayName: 'Tipo',
              width: 120,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'rif',
              field: 'rif',
              displayName: 'Rif',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'nacionalExtranjero',
              field: 'nacionalExtranjero',
              displayName: 'Nac/Ext',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'naturalJuridico',
              field: 'naturalJuridico',
              displayName: 'Nat/Jur',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'formaPago',
              field: 'formaPago',
              displayName: 'Forma pago',
              width: 120,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'ingreso',
              field: 'ingreso',
              displayName: 'Ingreso',
              width: '80',
              enableFiltering: false,
              cellFilter: 'dateFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'date'
          },
          {
              name: 'ultAct',
              field: 'ultAct',
              displayName: 'Ult act',
              width: '80',
              enableFiltering: false,
              cellFilter: 'dateFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'date'
          },
          {
              name: 'usuario',
              field: 'usuario',
              displayName: 'Usuario',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'numeroLote',
              field: 'numeroLote',
              displayName: 'Lote',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
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

        // nótese como  indicamos que el usuario no quiere seleccionar el item en la lista, solo marcarlo para ser eliminado;
        // la idea es que el item se marque para ser eliminado, pero no se muestre (sus detalles) en el tab que sigue ...
        if (item.docState && item.docState === 1) {
          // si el item es nuevo, simplemente lo eliminamos del array
          _.remove($scope.proveedores, (x) => { return x._id === item._id; });
          itemSeleccionadoParaSerEliminado = true;
        }
        else {
          item.docState = 3;

          if (lodash.some($scope.proveedores, (x) => { return x._id === item._id; })) {
            // creo que ésto no debería ser necesario! sin embargo, al actualizar item arriba no se actualiza el item que corresponde en
            // el array ($scope.proveedores)
            lodash.find($scope.proveedores, (x) => { return x._id === item._id; }).docState = 3;
          }

          itemSeleccionadoParaSerEliminado = true;
        }
      }

      $scope.eliminar = function () {
          $scope.proveedor.docState = 3;
      }

      $scope.nuevo = function () {
          inicializarItem(0, $scope);
      }

      // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
      $scope.limpiarFiltro = function () {
          $scope.filtro = {};
      }

      $scope.aplicarFiltro = function () {
          $scope.showProgress = true;

          Meteor.call('bancos.proveedores.LeerDesdeSql', JSON.stringify($scope.filtro), (err, result) => {

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

              // ------------------------------------------------------------------------------------------------------
              // guardamos el filtro indicado por el usuario
              if (Filtros.findOne({ nombre: 'bancos.proveedores', userId: Meteor.userId() }))
                  // el filtro existía antes; lo actualizamos
                  // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                  Filtros.update(Filtros.findOne({ nombre: 'bancos.proveedores', userId: Meteor.userId() })._id,
                                 { $set: { filtro: $scope.filtro } },
                                 { validate: false });
              else
                  Filtros.insert({
                      _id: new Mongo.ObjectID()._str,
                      userId: Meteor.userId(),
                      nombre: 'bancos.proveedores',
                      filtro: $scope.filtro
                  });
              // ------------------------------------------------------------------------------------------------------
              // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
              leerPrimerosRegistrosDesdeServidor(50);

              // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
              $scope.activeTab = { tab1: false, tab2: true, tab3: false, };
          })
      }


      // ------------------------------------------------------------------------------------------------------
      // si hay un filtro anterior, lo usamos
      // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
      $scope.filtro = {};
      var filtroAnterior = Filtros.findOne({ nombre: 'bancos.proveedores', userId: Meteor.userId() });

      if (filtroAnterior)
          $scope.filtro = _.clone(filtroAnterior.filtro);
      // ------------------------------------------------------------------------------------------------------

      $scope.proveedores_ui_grid.data = [];

      let recordCount = 0;
      let limit = 0;

      function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
          // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
          limit = cantidadRecs;
          Meteor.call('getCollectionCount', 'Temp_Consulta_Bancos_Proveedores', (err, result) => {

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
          Meteor.subscribe('temp.bancos.consulta.proveedores.list', limit, () => {

              let meteorUserId = Meteor.userId();

              $scope.helpers({
                  proveedores: () => {
                    return Temp_Consulta_Bancos_Proveedores.find({ user: meteorUserId }, { sort: { nombre: 1 }});
                  }
              });

              $scope.proveedores_ui_grid.data = $scope.proveedores;

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: `${numeral($scope.proveedores.length).format('0,0')} registros
                        (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
              });

              $scope.showProgress = false;
              $scope.$apply();
          });
      }

      $scope.leerMasRegistros = function () {
          limit += 50;    // la próxima vez, se leerán 50 más ...
          $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
      }

      $scope.leerTodosLosRegistros = function () {
          // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
          limit = recordCount;
          $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
      }


      $scope.exportarExcel = function() {

          // aunque este proceso (compañías) no se corresponde a  una cia Contab seleccionada, la leemos para el usuario pues
          // el proceso que prepara el documento Excel usa la cia seleccionada para grabar el registro (collectionFS) en mongo
          let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
          let companiaContab = {};

          if (companiaContabSeleccionada)
              companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);

          let modalInstance = $modal.open({
              templateUrl: 'client/bancos/catalogos/proveedoresClientes/exportarExcelModal.html',
              controller: 'BancosProveedoresClientes_ExportarExcel_Controller',
              size: 'md',
              resolve: {
                  ciaSeleccionada: () => {
                      return companiaContab;
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


      $scope.mostrarPersonas = function() {

          let modalInstance = $modal.open({
              templateUrl: 'client/bancos/catalogos/proveedoresClientes/proveedoresMostrarPersonasModal.html',
              controller: 'BancosProveedores_MostrarPersonas_Controller',
              size: 'lg',
              resolve: {
                  proveedor: () => {
                      return $scope.proveedor;
                  },
                  cargos: () => {
                      return $scope.cargos;
                  },
                  departamentos: () => {
                      return $scope.departamentos;
                  },
                  titulos: () => {
                      return $scope.titulos;
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


      // solo para eliminar los registros que el usuario 'marca' en la lista
      $scope.grabarEliminaciones = () => {

        if (!lodash.some($scope.proveedores, (x) => { return x.docState && x.docState === 3; })) {
            DialogModal($modal, "<em>Proveedores y clientes</em>",
                                `Aparentemente, <em>Ud. no ha marcado</em> registros en la lista para ser eliminados.<br />.<br />
                                 Recuerde que mediante esta función Ud. puede eliminar los registros que se hayan marcado
                                 para ello en la lista.`,
                               false).then();
            return;
        };

        grabarEliminaciones2();
      }

      grabarEliminaciones2 = () => {

        $scope.showProgress = true;
        let proveedoresAEliminar = lodash.filter($scope.proveedores, (x) => { return x.docState && x.docState === 3; });

        Meteor.call('bancos.proveedores.eliminar', proveedoresAEliminar, (err, resolve) => {

          if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });
            $scope.showProgress = false;
            $scope.$apply()

            return;
          }

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'info',
              msg: resolve
          });

          $scope.proveedor = {};            // este es el proveedor que se muestra cuando el usuario selecciona; el usuario pudo haberlo eliminado

          let meteorUserId = Meteor.userId();
          $scope.proveedores_ui_grid.data = [];

          // refrescamos el helper; nótese que al eliminar el proveedor desde sql, también lo eliminamos desde la tabla mongo desde el server
          // por reactivity debería reflejarse en la minimongo y dejar de existir allí
          $scope.helpers({
              proveedores: () => {
                return Temp_Consulta_Bancos_Proveedores.find({ user: meteorUserId }, { sort: { nombre: 1 }});
              }
          });

          $scope.proveedores_ui_grid.data = $scope.proveedores;

          $scope.showProgress = false;
          $scope.$apply();
      })
    }



      // -------------------------------------------------------------------------
      // Grabar las modificaciones hechas al registro
      // -------------------------------------------------------------------------
      $scope.grabar = function () {

          if (!$scope.proveedor.docState) {
              DialogModal($modal, "<em>Proveedores y clientes</em>",
                                  `Aparentemente, <em>no se han efectuado cambios</em> en el registro.
                                   No hay nada que grabar.`,
                                 false).then();
              return;
          };

          grabar2();
      }


      function grabar2() {
          $scope.showProgress = true;

          // obtenemos un clone de los datos a guardar ...
          let editedItem = _.cloneDeep($scope.proveedor);

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          if (editedItem.docState != 3) {
              isValid = Proveedores_SimpleSchema.namedContext().validate(editedItem);

              if (!isValid) {
                  Proveedores_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                      errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Proveedores_SimpleSchema.label(error.name) + "'; error de tipo '" + error.type + "'.");
                  });
              }
          }

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

          Meteor.call('proveedoresSave', editedItem, (err, result) => {

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
                      msg: result.message
                  });
                  $scope.showProgress = false;
                  $scope.$apply();
              } else {
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: result.message
                  });

                  // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                  let claveUnicaRegistro = result.id;

                  // nótese que siempre, al registrar cambios, leemos el registro desde sql server; la idea es
                  // mostrar los datos tal como fueron grabados y refrescarlos para el usuario. Cuando el
                  // usuario elimina el registro, su id debe regresar en -999 e InicializarItem no debe
                  // encontrar nada ...
                  inicializarItem(claveUnicaRegistro, $scope);
              }
          })
      }


     // ------------------------------------------------------------------------------------------------------
     // para recibir los eventos desde la tarea en el servidor ...
     EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosProveedoresDesdeSqlServer' });
     EventDDP.addListener('bancos_proveedores_reportProgressDesdeSqlServer', function(process) {

         $scope.processProgress.current = process.current;
         $scope.processProgress.max = process.max;
         $scope.processProgress.progress = process.progress;
         // if we don't call this method, angular wont refresh the view each time the progress changes ...
         // until, of course, the above process ends ...
         $scope.$apply();
     });
     // ------------------------------------------------------------------------------------------------------

     $scope.showProgress = true;
     Meteor.call('bancos.proveedores.leerTablasCatalogosDesdeSqlServer', (err, result) => {

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

         let catalogos = JSON.parse(result);

         $scope.categoriasRetencion = catalogos.categoriasRetencion;
         $scope.ciudades = catalogos.ciudades;
         $scope.atributos = catalogos.atributos;
         $scope.titulos = catalogos.titulos;

         $scope.categoriasRetencion.forEach(x => x.descripcion = `${x.descripcion} - ${x.tipoPersona ? x.tipoPersona.toLowerCase() : '(tipo pers indef)'}`)

         $scope.showProgress = false;
         $scope.$apply();
     })

     // ------------------------------------------------------------------------------------------------
     // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
     // para limpiar los items en minimongo ...
     $scope.$on('$destroy', function() {
         if (subscriptionHandle && subscriptionHandle.stop) {
             subscriptionHandle.stop();
         };
     })
}
]);


function inicializarItem(proveedorID, $scope) {
    if (proveedorID == 0) {
        $scope.showProgress = true;
        $scope.proveedor = {};
        let usuario =  Meteor.user();
        $scope.proveedor =
            {
                proveedor: 0,
                ingreso: new Date(),
                ultAct: new Date(),
                personas: [],
                usuario: usuario ? usuario.emails[0].address : null,
                docState: 1
            };

          $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
          $scope.activeTab = { tab1: false, tab2: false, tab3: true, };

          $scope.showProgress = false;
    }
    else {
      $scope.showProgress = true;
      proveedores_leerByID_desdeSql(proveedorID, $scope);
    }
}


function proveedores_leerByID_desdeSql(pk, $scope) {
    // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
    Meteor.call('proveedores_leerByID_desdeSql', pk, (err, result) => {

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

        $scope.proveedor = {};
        $scope.proveedor = JSON.parse(result);

        if (!$scope.proveedor || ($scope.proveedor && lodash.isEmpty($scope.proveedor))) {
            // el usuario eliminó el empleado y, por eso, no pudo se leído desde sql
            $scope.proveedor = {};
            $scope.showProgress = false;
            $scope.$apply();

            return;
        };

        // las fechas vienen serializadas como strings; convertimos nuevamente a dates ...
        $scope.proveedor.ingreso = $scope.proveedor.ingreso ? moment($scope.proveedor.ingreso).toDate() : null;
        $scope.proveedor.ultAct = $scope.proveedor.ultAct ? moment($scope.proveedor.ultAct).toDate() : null;

        if ($scope.proveedor.personas) {
            $scope.proveedor.personas.forEach((x) => {
                x.ingreso = x.ingreso ? moment(x.ingreso).toDate() : null;
                x.ultAct = x.ultAct ? moment(x.ultAct).toDate() : null;
            })
        }

        // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
        $scope.activeTab = { tab1: false, tab2: false, tab3: true, };

        $scope.showProgress = false;
        $scope.$apply();
    });
};
