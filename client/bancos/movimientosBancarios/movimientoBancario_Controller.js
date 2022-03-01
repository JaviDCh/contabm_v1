
import moment from 'moment';
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 
import { Chequeras } from '/imports/collections/bancos/chequeras'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_MovimientosBancarios_MovimientoBancario_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // leemos la compañía seleccionada
      $scope.helpers({
          companiaSeleccionada: () => {
              let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
              return Companias.findOne(ciaContabSeleccionada ? ciaContabSeleccionada.companiaID : -999,
                                       { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1 } });
          },
          chequerasList: () => {
              let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
              let companiaSeleccionada = Companias.findOne(
                  ciaContabSeleccionada ? ciaContabSeleccionada.companiaID : '-xyz', {
                      fields: { numero: 1, }
                  });
              return Chequeras.find({ cia: companiaSeleccionada ? companiaSeleccionada.numero : -999 });
          },
          proveedores: () => {
              return Proveedores.find();
          },
      });


      $scope.origen = $stateParams.origen;
      $scope.id = $stateParams.id;
      $scope.limit = parseInt($stateParams.limit);
      $scope.vieneDeAfuera = String($stateParams.vieneDeAfuera).toLowerCase() === 'true';  // nótese como convertirmos 'true' a true

      $scope.setIsEdited = function (value) {

          if (value == 'provClte' && $scope.movimientoBancario.provClte) {
              let compania = Proveedores.findOne({ proveedor: $scope.movimientoBancario.provClte });

              if (compania) {
                  let beneficiario = compania.beneficiario ? compania.beneficiario : null;
                  let concepto = compania.concepto ? compania.concepto : null;
                  let montoBase = compania.montoCheque ? compania.montoCheque : null;

                  if (!$scope.movimientoBancario.beneficiario && beneficiario) {
                      $scope.movimientoBancario.beneficiario = beneficiario;
                  };

                  if (!$scope.movimientoBancario.concepto && concepto) {
                      $scope.movimientoBancario.concepto = concepto;
                  };

                  if (!$scope.movimientoBancario.montoBase && montoBase) {
                      $scope.movimientoBancario.montoBase = montoBase;
                  };
              };
          };


          // cuando el usuario cambia el tipo, debemos reconstruir la lista de chequeras;
          // normalmente, el usuario cambiará el tipo *solo* cuando está agregando un movimiento;
          // esto, sin embargo, no tiene siempre que se cierto ...
          // nota: para cheques, el usuario debe ver solo chequeras activas y no agotadas; para otros
          // tipos de movimiento, solo las chequeras 'genéricas'
          if (value == 'tipo') {
              let filtro = "";

              if ($scope.movimientoBancario.tipo === 'CH') {
                  // cheque: seleccionamos y mostramos en la lista del ddl solo chequeras (no genéricas)
                  // y no agotadas ...
                  filtro = { activa: true, generica: false, agotadaFlag: false, cia: $scope.companiaSeleccionada.numero };
              } else {
                  // no cheque: seleccionamos y mostramos en la lista del ddl solo chequeras genéricas
                  filtro = { activa: true, generica: true, cia: $scope.companiaSeleccionada.numero };
              };

              $scope.helpers({
                  chequerasList: () => {
                      return Chequeras.find(filtro,
                          { sort: {
                              abreviaturaBanco: 1,
                              simboloMoneda: 1,
                              numeroCuentaBancaria: 1,
                              desde: 1,
                          }});
                  },
              });

              // inicializamos el signo en base al tipo indicado ...
              // el signo es true para '+' y false para '-'
              switch ($scope.movimientoBancario.tipo) {
                  case 'TR':
                  case 'ID':
                  case 'IT':
                  case 'ND':
                  case 'CH':
                      $scope.movimientoBancario.signo = false;
                      break;
                  case 'NC':
                  case 'DP':
                      $scope.movimientoBancario.signo = true;
                      break;
                  default:
              }
          }

          if (value == 'claveUnicaChequera' && $scope.movimientoBancario && $scope.movimientoBancario.claveUnicaChequera ) {
              if ($scope.movimientoBancario.tipo && $scope.movimientoBancario.tipo === 'CH') {
                  // el último cheque usado en la chequera viene con la misma; intentamos asignar el próximo
                  let chequera = Chequeras.findOne({
                      numeroChequera: $scope.movimientoBancario.claveUnicaChequera
                  });

                  if (chequera && chequera.ultimoChequeUsado) {
                      $scope.movimientoBancario.transaccion = chequera.ultimoChequeUsado + 1;
                  } else {
                      // probablemente no hay un número de 'ultimo cheque usado' porque la chequera
                      // no se ha usado aún
                      if (chequera.desde) {
                          $scope.movimientoBancario.transaccion = chequera.desde;
                      };
                  };
              };
          }


          if (value == 'monto' || value == 'signo' || value == 'montoBase' || value == 'comision' || value == 'impuestos' || value == 'provClte' || value == 'tipo') {

              // los costos son siempre negativos ...
              if ($scope.movimientoBancario.comision && $scope.movimientoBancario.comision  > 0) {
                  $scope.movimientoBancario.comision *= -1;
              }

              if ($scope.movimientoBancario.impuestos && $scope.movimientoBancario.impuestos  > 0) {
                  $scope.movimientoBancario.impuestos *= -1;
              }

              // siempre revisamos el monto base para asignarles el signo correcto ...
              if ($scope.movimientoBancario.signo === true && $scope.movimientoBancario.montoBase && $scope.movimientoBancario.montoBase < 0) {
                  $scope.movimientoBancario.montoBase *= -1;
              }

              if ($scope.movimientoBancario.signo === false && $scope.movimientoBancario.montoBase && $scope.movimientoBancario.montoBase > 0) {
                  $scope.movimientoBancario.montoBase *= -1;
              }

              let montoBase = $scope.movimientoBancario.montoBase ? $scope.movimientoBancario.montoBase : 0;
              let comision = $scope.movimientoBancario.comision ? $scope.movimientoBancario.comision : 0;
              let impuestos = $scope.movimientoBancario.impuestos ? $scope.movimientoBancario.impuestos : 0;

              $scope.movimientoBancario.monto = montoBase + comision + impuestos;
          }


          if ($scope.movimientoBancario.docState)
              return;

          $scope.movimientoBancario.docState = 2;
      };

      $scope.windowClose = () => {
          window.close();
      }

      $scope.regresarALista = function () {

          if ($scope.movimientoBancario && $scope.movimientoBancario.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Movimientos bancarios</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                        true);

              promise.then(
                  function (resolve) {
                      $state.go('bancos.movimientosBancarios.lista', { origen: $scope.origen, limit: $scope.limit });
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $state.go('bancos.movimientosBancarios.lista', { origen: $scope.origen, limit: $scope.limit });
      };

      $scope.eliminar = function () {

          if ($scope.movimientoBancario && $scope.movimientoBancario.docState && $scope.movimientoBancario.docState == 1) {
              DialogModal($modal, "<em>Bancos - Movimientos bancario</em>",
                                  "El registro es nuevo (no existe en la base de datos); para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                  false).then();

              return;
          };

          // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
          $scope.movimientoBancario.docState = 3;
      };

      $scope.refresh0 = function () {

          if ($scope.movimientoBancario && $scope.movimientoBancario.docState && $scope.movimientoBancario.docState == 1) {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Movimientos bancarios</em>",
                                        `Ud. está ahora agregando un <em>nuevo</em> registro; no hay nada que refrescar.<br />
                                         Ud. puede hacer un <em>click</em> en <em>Nuevo</em> para deshacer esta operación y comenzar de nuevo.
                                        `,
                                        false);
              return;
          };

          if ($scope.movimientoBancario.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Movimientos bancarios</em>",
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


      $scope.nuevo0 = function () {

            if ($scope.movimientoBancario.docState) {
                var promise = DialogModal($modal,
                                          "<em>Bancos - Movimientos bancarios</em>",
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

            // mantenemos la fecha original del movimiento en el scope, para impedir que se modifique un
            // movimiento para un mes ya cerrado en Bancos
            $scope.fechaOriginalMovimientoBancario = null;

            inicializarItem();
        };


        $scope.asientoContable = function() {

            var modalInstance = $modal.open({
                templateUrl: 'client/generales/asientosContablesAsociados/asientosContablesAsociadosModal.html',
                controller: 'AsientosContablesAsociados_Controller',
                size: 'lg',
                resolve: {
                    provieneDe: () => {
                        return "Bancos";
                    },
                    entidadID: () => {
                        return $scope.movimientoBancario.claveUnica;
                    },
                    ciaSeleccionada: () => {
                        return $scope.companiaSeleccionada;
                    },
                    origen: () => {
                        return $scope.origen;
                    },
                    docState: () => {
                        return $scope.movimientoBancario.docState ? $scope.movimientoBancario.docState : "";
                    }
                },
            }).result.then(
                  function (resolve) {
                      return true;
                  },
                  function (cancel) {
                      return true;
                  });
        };


        $scope.chequeImpreso = function() {

            var modalInstance = $modal.open({
                templateUrl: 'client/bancos/movimientosBancarios/chequeImpresoModal.html',
                controller: 'ChequeImpresoModalController',
                size: 'lg',
                resolve: {
                    tiposArchivo: () => {
                        return ['BANCOS-CHEQUES'];
                    },
                    aplicacion: () => {
                        return 'bancos';              // nómina, bancos, contab, ...
                    },
                    ciaSeleccionada: function () {
                        // pasamos la entidad (puede ser: contratos, siniestros, ...) solo para marcar docState si se agrega/eliminar
                        // un documento (y no se había 'marcado' esta propiedad antes)...
                        return $scope.companiaSeleccionada;
                    },
                    movimientoBancarioID: () => {
                        return $scope.movimientoBancario && $scope.movimientoBancario.claveUnica ? $scope.movimientoBancario.claveUnica : 0;              // nómina, bancos, contab, ...
                    },
                    user: () => {
                        return Meteor.user().emails[0].address;              // nómina, bancos, contab, ...
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


      // -------------------------------------------------------------------------
      // Grabar las modificaciones hechas al siniestro
      // -------------------------------------------------------------------------
      $scope.grabar = function () {

          if (!$scope.movimientoBancario.docState) {
              DialogModal($modal, "<em>Movimientos bancarios</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                 false).then();
              return;
          };

          $scope.showProgress = true;

          // obtenemos un clone de los datos a guardar ...
          let editedItem = _.cloneDeep($scope.movimientoBancario);

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          if (editedItem.docState != 3) {
              isValid = MovimientosBancarios.simpleSchema().namedContext().validate(editedItem);

              if (!isValid) {
                  MovimientosBancarios.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                      errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + MovimientosBancarios.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                  });
              }
          };

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

          $meteor.call('movimientosBancariosSave', editedItem,
                       $scope.fechaOriginalMovimientoBancario,
                       $scope.companiaSeleccionada.numero).then(
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

                      // para registros nuevos, 'empleadosSave' regresa el número del nuevo empleado (desde sql server)
                      movimientoBancario_leerByID_desdeSql(parseInt(data.id));
                  };
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

      // creamos una lista para inicializar los posibles valores en el Select para el item Signo
      // intentamos usar Options (value: + => +), pero no funciona en angular ...
      $scope.signoOptions = [{ label: '+', value: true }, { label: '-', value: false }];


      $scope.movimientoBancario = {};

      function inicializarItem() {
          $scope.showProgress = true;

          if ($scope.id == "0") {

              let usuario =  Meteor.user();

              $scope.movimientoBancario = {};
              $scope.movimientoBancario = {
                 docState: 1,
                 fecha: new Date(),
                 ingreso: new Date(),
                 ultMod: new Date(),
                 usuario: usuario ? usuario.emails[0].address : null,
            };

            $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
            $scope.showProgress = false;
          }
          else {
            $scope.showProgress = true;
            // guardamos la fecha original del movimiento para impedir modificar si corresponde a un
            // mes cerrado en Bancos ...
            movimientoBancario_leerByID_desdeSql(parseInt($scope.id));
          };
      };

      // mantenemos la fecha original del movimiento en el scope, para impedir que se modifique un
      // movimiento para un mes ya cerrado en Bancos
      $scope.fechaOriginalMovimientoBancario = null;

      inicializarItem();

      function movimientoBancario_leerByID_desdeSql(pk) {
          // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
          Meteor.call('movimientoBancario.leerByID.desdeSql', pk, (err, result) => {

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

              $scope.movimientoBancario = {};
              $scope.movimientoBancario = JSON.parse(result);

              if ($scope.movimientoBancario == null) {
                  // el usuario eliminó el empleado y, por eso, no pudo se leído desde sql
                  $scope.movimientoBancario = {};
                  $scope.showProgress = false;
                  $scope.$apply();

                  return;
              };

              // las fechas vienen serializadas como strings; convertimos nuevamente a dates
              $scope.movimientoBancario.fecha = $scope.movimientoBancario.fecha ? moment($scope.movimientoBancario.fecha).toDate() : null;
              $scope.movimientoBancario.fechaEntregado = $scope.movimientoBancario.fechaEntregado ? moment($scope.movimientoBancario.fechaEntregado).toDate() : null;
              $scope.movimientoBancario.ingreso = $scope.movimientoBancario.ingreso ? moment($scope.movimientoBancario.ingreso).toDate() : null;
              $scope.movimientoBancario.ultMod = $scope.movimientoBancario.ultMod ? moment($scope.movimientoBancario.ultMod).toDate() : null;

              $scope.fechaOriginalMovimientoBancario = $scope.movimientoBancario.fecha;

              $scope.showProgress = false;
              $scope.$apply();
          });
      };
  }
]);
