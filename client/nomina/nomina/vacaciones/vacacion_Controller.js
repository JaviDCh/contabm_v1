
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { Empleados } from '/models/nomina/empleados'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Nomina_Vacacion_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let companiaContabSeleccionada = $scope.$parent.companiaSeleccionada; ;

      $scope.origen = $stateParams.origen;
      $scope.id = $stateParams.id;
      $scope.pageNumber = parseInt($stateParams.pageNumber);
      $scope.vieneDeAfuera = String($stateParams.vieneDeAfuera).toLowerCase() === 'true';  // nótese como convertirmos 'true' a true


      $scope.setIsEdited = function (itemName) {
          if (itemName) {
              switch (itemName) {
                  case 'salida': {
                      if ($scope.vacacion.salida && !$scope.vacacion.regreso) {
                          $scope.vacacion.regreso = $scope.vacacion.salida;
                      };

                      if ($scope.vacacion.salida && !$scope.vacacion.periodoPagoDesde) {
                          $scope.vacacion.periodoPagoDesde = $scope.vacacion.salida;
                      };

                      break;
                  };
                  case 'regreso': {
                      if ($scope.vacacion.regreso && !$scope.vacacion.periodoPagoHasta) {
                          $scope.vacacion.periodoPagoHasta = $scope.vacacion.regreso;
                      };

                      break;
                  };
              };
          };

          if ($scope.vacacion.docState)
              return;

          $scope.vacacion.docState = 2;
      };

      $scope.regresarALista = function () {

          if ($scope.vacacion && $scope.vacacion.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Vacaciones</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                        true);

              promise.then(
                  function (resolve) {
                      $state.go('nomina.vacaciones.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $state.go('nomina.vacaciones.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
      };

      $scope.eliminar = function () {

          if ($scope.id == "-999") {
              // el item fue eliminado; no hay nada que eliminar ...
              return;
          };

          if ($scope.vacacion && $scope.vacacion.docState && $scope.vacacion.docState == 1) {
              DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                                  "El registro es nuevo (no existe en la base de datos); para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                  false).then();
              return;
          };

          // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
          $scope.vacacion.docState = 3;
      };

      $scope.refresh0 = function () {

          if ($scope.id == "-999") {
              // el item fue eliminado; no hay nada que refrescar ...
              return;
          };

          if ($scope.vacacion && $scope.vacacion.docState && $scope.vacacion.docState == 1) {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Vacaciones</em>",
                                        `Ud. está ahora agregando un <em>nuevo</em> registro; no hay nada que refrescar.<br />
                                         Ud. puede hacer un <em>click</em> en <em>Nuevo</em> para deshacer esta operación y comenzar de nuevo.
                                        `,
                                        false);
              return;
          };

          if ($scope.vacacion && $scope.vacacion.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Vacaciones</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>refrescar el registro</em> y perder los cambios?",
                                        true).then(
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
          // leemos, con un subscribe, nuevamente el registro, desde mongo en el servidor
          leerVacacion($scope.id);
      };


      $scope.nuevo0 = function () {
        if ($scope.vacacion && $scope.vacacion.docState) {
            DialogModal($modal,
                          "<em>Nómina - Vacaciones</em>",
                          "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa esta operación, " +
                          "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                          true).then(
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
            inicializarItem($scope.id);
        };


      $scope.grabar = function () {

          if (!$scope.vacacion.docState) {
              DialogModal($modal, "<em>Vacaciones</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                 false).then();
              return;
          };

          $scope.showProgress = true;

          // obtenemos un clone de los datos a guardar ...
          let editedItem = _.cloneDeep($scope.vacacion);

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          if (editedItem.docState != 3) {
              isValid = Vacaciones.simpleSchema().namedContext().validate(editedItem);

              if (!isValid) {
                  Vacaciones.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                      errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Vacaciones.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

          $meteor.call('vacacionesSave', editedItem).then(
              function (data) {
                //   debugger;
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data.message
                  });

                  // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                  $scope.id = data.id;

                  // solo si el item es nuevo, no hemos creado un helper para el mismo (pues es nuevo y no
                  // existía en mongo); lo hacemos ahora para que el item que se ha agregado en mongo sea el
                  // que efectivamente se muestra al usuario una vez que graba el item en mongo. Además, para
                  // agregar el 'reactivity' que existe para items que existían y que se editan
                  if ($scope.vacacion && $scope.vacacion.docState && $scope.vacacion.docState == 1) {
                      // 'iniclaizar...' lee el registro recién agregado desde mongo y agrega un 'helper' para él ...
                      inicializarItem($scope.id);
                  };

                  $scope.showProgress = false;
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

      $scope.calcular = function() {

          if (!$scope.vacacion) {
              DialogModal($modal, "<em>Vacaciones</em>",
                                  `No hay una vacación que calcular.
                                  Ud. debe agregar o modificar una vacación para que, entonces, pueda ser calculada.`,
                                 false).then();
              return;
          };

          var modalInstance = $modal.open({
              templateUrl: 'client/nomina/nomina/vacaciones/vacacionesCalcularModal.html',
              controller: 'VacacionesCalcularModal_Controller',
              size: 'md',
              resolve: {
                  vacacion: () => {
                      return $scope.vacacion;
                  },
                  companiaContabSeleccionada: () => {
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

      $scope.helpers({
          empleados: () => {
              return Empleados.find({ cia: companiaContabSeleccionada.numero });
          },
          gruposEmpleados: () => {
              return GruposEmpleados.find({ cia: companiaContabSeleccionada.numero });
          },
      });


      function inicializarItem(id) {
        //   debugger;
          $scope.showProgress = true;

          if (id == "0") {
              $scope.vacacion = {};
              $scope.vacacion = {
                  _id: new Mongo.ObjectID()._str,
                  claveUnicaContab: 0,
                  cia: companiaContabSeleccionada.numero,
                  docState: 1
                };

                $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
                $scope.showProgress = false;
          }
          else {
            leerVacacion(id);
          };
      };


      inicializarItem($scope.id);

      function leerVacacion(id) {
          $scope.subscribe("vacaciones", () => [{ _id: id }],
          {
                onReady: function() {
                  $scope.helpers({
                      vacacion: () => {
                          return Vacaciones.findOne(id);
                      },
                  });


                  if ($scope.vacacion) {
                      $scope.helpers({
                          empleado: () => {
                              let empleadoID = $scope.vacacion && $scope.vacacion.empleado ? $scope.vacacion.empleado : -999;
                              return Empleados.findOne({ empleado: empleadoID });
                          },
                      });
                  };

                  // en este momento tenemos la vacación y el empleado ...
                  $scope.showProgress = false;
                  $scope.$apply();
                }
          });
      };

      $scope.grabarRegistroNomina0 = function() {

          if (!$scope.vacacion) {
              DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                          `Ud. debe registrar una vacación antes de intentar ejecutar esta función.
                          `, false);
              return;
          };

          if ($scope.vacacion.docState) {
              DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                          `Ud. debe registrar los cambios antes de intentar ejecutar esta función.
                          `, false);
              return;
          };

          if (!$scope.vacacion.claveUnicaContab) {
              DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                          `Error inesperado. La vacación no tiene un <em>ID para Contab</em>.
                           Debe tenerlo, para poder grabar un registro de nómina para esta vacación.<br />
                           Por favor revise.
                          `, false);
              return;
          };

          if (!$scope.vacacion.fechaNomina) {
              DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                          `La vacación debe tener un valor en el campo <em>Fecha de nómina</em>.
                           Debe tenerlo, para poder grabar un registro de nómina para esta vacación.
                          `, false);
              return;
          };


          DialogModal($modal, "<em>Nómina - Vacaciones</em>",
                      `Este proceso agrega un registro al proceso de nómina de pago, para que Ud. pueda,
                       justamente, ejecutar el proceso de nómina que corresponde al pago de esta vacación.
                       <br /><br />
                       ¿Desea continuar y grabar, para esta vacación, un registro de nómina al proceso de nómina de pago?`,
                       true).then(
              function (resolve) {
                  grabarRegistroNomina();
              },
              function (err) {
                  return true;
              });
          };

      function grabarRegistroNomina () {

            $scope.showProgress = true;

            $meteor.call('nomina.vacaciones.grabarRegistroNomina', $scope.vacacion).then(
                function (data) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: data.message
                    });

                    $scope.showProgress = false;
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

  }
]);
