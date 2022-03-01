
import lodash from 'lodash';
import numeral from 'numeral';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { GruposContables } from '/imports/collections/contab/gruposContables'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_CuentasContables_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada)
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID);

      $scope.companiaSeleccionada = {};
      let numeroCiaContabSeleccionada = -9999;

      if (companiaSeleccionadaDoc) {
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
          numeroCiaContabSeleccionada = companiaSeleccionadaDoc.numero;
      }
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.exportarExcel = function() {

          let modalInstance = $modal.open({
              templateUrl: 'client/contab/catalogos/cuentasContables/exportarExcelModal.html',
              controller: 'ContabCatalogosCuentasContablesExportarExcel_Controller',
              size: 'md',
              resolve: {
                  ciaSeleccionada: () => {
                      return companiaSeleccionadaDoc;
                  },
              },
          }).result.then(
                function (resolve) {
                    return true;
                },
                function (cancel) {
                    return true;
                });
      };
      // ------------------------------------------------------------------------------------------------

      $scope.importarDesdeExcel = function() {

          // para abrir un modal que permita al usuario leer un doc excel desde el cliente e importar cada row
          // como una cuenta contable
          let modalInstance = $modal.open({
              templateUrl: 'client/contab/catalogos/cuentasContables/importarDesdeExcelModal.html',
              controller: 'ContabCatalogosCuentasContablesImportarDesdeExcel_Controller',
              size: 'lg',
              resolve: {
                  cuentasContables: () => {
                      return $scope.cuentasContables;
                  },
                  cuentasContables_ui_grid: () => {
                      return $scope.cuentasContables_ui_grid;
                  },
                  ciaSeleccionada: () => {
                      return companiaSeleccionadaDoc;
                  },
              },
          }).result.then(
                function (resolve) {
                    return true;
                },
                function (cancel) {
                    // refrescamos el ui-grid, pues agregamos todas las cuentas desde Excel ..
                    // $scope.cuentasContables_ui_grid.data = [];
                    // if (lodash.isArray($scope.cuentasContables))
                    //    $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

                    return true;
                });
      };
      // ------------------------------------------------------------------------------------------------


      let cuentasContables_ui_grid_api = null;
      let itemSeleccionado = {};

      $scope.cuentasContables_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          showGridFooter: true,
          enableCellEdit: false,
          enableFiltering: true,
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
      };

      // arrays para llenar los ddl en el ui-grid
      $scope.gruposContables = GruposContables.find({}, { sort: { descripcion: 1 }}).fetch();
      $scope.totDetArray = [ { id: "T", descripcion: "Total" }, { id: "D", descripcion: "Detalle" }];
      $scope.actSuspArray = [ { id: "A", descripcion: "Activa" }, { id: "S", descripcion: "Suspendida" }];

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
              width: 25
          },
          {
              name: 'id',
              field: 'id',
              displayName: 'ID',
              width: 60,
              enableFiltering: true,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'cuentaEditada',
              field: 'cuentaEditada',
              displayName: 'Cuenta',
              width: 150,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 250,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'totDet',
              field: 'totDet',
              displayName: 'Tot/Det',
              width: 60,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.totDetArray:"id":"descripcion"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.totDetArray,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'actSusp',
              field: 'actSusp',
              displayName: 'Act/Susp',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'mapDropdown:row.grid.appScope.actSuspArray:"id":"descripcion"',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'id',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.actSuspArray,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'grupo',
              field: 'grupo',
              displayName: 'Grupo',
              width: 100,
              enableFiltering: false,
              cellFilter: 'mapDropdown:row.grid.appScope.gruposContables:"grupo":"descripcion"',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',

              editableCellTemplate: 'ui-grid/dropdownEditor',
              editDropdownIdLabel: 'grupo',
              editDropdownValueLabel: 'descripcion',
              editDropdownOptionsArray: $scope.gruposContables,

              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia contab',
              cellFilter: 'companiaAbreviaturaFilter',
              width: 100,
              enableFiltering: false,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
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
        if (item.docState && item.docState === 1) { 
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.cuentasContables, (x) => { return x._id === item._id; });
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
            id: 0,
            actSusp: "A",
            cia: companiaSeleccionadaDoc.numero,
            docState: 1
        };

        $scope.cuentasContables.push(item);

        $scope.cuentasContables_ui_grid.data = [];
        if (lodash.isArray($scope.cuentasContables))
            $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;
    }

    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = lodash.filter($scope.cuentasContables, function (item) { return item.docState; });

        // determinamos la cuenta y sus niveles, en base a la cuenta 'editada' que el usuario indica
        determinarNivelesCuentaContable(editedItems);

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = CuentasContables.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    CuentasContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CuentasContables.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
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
        }

        $meteor.call('contab.cuentasContablesSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                // por alguna razón, que aún no entendemos del todo, si no hacemos el subscribe nuevamente,
                // se queda el '*' para registros nuevos en el ui-grid ...
                $scope.cuentasContables = [];
                $scope.cuentasContables_ui_grid.data = [];

                // NOTA: el publishing de este collection es 'automático'; muchos 'catálogos' se publican
                // de forma automática para que estén siempre en el cliente ...

                cuentasContablesSubscriptioHandle = Meteor.subscribe("cuentasContables", {
                    onReady: function () {

                        $scope.helpers({
                            cuentasContables: () => {
                            return CuentasContables.find(
                                { cia: numeroCiaContabSeleccionada }, { sort: { cuenta: 1 } });
                            }
                        });

                        $scope.cuentasContables_ui_grid.data = [];
                        $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

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
        })
    }


    $scope.showProgress = true;
    let cuentasContablesSubscriptioHandle = null;

    // la suscripción a cuentas contables trae solo las que corresponden a la cia contab seleccionada
    cuentasContablesSubscriptioHandle = Meteor.subscribe("cuentasContables", {
        onError: function( error ) {
            // if the sub terminates with an error
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Error: se ha producido un error al intentar leer las cuentas contables para la <em>compañía Contab seleccionada</em>.<br />" +
                        "Por favor revise."
            });
            $scope.showProgress = false;
        },
        onReady: function() {

            $scope.helpers({
                cuentasContables: () => {
                    return CuentasContables.find(
                        { cia: numeroCiaContabSeleccionada }, { sort: { cuenta: 1 } });
                }
            });

            $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

            let count = $scope.cuentasContables && lodash.isArray($scope.cuentasContables) ? $scope.cuentasContables.length : 0

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `<b>${numeral(count).format('0,0')}</b> cuentas contables leídas para la <em>compañía Contab</em> seleccionada ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        }
    })

      $scope.mostrarDetallesCuentaContable = () => {

          if (!itemSeleccionado || lodash.isEmpty(itemSeleccionado)) {
              DialogModal($modal, "<em>Cuentas contables - Mostrar detalles</em>",
                                  `Ud. debe seleccionar una cuenta contable en la lista.`,
                                 false).then();
              return;
          };

          var modalInstance = $modal.open({
              templateUrl: 'client/contab/catalogos/cuentasContables/mostrarDetallesCuentaContable.html',
              controller: 'MostrarDetallesCuentaContable_Modal_Controller',
              size: 'lg',
              resolve: {
                  companiaSeleccionadaDoc: () => {
                      return companiaSeleccionadaDoc;
                  },
                  cuentaContableSeleccionada: () => {
                      return itemSeleccionado;
                  },
              }
          }).result.then(
                function (resolve) {
                    return true;
                },
                function (cancel) {
                    return true;
                });

      };

      $scope.cuentasContables_ui_grid.data = [];

      // detenemos los publishers cuando el usuario deja la página
      $scope.$on("$destroy", () => {
          if (cuentasContablesSubscriptioHandle && cuentasContablesSubscriptioHandle.stop) {
              cuentasContablesSubscriptioHandle.stop();
          };
      });
}
])

function determinarNivelesCuentaContable(cuentasContables) {

    if (!cuentasContables || !lodash.isArray(cuentasContables))
        return;

    cuentasContables.forEach((cuenta) => {

        cuenta.cuenta = "";
        cuenta.nivel1 = null;
        cuenta.nivel2 = null;
        cuenta.nivel3 = null;
        cuenta.nivel4 = null;
        cuenta.nivel5 = null;
        cuenta.nivel6 = null;
        cuenta.nivel7 = null;

        let nivelesArray = [];

        if (cuenta.cuentaEditada) {
            nivelesArray = cuenta.cuentaEditada.split(" ");
            if (!nivelesArray)
                nivelesArray = [];
        };

        let cantidadNiveles = 0;

        for (let i = 0; i <= nivelesArray.length -1; i++) {
            let nivel = i + 1;
            switch (nivel) {
                case 1:
                    cuenta.nivel1 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 2:
                    cuenta.nivel2 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 3:
                    cuenta.nivel3 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 4:
                    cuenta.nivel4 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 5:
                    cuenta.nivel5 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 6:
                    cuenta.nivel6 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                case 7:
                    cuenta.nivel7 = nivelesArray[i];
                    cantidadNiveles++;

                    break;
                default:
                    cantidadNiveles++;
                    break;
            };

            cuenta.cuenta += nivelesArray[i];
        };

        cuenta.numNiveles = cantidadNiveles;
    });
}
