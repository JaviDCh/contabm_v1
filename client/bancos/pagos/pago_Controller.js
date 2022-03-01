
import moment from 'moment';
import { Monedas } from '/imports/collections/monedas';
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_Pagos_Pago_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };


      $scope.helpers({
          companiaSeleccionada: () => {
              let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
              return Companias.findOne(ciaContabSeleccionada &&
                                       ciaContabSeleccionada.companiaID ?
                                       ciaContabSeleccionada.companiaID :
                                       -999,
                                       { fields: { numero: 1, nombre: 1, nombreCorto: 1 } });
          },
      });


      $scope.miSu_List = $scope.$parent.miSu_List;

      // la lista de compañías viene desde el parent state; allí hacemos el subscribe ...
      $scope.helpers({
          proveedores: () => {
              return Proveedores.find({ },
                                      {
                                          fields:
                                          {
                                              proveedor: 1,
                                              nombre: 1,
                                              proveedorClienteFlag: 1,
                                              monedaDefault: 1,
                                              concepto: 1,
                                          }, });
          },
          monedas: () => {
              return Monedas.find({ }, { fields: { moneda: 1, descripcion: 1, }, });
          },
      });

      $scope.origen = $stateParams.origen;
      $scope.id = $stateParams.id;
      $scope.limit = parseInt($stateParams.limit);
      // convertirmos desde 'true' a true
      $scope.vieneDeAfuera = String($stateParams.vieneDeAfuera).toLowerCase() === 'true';

      // para validar las fechas originales cuando el usuario modifica el pago
      $scope.fechaOriginal = null;

      $scope.setIsEdited = function (value) {

          if (value === 'compania' && $scope.pago.proveedor) {
              // leemos la compañía para intentar inicializar el valor miSuFlag

              let compania = _.find($scope.proveedores, (x) => { return x.proveedor === $scope.pago.proveedor; });
              if (compania && compania.proveedorClienteFlag) {
                  switch (compania.proveedorClienteFlag) {
                      case 1:       // proveedor
                          $scope.pago.miSuFlag = 1;
                          break;
                      case 2:       // cliente
                          $scope.pago.miSuFlag = 2;
                          break;
                      default:
                  }
              }

              if (compania && compania.monedaDefault) {
                  $scope.pago.moneda = compania.monedaDefault;
              }

              if (compania && compania.concepto) {
                  $scope.pago.concepto = compania.concepto;
              }
          }

          if ($scope.pago.docState)
              return;

          $scope.pago.docState = 2;
      };

      $scope.windowClose = () => {
          window.close();
      }

      $scope.regresarALista = function (value) {

          if ($scope.pago && $scope.pago.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Bancos - Pagos</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                        true);

              promise.then(
                  function (resolve) {
                      $state.go('bancos.pagos.lista', { origen: $scope.origen, limit: $scope.limit });
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $state.go('bancos.pagos.lista', { origen: $scope.origen, limit: $scope.limit });
      };

      $scope.mostrarFacturasAsociadas = () => {
          var modalInstance = $modal.open({
              templateUrl: 'client/bancos/pagos/mostrarFacturasAsociadasModal.html',
              controller: 'MostrarFacturasAsociadasModal_Controller',
              size: 'lg',
              resolve: {
                  companiaContabSeleccionada: () => {
                      return $scope.companiaSeleccionada;
                  },
                  pago: () => {
                      return $scope.pago;
                  },
                  origen: () => {
                      return $scope.origen;
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


      $scope.movimientoBancario = () => {

          if (!$scope.pago || !$scope.pago.claveUnica || !$scope.pago.proveedor) {
              DialogModal($modal, "<em>Bancos - Pagos</em>",
                                  `Aparentemente, el pago no está completo aún; es decir, no tiene todos sus datos.<br />
                                   Ud. debe completar el pago y grabarlo antes de intentar ejecutar esta función.
                                  `,
                                  false).then();

              return;
          };

          var modalInstance = $modal.open({
              templateUrl: 'client/bancos/pagos/movimientosBancariosAsociadosModal.html',
              controller: 'Pagos_MovimientoBancarioAsociado_Controller',
              size: 'lg',
              resolve: {
                  pagoID: () => {
                      return $scope.pago.claveUnica;
                  },
                  proveedorID: () => {
                      return $scope.pago.proveedor;
                  },
                  ciaSeleccionada: () => {
                      return $scope.companiaSeleccionada;
                  },
                  origen: () => {
                      return $scope.origen;
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

      $scope.eliminar = function () {

          if ($scope.pago && $scope.pago.docState && $scope.pago.docState == 1) {
              DialogModal($modal, "<em>Bancos - Pagos</em>",
                                  `El registro es nuevo (no existe en la base de datos); para eliminar, simplemente
                                   haga un click en <em>Refresh</em> o <em>Regrese</em> a la lista.
                                  `,
                                  false).then();

              return;
          };

          // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
          $scope.pago.docState = 3;
      };

    $scope.refresh0 = function () {

        if ($scope.pago && $scope.pago.docState && $scope.pago.docState == 1) {
            var promise = DialogModal($modal,
                                    "<em>Bancos - Pagos</em>",
                                    `Ud. está ahora agregando un <em>nuevo</em> registro; no hay nada que refrescar.<br />
                                        Ud. puede hacer un <em>click</em> en <em>Nuevo</em> para deshacer esta operación y comenzar de nuevo.
                                    `,
                                    false);
            return;
        };

        if ($scope.pago.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Bancos - Pagos</em>",
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
    }

      $scope.refresh = () => {
          pago_leerByID_desdeSql($scope.pago.claveUnica);
      }

    $scope.nuevo0 = function () {

        if ($scope.pago.docState) {
            DialogModal($modal,
                        "<em>Bancos - Pagos</em>",
                        "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa esta operación, " +
                        "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                        true).then();
            return;
        } else { 
            $scope.nuevo();
        }
    }

    $scope.nuevo = function () {
        $scope.id = "0";                        // para que inicializarItem() agregue un nuevo registro
        inicializarItem();
    }


      $scope.asociarFacturas = () => {
          if ($scope.pago.docState) {
              DialogModal($modal, "<em>Pagos</em>",
                                  `Aparentemente, <em>se han efectuado cambios</em> en el registro.
                                   Por favor grabe los cambios antes de intentar ejecutar esta función.`,
                                 false).then();
              return;
          };

          $modal.open({
              templateUrl: 'client/bancos/pagos/asociarFacturasModal.html',
              controller: 'AsociarFacturasModal_Controller',
              size: 'lg',
              resolve: {
                  companiaContabSeleccionada: () => {
                      return $scope.companiaSeleccionada;
                  },
                  pago: () => {
                      return $scope.pago;
                  },
              }
          }).result.then(
                function (resolve) {
                    return true;
                },
                function (cancel) {
                    // cuando el proceso registra los pagos que el usuario indica, se cierra el modal en forma
                    // automática; entonces debemos leer nuevamente el pago para que se muestre la modificación
                    // que el proceso hizo al mismo (el monto es actualizado con el monto pagado); notese que el
                    // usuario también puede cerrar el modal en forma manual; en tal caso, no releemos el pago
                    if (cancel === 'pagosOK') {
                        inicializarItem();
                    }
                    return true;
                });
      }

      $scope.revertirPago = () => {

          if ($scope.pago.docState) {
              DialogModal($modal, "<em>Pagos</em>",
                                  `Aparentemente, <em>se han efectuado cambios</em> en el registro.
                                   Por favor grabe los cambios antes de intentar ejecutar esta función.`,
                                 false).then();
              return;
          }

          DialogModal($modal,
                      "<em>Bancos - Pagos</em>",
                      `Realmente, desea revertir este pago y dejar sus facturas asociadas como
                       estaban <em>antes</em> de efectuar este pago?
                      `,
                      true).then(
                          function (resolve) {
                              revertirPago2();
                          },
                          function (err) {
                              return true;
                          });
      }

      function revertirPago2() {
          // si el pago tiene un movimiento bancario asociado, debemos indicarlo al usuario y permitir
          // continuar o cancelar
          $meteor.call('bancosPagos_revertirPago1', $scope.pago.claveUnica).then(
              function (data) {

                  if (data.error) {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'danger',
                          msg: data.message
                      });
                      $scope.showProgress = false;
                  } else {
                      if (data.movimientoBancario) {
                          // el pago puede tener un moviminto bancario asociado; en ese caso, indicamos al
                          // usuario y permitirmos continuar/cancelar
                          DialogModal($modal,
                                      "<em>Bancos - Pagos</em>",
                                      `El pago que Ud. desea revertir, tiene un movimiento bancario asociado.<br />
                                       Este movimiento bancario <b>no será afectado</b> en forma alguna, si Ud.
                                       ejecuta este proceso y revierte el pago.<br /><br />
                                       Ud. puede consultar este movimiento bancario para eliminarlo
                                       o modificarlo, en la forma que le parezca adecuada.<br /><br />
                                       Aún así, desea continuar y revertir este pago?
                                      `,
                                      true).then(
                                          function (resolve) {
                                              revertirPago3();
                                          },
                                          function (err) {
                                              return true;
                                          });
                      } else {
                          // el pago no tiene un movimiento bancario; simplente, revertimos
                          revertirPago3();
                      }
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
              });
      }

      function revertirPago3() {
          $meteor.call('bancosPagos_revertirPago2', $scope.pago.claveUnica).then(
              function (data) {
                  if (data.error) {
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
                      inicializarItem();
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
              });
      }

    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        if (!$scope.pago.docState) {
            DialogModal($modal, "<em>Pagos</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro.
                                No hay nada que grabar.`,
                                false).then();
            return;
        }

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItem = _.cloneDeep($scope.pago);

        // nótese como intentamos hacer un clean() al schema para que se establezcan sus default values y, en general,
        // simple-schema "limpie" el objeto usando el schema como base ...

        // por ejemplo, solo luego de hacer el "clean" al objeto, los default values serán aplicados ...
        const mySchema = Pagos.simpleSchema();
        const cleanDoc = mySchema.clean(editedItem);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

        if (editedItem.docState != 3) {
            isValid = Pagos.simpleSchema().namedContext().validate(editedItem);

            if (!isValid) {
                Pagos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Pagos.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
                })
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
            })

            $scope.showProgress = false;
            return;
        }

        $meteor.call('pagosSave', editedItem,
                                $scope.fechaOriginal,
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

                    // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                    $scope.id = data.id;

                    // nótese que siempre, al registrar cambios, leemos el registro desde sql server; la idea es
                    // mostrar los datos tal como fueron grabados y refrescarlos para el usuario. Cuando el
                    // usuario elimina el registro, su id debe regresar en -999 e InicializarItem no debe
                    // encontrar nada ...
                    inicializarItem($scope.id);
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

    $scope.pago = {};

    function inicializarItem() {
        $scope.showProgress = true;

        if ($scope.id == "0") {
            let usuario =  Meteor.user();

            $scope.pago = {};
            let pago = {
                claveUnica: 0,
                fecha: new Date(),

                ingreso: new Date(),
                ultAct: new Date(),
                usuario: usuario ? usuario.emails[0].address : null,
                cia: $scope.companiaSeleccionada.numero,

                docState: 1,
            };

            // para hacer un clean al objecto y, por ejemplo, se agreguen los default values 
            $scope.pago = Pagos.simpleSchema().clean(pago); 

            $scope.alerts.length = 0;
            $scope.showProgress = false;
        }
        else {
            $scope.showProgress = true;
            pago_leerByID_desdeSql(parseInt($scope.id));
        }
    }

    inicializarItem();

    function pago_leerByID_desdeSql(pk) {
        // ejecutamos un método para leer el pago desde sql server
        Meteor.call('pago.leerByID.desdeSql', pk, (err, result) => {

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

            $scope.pago = {};
            $scope.pago = JSON.parse(result);

            if ($scope.pago == null) {
                // el usuario eliminó el registro y, por eso, no pudo se leído desde sql
                $scope.pago = {};

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // las fechas vienen serializadas como strings; convertimos nuevamente a dates
            $scope.pago.fecha = $scope.pago.fecha ? moment($scope.pago.fecha).toDate() : null;
            $scope.pago.ingreso = $scope.pago.ingreso ? moment($scope.pago.ingreso).toDate() : null;
            $scope.pago.ultAct = $scope.pago.ultAct ? moment($scope.pago.ultAct).toDate() : null;

            // mantenemos las fechas originales para poder validar luego si el usuario las cambia
            $scope.fechaOriginal = $scope.pago.fecha;

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
  }
]);
