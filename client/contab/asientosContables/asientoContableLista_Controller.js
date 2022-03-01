


import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Contab_AsientoContableLista_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants', 
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    $scope.origen = $stateParams.origen;
    var pageNumber = $stateParams.pageNumber;
    
    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0, 
        message: "", 
    };

    // -------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'asientos.lista.corregirAsientosMas2Decimales' });
    EventDDP.addListener('contab_asientos.lista.corregirAsientosMas2Decimales_reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        $scope.processProgress.message = process.message ? process.message : null;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // -------------------------------------------------------------------------------------------------------

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada) { 
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID);
    }
    // ------------------------------------------------------------------------------------------------

    $scope.regresarALista = function () {
        $scope.$parent.alerts.length = 0; 
        $state.go("contab.asientosContables.filter", { origen: $scope.origen });
    }


    $scope.nuevo = function () {
        $state.go('contab.asientosContables.asientoContable', {
            origen: $scope.origen,
            id: "0",
            pageNumber: 0,                          // nota: por ahora no vamos a paginar; tal vez luego, cuando esto funcione bien ...
            vieneDeAfuera: false
        })
    }


    $scope.imprimir = function() {

        if (!lodash.isArray($scope.asientosContables) || lodash.isEmpty($scope.asientosContables)) {
            DialogModal($modal, "<em>Asientos Contables</em>",
                        "Aparentemente, no se han seleccionado registros; no hay nada que imprimir.",
                        false).then();
            return;
        };

        let ordenarListadoPorFechaRegistro = false;

        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/imprimirListadoAsientosContables.html',
            controller: 'ImprimirListadoAsientosContablesModalController',
            size: 'md',
            resolve: {
                ciaSeleccionada: function () {
                    return companiaContab;
                },
            }
        }).result.then(
              function (resolve) {

                  let opciones = {
                      ordenarListadoPorFechaRegistro: resolve.ordenarPorFechaRegistro,
                      saveToDisk: resolve.saveToDisk
                  };

                  AsientosContables_Methods.imprimirListadoAsientosContables($scope.asientosContables, companiaContab, opciones);

                  return true;
              },
              function (cancel) {
                  return true;
              });
      }

    $scope.exportarAsientosContables_csv = () => {

        if (!lodash.isArray($scope.asientosContables) || lodash.isEmpty($scope.asientosContables)) {
            DialogModal($modal, "<em>Asientos Contables - Exportar formato csv</em>",
                        "Aparentemente, no se han seleccionado registros; no hay nada que exportar.",
                        false).then();
            return;
        };

        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/exportarAsientosContables_csv_Modal.html',
            controller: 'ExportarAsientosContables_csv_ModalController',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });

    }


    let asientosContables_ui_grid_api = null;
    let asientoContableSeleccionado = {};

    let itemSeleccionadoParaSerEliminado = false;

    $scope.asientosContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            asientosContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                asientoContableSeleccionado = {};

                if (row.isSelected) {
                    asientoContableSeleccionado = row.entity;

                    if (itemSeleccionadoParaSerEliminado) {
                        // cuando el usuario hace un click en 'x' para eliminar el item en la lista, no lo mostramos en el tab que sigue
                        itemSeleccionadoParaSerEliminado = false;
                        return;
                    }

                    asientoContable_leerByID_desdeSql(asientoContableSeleccionado.numeroAutomatico);
                }
                else { 
                    return;
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

    $scope.asientosContables_ui_grid.columnDefs = [
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
            name: 'numero',
            field: 'numero',
            displayName: '#',
            width: '60',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'fecha',
            field: 'fecha',
            displayName: 'Fecha',
            width: '80',
            enableFiltering: true,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'date'
        },
        {
            name: 'tipo',
            field: 'tipo',
            displayName: 'Tipo',
            width: '70',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: '240',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'moneda',
            field: 'moneda',
            displayName: 'Mon',
            width: '50',
            enableFiltering: true,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'monedaOriginal',
            field: 'monedaOriginal',
            displayName: 'Mon orig',
            width: '80',
            enableFiltering: true,
            cellFilter: 'monedaSimboloFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            pinnedLeft: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'cantidadPartidas',
            field: 'cantidadPartidas',
            displayName: 'Lineas',
            width: '50',
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {
            name: 'totalDebe',
            field: 'totalDebe',
            displayName: 'Total debe',
            width: '120',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'totalHaber',
            field: 'totalHaber',
            displayName: 'Total haber',
            width: '120',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'factorDeCambio',
            field: 'factorDeCambio',
            displayName: 'Factor cambio',
            width: '90',
            enableFiltering: true,
            cellFilter: 'currencyFilter',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'provieneDe',
            field: 'provieneDe',
            displayName: 'Origen',
            width: '80',
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'asientoTipoCierreAnualFlag',
            field: 'asientoTipoCierreAnualFlag',
            displayName: 'Cierre anual',
            width: '80',
            enableFiltering: true,
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'ingreso',
            field: 'ingreso',
            displayName: 'Ingreso',
            width: '100',
            enableFiltering: true,
            cellFilter: 'dateTimeFilter',
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
            width: '100',
            enableFiltering: true,
            cellFilter: 'dateTimeFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            pinnedLeft: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        // nótese como  indicamos que el usuario no quiere seleccionar el item en la lista, solo marcarlo para ser eliminado;
        // la idea es que el item se marque para ser eliminado, pero *no se muestre* (sus detalles) en el próximo state ...

        if (item.docState === 3) {
            delete $scope.asientosContables.find(x => x._id === item._id).docState; 
        }
        else { 
            $scope.asientosContables.find(x => x._id === item._id).docState = 3;
        }

        itemSeleccionadoParaSerEliminado = true;
    }

    // solo para eliminar los registros que el usuario 'marca' en la lista
    $scope.grabarEliminaciones = () => {

        if (!$scope.asientosContables.find((x) => x.docState && x.docState === 3)) {
            DialogModal($modal, "<em>Contab - Asientos contables - Eliminar desde la lista</em>",
                                `Aparentemente, <em>Ud. no ha marcado</em> registros en la lista para ser eliminados.<br />.<br />
                                 Recuerde que mediante esta función Ud. puede eliminar los registros que se hayan <em>marcado</em> (
                                 haciendo un <em>click</em> en la x roja al final de cada registro) para ello en la lista.`,
                                false).then();
            return;
        }

        grabarEliminaciones2();
    }

    let grabarEliminaciones2 = function() {

        $scope.showProgress = true;
        let registrosAEliminar = $scope.asientosContables.filter((x) => x.docState && x.docState === 3).
                                                          map(x => { return {  _id: x._id, 
                                                                               numeroAutomatico: x.numeroAutomatico, 
                                                                               fecha: x.fecha, 
                                                                               asientoTipoCierreAnualFlag: x.asientoTipoCierreAnualFlag, 
                                                                               cia: x.cia, 
                                                                               docState: x.docState
                                                                   }});

        Meteor.call('contab.asientosContables.eliminar', registrosAEliminar, (err, resolve) => {

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

            $scope.asientosContables_ui_grid.data = [];

            // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
            Meteor.subscribe('tempConsulta_asientosContables', () => {

                $scope.helpers({
                    asientosContables: () => Temp_Consulta_AsientosContables.find({ user: Meteor.userId() }, { sort: { fecha: true, numero: true }}), 
                })

                $scope.asientosContables_ui_grid.data = $scope.asientosContables;

                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'info',
                    msg: resolve
                });

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }


    function asientoContable_leerByID_desdeSql(pk) {

        $scope.showProgress = true;

        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
        Meteor.call('asientoContable_leerByID_desdeSql', pk, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
    
                return;
            }

            $state.go('contab.asientosContables.asientoContable', {
                origen: $scope.origen,
                id: result.asientoContableMongoID,
                pageNumber: 0,
                vieneDeAfuera: false
            })
        })
    }

    $scope.asientosContables = []
    $scope.asientosContables_ui_grid.data = [];

    // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
    $scope.showProgress = true;
    Meteor.subscribe('tempConsulta_asientosContables', () => {

        $scope.helpers({
            asientosContables: () => Temp_Consulta_AsientosContables.find({ user: Meteor.userId() }, { sort: { fecha: true, numero: true }}), 
        })

        $scope.asientosContables_ui_grid.data = $scope.asientosContables;

        $scope.$parent.alerts.length = 0;
        $scope.$parent.alerts.push({
            type: 'info',
            msg: `<b>${$scope.asientosContables.length.toString()}</b> registros han sido seleccionados ...`
        });

        $scope.showProgress = false;
        $scope.$apply();
    })

    $scope.exportarAsientosContables = () => {
        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/exportarAArchivoTexto_Modal.html',
            controller: 'ExportarAArchivoTextoModal_Controller',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }


    $scope.importarAsientosContables = () => {
        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/importarAsientosDesdeArchivoTexto_Modal.html',
            controller: 'ImportarAsientosDesdeArchivoTexto_Controller',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContab;
                }
            }
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    }


    $scope.corregirMontosMas2Decimales = function() { 

        $scope.showProgress = true; 

        // construimos un array con los IDs de los asientos en la lista, para enviarlo a un meteor method que corrija estos 
        // asientos ... 
        let asientosSeleccionadosArray = []; 

        for (let asiento of $scope.asientosContables) { 
            asientosSeleccionadosArray.push(asiento.numeroAutomatico); 
        }

        Meteor.call('asientosContables.mas2decimales.corregir', asientosSeleccionadosArray, (err, result) => {

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
                
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message
            });

            $scope.showProgress = false;
            $scope.$apply();
        })
        
    }

  }
]);
