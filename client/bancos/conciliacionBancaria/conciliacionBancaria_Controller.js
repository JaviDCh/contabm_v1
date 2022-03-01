

import lodash from 'lodash';
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from '/imports/collections/bancos/conciliacionesBancarias'; 

import { FlattenBancos } from '/imports/general/bancos/flattenBancos'; 

angular.module("contabm").controller("Bancos_ConciliacionesBancarias_ConciliacionBancaria_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

      $scope.showProgress = false;

      // para reportar el progreso de la tarea en la página
      $scope.processProgress = {
          current: 0,
          max: 0,
          progress: 0
      };

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let companiaContabSeleccionada = $scope.$parent.companiaSeleccionada;
      $scope.cuentasBancarias = $scope.$parent.cuentasBancarias;
      $scope.cuentasContables = $scope.$parent.cuentasContables;

      $scope.origen = $stateParams.origen;
      $scope.id = $stateParams.id;
      $scope.limit = parseInt($stateParams.limit);

      $scope.setIsEdited = function (value) {

          // cuando el usuario seleccionada una cuenta bancaria, debemos leer su banco y moneda para asignar al
          // registro
          if (value === 'cuentaBancaria') {
              $scope.conciliacionBancaria.banco = null;
              $scope.conciliacionBancaria.moneda = null;

              if ($scope.conciliacionBancaria.cuentaBancaria) {
                  // el banco y moneda están, para cada cuenta, en la lista de cuentas que se preparó en $scope.$parent ...
                  let cuentaBancariaSeleccionada = _.find($scope.cuentasBancarias,
                                                         (x) => { return x.cuentaBancaria ===
                                                                         $scope.conciliacionBancaria.cuentaBancaria; });

                  if (cuentaBancariaSeleccionada) {
                      $scope.conciliacionBancaria.banco = cuentaBancariaSeleccionada.banco;
                      $scope.conciliacionBancaria.moneda = cuentaBancariaSeleccionada.moneda;
                      $scope.conciliacionBancaria.cuentaContable = cuentaBancariaSeleccionada.cuentaContable;
                  };
              };
          };

          if ($scope.conciliacionBancaria.docState)
              return;

          $scope.conciliacionBancaria.docState = 2;
      };

      $scope.regresarALista = function () {

          if ($scope.conciliacionBancaria && $scope.conciliacionBancaria.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Conciliaciones bancarias</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                        true);

              promise.then(
                  function (resolve) {
                      $state.go('bancos.conciliacionesBancarias.lista', { origen: $scope.origen, limit: $scope.limit });
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $state.go('bancos.conciliacionesBancarias.lista', { origen: $scope.origen, limit: $scope.limit });
      };

      $scope.eliminar = function () {

          if ($scope.conciliacionBancaria && $scope.conciliacionBancaria.docState && $scope.conciliacionBancaria.docState == 1) {
              DialogModal($modal, "<em>Bancos - Conciliaciones bancarias</em>",
                                  "El registro es nuevo (no existe en la base de datos); para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                  false).then();

              return;
          };

          // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
          $scope.conciliacionBancaria.docState = 3;
      };

      $scope.refresh0 = function () {

          if ($scope.conciliacionBancaria && $scope.conciliacionBancaria.docState && $scope.conciliacionBancaria.docState == 1) {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Conciliaciones bancarias</em>",
                                        `Ud. está ahora agregando un <em>nuevo</em> registro; no hay nada que refrescar.<br />
                                         Ud. puede hacer un <em>click</em> en <em>Nuevo</em> para deshacer esta operación y comenzar de nuevo.
                                        `,
                                        false);
              return;
          };

          if ($scope.conciliacionBancaria.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Conciliaciones bancarias</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>refrescar el registro</em> y perder los cambios?",
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
          // en sql el pk del movimiento bancario se llama ClaveUnica; sin embargo, el model en sequelize
          // lo renombra a id ...
          movimientoBancario_leerByID_desdeSql($scope.movimientoBancario.claveUnica);
      };


      $scope.exportarExcel = function() {

          // leemos la cuenta bancaria para obtener el banco, moneda y cuenta bancaria (nombre, simbolo, l...)
          let cuentasBancariasList = FlattenBancos(companiaContabSeleccionada);
          let cuentaBancariaItem = lodash.find(cuentasBancariasList, (x) => {
                                              return x.cuentaInterna === $scope.conciliacionBancaria.cuentaBancaria;
                                          });

          // leemos la cuenta contable asociada a la conciliación; la idea es pasarla al modal y mostrarla, finalmente, en el doc excel
          let cuentaContable = lodash.find($scope.cuentasContables, (x) => { return x.id === $scope.conciliacionBancaria.cuentaContable; });

          let modalInstance = $modal.open({
              templateUrl: 'client/bancos/conciliacionBancaria/exportarExcelModal.html',
              controller: 'BancosConciliacionBancariaExportarExcel_Controller',
              size: 'md',
              resolve: {
                conciliacionID: () => {
                    return $scope.id;
                    },
                  movimientosPropiosNoEncontrados: () => {
                      return lodash.filter($scope.conciliacionesBancarias_movimientosPropios,
                                    (x) => { return x.conciliado === 'no'; });

                      },
                  movimientosContablesNoEncontrados: () => {
                      return lodash.filter($scope.conciliacionesBancarias_movimientosContables,
                                    (x) => { return x.conciliado === 'no'; });

                      },
                  movimientosBancoNoEncontrados: () => {
                      return lodash.filter($scope.conciliacionesBancarias_movimientosBanco,
                                    (x) => { return x.conciliado === 'no'; });

                      },
                  banco: () => {
                      return cuentaBancariaItem && cuentaBancariaItem.nombreBanco ?
                             cuentaBancariaItem.nombreBanco : null;
                  },
                  moneda: () => {
                      return cuentaBancariaItem && cuentaBancariaItem.simboloMoneda ?
                             cuentaBancariaItem.simboloMoneda : null;
                  },
                  cuentaBancaria: () => {
                      return cuentaBancariaItem && cuentaBancariaItem.cuentaBancaria ?
                             cuentaBancariaItem.cuentaBancaria : null;
                  },
                  cuentaContable: () => {
                      return cuentaContable && cuentaContable.cuentaDescripcionCia ? cuentaContable.cuentaDescripcionCia : 'Cuenta contable indefinida (???)';
                  },
                  ciaSeleccionada: () => {
                      return companiaContabSeleccionada;
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


      let movimientosPropios_ui_grid_api = null;
      let movimientoPropioSeleccionado = {};

      $scope.movimientosPropios_ui_grid = {

          enableSorting: true,
          showGridFooter: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableFiltering: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              movimientosPropios_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  movimientoPropioSeleccionado = {};

                  if (row.isSelected) {
                      movimientoPropioSeleccionado = row.entity;
                  }
                  else {
                      return;
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


      $scope.movimientosPropios_ui_grid.columnDefs = [
          {
              name: 'fecha',
              field: 'fecha',
              displayName: 'Fecha',
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
              name: 'consecutivo',
              field: 'consecutivo',
              displayName: '##',
              width: '50',
              enableFiltering: true,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'numero',
              field: 'numero',
              displayName: 'Número',
              width: '100',
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'tipo',
              field: 'tipo',
              displayName: 'Tipo',
              width: '60',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'beneficiario',
              field: 'beneficiario',
              displayName: 'Beneficiario',
              width: '140',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'concepto',
              field: 'concepto',
              displayName: 'Concepto',
              width: '140',
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'monto',
              field: 'monto',
              displayName: 'Monto',
              width: '100',
              headerCellClass: 'ui-grid-rightCell',
              cellClass: 'ui-grid-rightCell',
              cellFilter: 'currencyFilter',
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'conciliado',
              field: 'conciliado',
              displayName: 'Conciliado',
              width: '100',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: function (grid, row, col, rowIndex, colIndex) {
                  // con el row viene el entiy con el valor de cada celda
                  let conciliado = row.entity && row.entity.conciliado ? row.entity.conciliado : "";
                  if (conciliado === "no") {
                      // 3: pagada
                      return 'ui-grid-centerCell red';
                  } else if (conciliado === "si") {
                      // 4: anulada
                      return 'ui-grid-centerCell blue';
                  }
              },
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'consecutivoMovBanco',
              field: 'consecutivoMovBanco',
              displayName: '## banco',
              width: '80',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableFiltering: true,
              enableColumnMenu: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'fechaEntregado',
              field: 'fechaEntregado',
              displayName: 'Entregado el',
              width: '100',
              enableFiltering: false,
              cellFilter: 'dateFilter',
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableSorting: true,
              type: 'date'
          },
      ];


    let movimientosContables_ui_grid_api = null;
    let movimientoContableSeleccionado = {};

    $scope.movimientosContables_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableFiltering: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            movimientosContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                movimientoContableSeleccionado = {};

                if (row.isSelected) {
                    movimientoContableSeleccionado = row.entity;
                }
                else {
                    return;
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

    $scope.movimientosContables_ui_grid.columnDefs = [
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
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
            name: 'consecutivo',
            field: 'consecutivo',
            displayName: '##',
            width: '50',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'comprobante',
            field: 'comprobante',
            displayName: '#Comp',
            width: '60',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'partida',
            field: 'partida',
            displayName: '#Part',
            width: '60',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'descripcionComprobante',
            field: 'descripcionComprobante',
            displayName: 'Descripción comprobante',
            width: '180',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'descripcionPartida',
            field: 'descripcionPartida',
            displayName: 'Descripción partida',
            width: '180',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Referencia',
            width: '60',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'conciliado',
            field: 'conciliado',
            displayName: 'Conciliado',
            width: '100',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: function (grid, row, col, rowIndex, colIndex) {
                // con el row viene el entiy con el valor de cada celda
                let conciliado = row.entity && row.entity.conciliado ? row.entity.conciliado : "";
                if (conciliado === "no") {
                    // 3: pagada
                    return 'ui-grid-centerCell red';
                } else if (conciliado === "si") {
                    // 4: anulada
                    return 'ui-grid-centerCell blue';
                }
            },
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'consecutivoMovBanco',
            field: 'consecutivoMovBanco',
            displayName: '## banco',
            width: '80',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
    ];



    let movimientosBanco_ui_grid_api = null;
    let movimientoBancoSeleccionado = {};

    $scope.movimientosBanco_ui_grid = {

        enableSorting: true,
        showGridFooter: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableFiltering: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            movimientosBanco_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                movimientoBancoSeleccionado = {};

                if (row.isSelected) {
                    movimientoBancoSeleccionado = row.entity;
                }
                else {
                    return;
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

    $scope.movimientosBanco_ui_grid.columnDefs = [
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
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
            name: 'consecutivo',
            field: 'consecutivo',
            displayName: '##',
            width: '50',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'numero',
            field: 'numero',
            displayName: 'Número',
            width: '100',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '60',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'beneficiario',
            field: 'beneficiario',
            displayName: 'Beneficiario',
            width: '140',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'concepto',
            field: 'concepto',
            displayName: 'Concepto',
            width: '140',
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'monto',
            field: 'monto',
            displayName: 'Monto',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        // {
        //     name: 'conciliado',
        //     field: 'conciliado',
        //     displayName: 'Conciliado',
        //     width: '100',
        //     headerCellClass: 'ui-grid-centerCell',
        //     cellClass: 'ui-grid-centerCell',
        //     enableFiltering: true,
        //     enableColumnMenu: false,
        //     enableSorting: true,
        //     type: 'string'
        // },
        {
            name: 'consecutivoMovPropio',
            field: 'consecutivoMovPropio',
            displayName: 'Conc bancos',
            width: '100',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        // {
        //     name: 'conciliadoContab',
        //     field: 'conciliadoContab',
        //     displayName: 'Conc contab',
        //     width: '100',
        //     headerCellClass: 'ui-grid-centerCell',
        //     cellClass: 'ui-grid-centerCell',
        //     enableFiltering: true,
        //     enableColumnMenu: false,
        //     enableSorting: true,
        //     type: 'string'
        // },
        {
            name: 'consecutivoMovContab',
            field: 'consecutivoMovContab',
            displayName: 'Conc contab',
            width: '100',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
    ];


      $scope.nuevo0 = function () {

            if ($scope.conciliacionBancaria.docState) {
                var promise = DialogModal($modal,
                                          "<em>Bancos - Conciliaciones bancarias</em>",
                                          "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa esta operación, " +
                                          "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                          true);

                promise.then(
                    function (resolve) {
                        $scope.nuevo();
                    },
                    function (err) {
                        return true;
                    });

                return;
            }
            else
                $scope.nuevo();
        };

        $scope.nuevo = function () {
            $scope.id = "0";                        // para que inicializarItem() agregue un nuevo registro

            inicializarItem();
        };

      // -------------------------------------------------------------------------
      // Grabar las modificaciones hechas al siniestro
      // -------------------------------------------------------------------------
      $scope.grabar = function () {

          if (!$scope.conciliacionBancaria.docState) {
              DialogModal($modal, "<em>Conciliaciones bancarias</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                 false).then();
              return;
          }

          $scope.showProgress = true;

          // obtenemos un clone de los datos a guardar ...
          let editedItem = _.cloneDeep($scope.conciliacionBancaria);

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          if (editedItem.docState != 3) {
              isValid = ConciliacionesBancarias.simpleSchema().namedContext().validate(editedItem);

              if (!isValid) {
                  ConciliacionesBancarias.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                      errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + ConciliacionesBancarias.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

          Meteor.call('bancos.conciliacionesBancarias.save', editedItem, (err, result) => {

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
                  // el método que intenta grabar los cambis puede regresar un error cuando,
                  // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
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
                  $scope.id = result.id;

                  // solo si el item es nuevo, no hemos creado un helper para el mismo (pues es nuevo y no
                  // existía en mongo); lo hacemos ahora para que el item que se ha agregado en mongo sea el
                  // que efectivamente se muestre al usuario una vez que graba el item en mongo. Además, para
                  // agregar el 'reactivity' que existe para items que existían y que se editan
                  if ($scope.conciliacionBancaria && $scope.conciliacionBancaria.docState && $scope.conciliacionBancaria.docState == 1) {
                      // 'inicializar...' lee el registro recién agregado desde mongo y agrega un 'helper' para él ...
                      inicializarItem($scope.id);
                  };

                  $scope.showProgress = false;
                  $scope.$apply();
              }
          })
      }


      $scope.conciliacionBancaria = {};

      function inicializarItem() {
          $scope.showProgress = true;

          if ($scope.id == "0") {

              let usuario =  Meteor.user();

              $scope.conciliacionBancaria = {};
              $scope.conciliacionBancaria = {
                 _id: new Mongo.ObjectID()._str,
                 desde: new Date(),
                 hasta: new Date(),
                 cia: companiaContabSeleccionada.numero,

                 ingreso: new Date(),
                 ultMod: new Date(),
                 usuario: usuario ? usuario.emails[0].address : null,
                 docState: 1,
            };

            $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
            $scope.showProgress = false;
          }
          else {
            $scope.showProgress = true;
            leerConciliacionBancaria($scope.id);
          };
      };

      inicializarItem();


      function leerConciliacionBancaria(id) {
          $scope.subscribe("conciliacionesBancarias", () => [JSON.stringify({ _id: id })],
          {
                onReady: function() {
                      $scope.helpers({
                          conciliacionBancaria: () => {
                              return ConciliacionesBancarias.findOne(id);
                          },
                          conciliacionesBancarias_movimientosPropios: () => {
                              return ConciliacionesBancarias_movimientosPropios.find(
                                  { conciliacionID: id },
                                  { sort: { consecutivo: 1 } }
                              );
                          },
                          conciliacionesBancarias_movimientosContables: () => {
                              return ConciliacionesBancarias_movimientosCuentaContable.find(
                                  { conciliacionID: id },
                                  { sort: { consecutivo: 1 } }
                              );
                          },
                          conciliacionesBancarias_movimientosBanco: () => {
                              return ConciliacionesBancarias_movimientosBanco.find(
                                  { conciliacionID: id },
                                  { sort: { consecutivo: 1 } }
                              );
                          }
                      });

                      $scope.movimientosPropios_ui_grid.data = [];
                      $scope.movimientosPropios_ui_grid.data = $scope.conciliacionesBancarias_movimientosPropios;

                      $scope.movimientosBanco_ui_grid.data = [];
                      $scope.movimientosBanco_ui_grid.data = $scope.conciliacionesBancarias_movimientosBanco;

                      $scope.movimientosContables_ui_grid.data = [];
                      $scope.movimientosContables_ui_grid.data = $scope.conciliacionesBancarias_movimientosContables;

                      $scope.showProgress = false;
                      $scope.$apply();
                },
                onStop: function(err) {
                    if (err) {
                    } else {
                    }
                }
          });
      };


      // para leer movimientos propios y registrarlos en mongo
      $scope.cargarMovimientosBancariosPropios = () => {

          if ($scope.conciliacionBancaria.docState) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios propios</em>",
                                  "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                  "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          if (!$scope.conciliacionBancaria || !$scope.conciliacionBancaria._id) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios propios</em>",
                                  "Aparentemente, la conciliación bancaria no está completa aún. " +
                                  "Ud. debe completar el registro de esta conciliación antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          // revisamos minimongo a ver si ya existen movimientos propios para la conciliación; de ser así, pedimos confirmación al usuario ...
          let recordCount = ConciliacionesBancarias_movimientosPropios.find({ conciliacionID: $scope.conciliacionBancaria._id }).count();

          if (recordCount) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios propios</em>",
                                  `Ya existen movimientos bancarios <em>propios</em> para la conciliación bancaria.<br /><br />
                                  Desea continuar y sustituir los movimientos bancarios propios que ahora existen con
                                  unos nuevos leídos desde la base de datos?
                                  `,
                                 true).then(
                                     (result) => {
                                         cargarMovimientosBancariosPropios2();
                                     },
                                     (err) => {
                                         // el usuario canceló el diálogo ...
                                         return;
                                     }
                                 );
          } else {
              // no existen movimientos bancarios propios; los leemos desde la base de datos ...
              cargarMovimientosBancariosPropios2();
          }
      }


      function cargarMovimientosBancariosPropios2() {
          $scope.showProgress = true;

          $meteor.call('bancos_conciliacion_LeerMovtosPropios', $scope.conciliacionBancaria._id).then(
              function (data) {

                  if (data.error) {
                      // el método que intenta grabar los cambis puede regresar un error cuando,
                      // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'danger',
                          msg: data.message
                      });
                      $scope.showProgress = false;
                  } else {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'info',
                          msg: data.message
                      });

                      $scope.showProgress = false;
                  }
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



















      // para leer movimientos contables y registrarlos en mongo
      $scope.cargarMovimientosBancariosAsientosContables = () => {

          if ($scope.conciliacionBancaria.docState) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos contables<em>",
                                  "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                  "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          if (!$scope.conciliacionBancaria || !$scope.conciliacionBancaria._id) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos contables<em>",
                                  "Aparentemente, la conciliación bancaria no está completa aún. " +
                                  "Ud. debe completar el registro de esta conciliación antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          // revisamos minimongo a ver si ya existen movimientos propios para la conciliación; de ser así, pedimos confirmación al usuario ...
          let recordCount = ConciliacionesBancarias_movimientosCuentaContable.find({ conciliacionID: $scope.conciliacionBancaria._id }).count();

          if (recordCount) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos contables<em>",
                                  `Ya existen movimientos bancarios <em>propios</em> para la conciliación bancaria.<br /><br />
                                  Desea continuar y sustituir los movimientos bancarios propios que ahora existen con
                                  unos nuevos leídos desde la base de datos?
                                  `,
                                 true).then(
                                     (result) => {
                                         cargarMovimientosBancariosAsientosContables2();
                                     },
                                     (err) => {
                                         // el usuario canceló el diálogo ...
                                         return;
                                     }
                                 );
          } else {
              // no existen movimientos bancarios propios; los leemos desde la base de datos ...
              cargarMovimientosBancariosAsientosContables2();
          }
      }


      function cargarMovimientosBancariosAsientosContables2() {
          $scope.showProgress = true;

          $meteor.call('bancos.conciliacion.LeerMovtosContables', $scope.conciliacionBancaria._id).then(
              function (data) {

                  if (data.error) {
                      // el método que intenta grabar los cambis puede regresar un error cuando,
                      // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'danger',
                          msg: data.message
                      });
                      $scope.showProgress = false;
                  } else {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'info',
                          msg: data.message
                      });

                      $scope.showProgress = false;
                  }
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


















      // para leer movimientos del banco y registrarlos en mongo
      $scope.cargarMovimientosBancariosDelBanco = () => {

          if ($scope.conciliacionBancaria.docState) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios del banco</em>",
                                  "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                  "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          if (!$scope.conciliacionBancaria || !$scope.conciliacionBancaria._id) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios del banco</em>",
                                  "Aparentemente, la conciliación bancaria no está completa aún. " +
                                  "Ud. debe completar el registro de esta conciliación antes de intentar ejecutar esta función.",
                                 false).then();
              return;
          }

          // revisamos minimongo a ver si ya existen movimientos propios para la conciliación; de ser así, pedimos confirmación al usuario ...
          let recordCount = ConciliacionesBancarias_movimientosBanco.find({ conciliacionID: $scope.conciliacionBancaria._id }).count();

          if (recordCount) {
              DialogModal($modal, "<em>Conciliaciones bancarias - Leer y cargar movimientos bancarios del banco</em>",
                                  `Ya existen movimientos bancarios <em>del banco</em> para la conciliación bancaria.<br /><br />
                                  Desea continuar y sustituir los movimientos bancarios del banco que ahora existen con
                                  unos nuevos leídos desde el documento Excel?
                                  `,
                                 true).then(
                                     (result) => {
                                         cargarMovimientosBancariosDelBanco2();
                                     },
                                     (err) => {
                                         // el usuario canceló el diálogo ...
                                         return;
                                     }
                                 );
          } else {
              // no existen movimientos bancarios del banco; los leemos desde el documento Excel que indique el usuario ...
              cargarMovimientosBancariosDelBanco2();
          }
      }


      function cargarMovimientosBancariosDelBanco2 () {
          // para abrir un modal que permita al usuario leer un doc excel desde el cliente e importar cada row
          // como una cuenta contable
          let modalInstance = $modal.open({
              templateUrl: 'client/bancos/conciliacionBancaria/importarDesdeExcelModal.html',
              controller: 'BancosConciliacionBancariaImportarDesdeExcel_Controller',
              size: 'lg',
              resolve: {
                  conciliacionBancaria: () => {
                      // pasamos todo el registro de la conciliación bancaria, para tener acceso al _id, desde, ...
                      return $scope.conciliacionBancaria;
                  },
                  companiaSeleccionada: () => {
                      return companiaContabSeleccionada;
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


      $scope.compararMovimientosBancarios = () => {

          if ($scope.conciliacionBancaria.docState) {
              DialogModal($modal, "<em>Conciliaciones bancarias</em>",
              "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
              "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
              false).then();
              return;
          };

          if (!$scope.conciliacionBancaria || !$scope.conciliacionBancaria._id) {
              DialogModal($modal, "<em>Conciliaciones bancarias</em>",
              "Aparentemente, la conciliación bancaria no está completa aún. " +
              "Ud. debe completar el registro de esta conciliación antes de intentar ejecutar esta función.",
              false).then();
              return;
          };


          let modalInstance = $modal.open({
              templateUrl: 'client/bancos/conciliacionBancaria/compararMovimientosModal.html',
              controller: 'BancosConciliacionBancariaComparar_Controller',
              size: 'md',
              resolve: {
                  conciliacionBancariaID: () => {
                      return $scope.conciliacionBancaria._id;
                  },
                  companiaSeleccionada: () => {
                      return companiaContabSeleccionada;
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

          // ------------------------------------------------------------------------------------------------------
          // para recibir los eventos desde la tarea en el servidor ...
          EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'conciliacionesBancarias' });
          EventDDP.addListener('bancos_conciliacionBancaria_reportProgress', function(process) {

              $scope.processProgress.current = process.current;
              $scope.processProgress.max = process.max;
              $scope.processProgress.progress = process.progress;
              // if we don't call this method, angular wont refresh the view each time the progress changes ...
              // until, of course, the above process ends ...
              $scope.$apply();
          });
  }
]);
