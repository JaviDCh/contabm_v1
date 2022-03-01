
import moment from 'moment';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Empleados } from '/models/nomina/empleados'; 
import { Bancos } from '/imports/collections/bancos/bancos';

import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Nomina_Empleado_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants',
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

      let companiaContabSeleccionada;

      if (companiaSeleccionada)
          companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID);
      // ------------------------------------------------------------------------------------------------

      $scope.origen = $stateParams.origen;
      $scope.id = $stateParams.id;
      $scope.pageNumber = parseInt($stateParams.pageNumber);
      $scope.vieneDeAfuera = String($stateParams.vieneDeAfuera).toLowerCase() === 'true';  // nótese como convertirmos 'true' a true


      $scope.setIsEdited = function () {
          if ($scope.empleado.docState)
              return;

          $scope.empleado.docState = 2;
      };

      $scope.regresarALista = function () {

          if ($scope.empleado && $scope.empleado.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Empleados</em>",
                                        "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                        true);

              promise.then(
                  function (resolve) {
                      $state.go('nomina.empleados.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                  },
                  function (err) {
                      return true;
                  });

              return;
          }
          else
              $state.go('nomina.empleados.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
      };

      $scope.eliminar = function () {

          if ($scope.empleado && $scope.empleado.docState && $scope.empleado.docState == 1) {
              DialogModal($modal, "<em>Nómina - Empleados</em>",
                                  "El registro es nuevo (no existe en la base de datos); para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                  false).then();

              return;
          };

          // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
          $scope.empleado.docState = 3;
      };

      $scope.refresh0 = function () {

          if ($scope.empleado && $scope.empleado.docState && $scope.empleado.docState == 1) {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Empleados</em>",
                                        `Ud. está ahora agregando un <em>nuevo</em> registro; no hay nada que refrescar.<br />
                                         Ud. puede hacer un <em>click</em> en <em>Nuevo</em> para deshacer esta operación y comenzar de nuevo.
                                        `,
                                        false);
              return;
          };

          if ($scope.empleado.docState && $scope.origen == 'edicion') {
              var promise = DialogModal($modal,
                                        "<em>Nómina - Empleados</em>",
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

          // hacemos un nuevo subscribe para volver a leer el asiento contable; solo desde mongo; desde la lista,
          // se leyó el asiento contable desde sql server y se grabó a mongo; al refrescar, lo volvemos a leer, tal
          // como fue grabado en mongo ...

          // nótese como, en este caso (empleados), no grabamos el empleado a mongo; solo leemos, nuevamente,
          // desde sql server ...

          //   debugger;
          empleados_leerByID_desdeSql(empleado.empleado);
      };


      $scope.imprimir = () => {

          var modalInstance = $modal.open({
              templateUrl: 'client/contab/asientosContables/imprimirAsientosContables_Opciones_Modal.html',
              controller: 'ImprimirAsientosContables_Opciones_Modal_Controller',
              size: 'md',
              resolve: {
                  companiaSeleccionadaDoc: () => {
                      return companiaContabSeleccionada;
                  }
              }
          }).result.then(
                function (resolve) {
                    // ejecutamos el código una vez que el usuario indica algunas opciones y regresa ...
                    let parametrosReporte = resolve;
                    AsientosContables_Methods.imprimirAsientoContable($scope.asientoContable, parametrosReporte);
                    return true;
                },
                function (cancel) {
                    return true;
                });
      };

      $scope.cartaDeTrabajo = function() {

          var modalInstance = $modal.open({
              templateUrl: 'client/nomina/empleados/cartaTrabajoModal.html',
              controller: 'EmpleadosCartaTrabajoController',
              size: 'lg',
              resolve: {
                  tiposArchivo: () => {
                      return ['NOMINA-CONSTANCIA-TRABAJO'];
                  },
                  aplicacion: () => {
                      return 'nomina';              // nómina, bancos, contab, ...
                  },
                  ciaSeleccionada: function () {
                      // pasamos la entidad (puede ser: contratos, siniestros, ...) solo para marcar docState si se agrega/eliminar
                      // un documento (y no se había 'marcado' esta propiedad antes)...
                      return companiaContabSeleccionada;
                  },
                  empleadoID: () => {
                      return $scope.empleado && $scope.empleado.empleado ? $scope.empleado.empleado : 0;              // nómina, bancos, contab, ...
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

      $scope.exportarAsientoContable = () => {
          // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
          // ser importado como un asiento nuevo ...
          try {
              let asientoContable = _.cloneDeep($scope.asientoContable);

              var blob = new Blob([JSON.stringify(asientoContable)], {type: "text/plain;charset=utf-8"});
              saveAs(blob, "asiento contable");
          }
          catch(err) {
              message = err.message ? err.message : err.toString();
          }
          finally {
              if (message) {
                  DialogModal($modal, "<em>Asientos contables - Exportar asientos contables</em>",
                                      "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                      message,
                                     false).then();
              };
          };
      };

      $scope.importarAsientoContable = () => {
          // permitimos al usuario leer, en un nuevo asiento contable, alguno que se haya exportado a un text file ...
          let inputFile = angular.element("#fileInput");
          if (inputFile)
              inputFile.click();        // simulamos un click al input (file)
      };

      $scope.uploadFile = function(files) {

          if (!$scope.asientoContable || !$scope.asientoContable.docState || $scope.asientoContable.docState != 1) {
              DialogModal($modal, "<em>Asientos contables</em>",
                                  "Aparentemente, el asiento que recibirá la copia no es nuevo (ya existía).<br />" +
                                  "Ud. debe importar un asiento siempre en un asiento nuevo; es decir, no en uno que ya exista.",
                                 false).then();

             let inputFile = angular.element("#fileInput");
             if (inputFile && inputFile[0] && inputFile[0].value)
                 // para que el input type file "limpie" el file indicado por el usuario
                 inputFile[0].value = null;

              return;
          }

          let userSelectedFile = files[0];

          if (!userSelectedFile) {
              DialogModal($modal, "<em>Asientos contables</em>",
                                  "Aparentemente, Ud. no ha seleccionado un archivo.<br />" +
                                  "Por favor seleccione un archivo que corresponda a un asiento contable <em>exportado</em> antes.",
                                 false).then();

             let inputFile = angular.element("#fileInput");
             if (inputFile && inputFile[0] && inputFile[0].value)
                 // para que el input type file "limpie" el file indicado por el usuario
                 inputFile[0].value = null;

              return;
          }

          var reader = new FileReader();
          let message = "";

          reader.onload = function(e) {
            //   debugger;
              try {
                  var content = e.target.result;
                  let asientoContable = JSON.parse(content);

                  // TODO: agregar valores de propiedades en asientoContable a $scope.asientoContable (cómo hacerlo de la forma más fácil??? )

                  $scope.asientoContable.tipo = asientoContable.tipo ? asientoContable.tipo : "";
                  $scope.asientoContable.descripcion = asientoContable.descripcion ? asientoContable.fecha : "";
                  $scope.asientoContable.moneda = asientoContable.moneda ? asientoContable.moneda : 0;
                  $scope.asientoContable.monedaOriginal = asientoContable.monedaOriginal ? asientoContable.monedaOriginal : 0;
                  $scope.asientoContable.factorDeCambio = asientoContable.factorDeCambio ? asientoContable.factorDeCambio : 0;

                  if (_.isArray(asientoContable.partidas)) {

                      if (!_.isArray($scope.asientoContable.partidas))
                          $scope.asientoContable.partidas = [];

                      asientoContable.partidas.forEach((p) => {

                          // permitimos que el usuario haya agregado partidas (al asiento nuevo ....)
                          let ultimaPartida = _.last( _.sortBy($scope.asientoContable.partidas, (x) => { return x.partida; }) );

                          let partida = {
                              _id: new Mongo.ObjectID()._str,
                              partida: 10,
                              debe: 0,
                              haber: 0,
                              docState: 1
                          };

                          if (ultimaPartida && !_.isEmpty(ultimaPartida)) {
                              partida.partida = ultimaPartida.partida + 10;
                          };

                          partida.cuentaContableID = p.cuentaContableID ? p.cuentaContableID : null;
                          partida.descripcion = p.descripcion ? p.descripcion : "";
                          partida.referencia = p.referencia ? p.referencia : "";
                          partida.debe = p.debe ? p.debe : 0;
                          partida.haber = p.haber ? p.haber : 0;
                          partida.centroCosto = p.centroCosto ? p.centroCosto : null;
                          partida.docState = 1;

                          $scope.asientoContable.partidas.push(partida);
                      });
                  };
              }
              catch(err) {
                  message = err.message ? err.message : err.toString();
              }
              finally {
                  if (message)
                      DialogModal($modal, "<em>Asientos contables - Importar asientos contables</em>",
                                          "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                          message,
                                         false).then();
                   else {
                       $scope.partidas_ui_grid.data = [];
                       if (_.isArray($scope.asientoContable.partidas))
                          $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
                   };

                   let inputFile = angular.element("#fileInput");
                   if (inputFile && inputFile[0] && inputFile[0].value)
                       // para que el input type file "limpie" el file indicado por el usuario
                       inputFile[0].value = null;

                   $scope.$apply();
              };
          };

          reader.readAsText(userSelectedFile);
      };

      $scope.nuevo0 = function () {

            if ($scope.empleado.docState) {
                var promise = DialogModal($modal,
                                          "<em>Nómina - Empleados</em>",
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
        // para registrar sueldos para el empleado
        // -------------------------------------------------------------------------
        $scope.sueldos = function() {

            if (!$scope.empleado.sueldos)
                $scope.empleado.sueldos = [];

            var modalInstance = $modal.open({
                templateUrl: 'client/nomina/empleados/empleadosSueldos_Modal.html',
                controller: 'empleadosSueldos_Modal_Controller',
                size: 'md',
                resolve: {
                    empleado: () => {
                        return $scope.empleado;
                    },
                    companiaSeleccionadaDoc: () => {
                        return companiaContabSeleccionada;
                    },
                    origen: () => {
                        return $scope.origen;
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

        // -------------------------------------------------------------------------
        // para registrar faltas para el empleado
        // -------------------------------------------------------------------------
        $scope.faltas = function() {


        };





      // -------------------------------------------------------------------------
      // Grabar las modificaciones hechas al siniestro
      // -------------------------------------------------------------------------
      $scope.grabar = function () {

          if (!$scope.empleado.docState) {
              DialogModal($modal, "<em>Empleados</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                 false).then();
              return;
          };

          $scope.showProgress = true;

          // obtenemos un clone de los datos a guardar ...
          let editedItem = _.cloneDeep($scope.empleado);

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          if (editedItem.docState != 3) {
              isValid = Empleados.simpleSchema().namedContext().validate(editedItem);

              if (!isValid) {
                  Empleados.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                      errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + Empleados.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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

          // por algna razón, cuando agregamos un item al scope y luego a mongo (en server), el item en $scope no se 'sincroniza' en forma
          // adecuada; por eso, lo eliminamos. Luego, con reactivity, será mostrado, nuevamente, en el view ...

          // TODO: vamos a revisar que ocurre aquí con respecto a la nota anterior. Por ahora, el usuario no va a agregar un registro. Lo
          // hará cuando implementemos la función Asientos; por ahora, solo puede editar el asiento generado para el ITF
        //   _.remove($scope.AsientosContables, (x) => { return x.docState && x.docState === 1; });

          $meteor.call('empleadosSave', editedItem).then(
              function (data) {

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data.message
                  });

                  // para registros nuevos, 'empleadosSave' regresa el número del nuevo empleado (desde sql server)
                  empleados_leerByID_desdeSql(parseInt(data.id));
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

      $scope.helpers({
          departamentos: () => {
              return Departamentos.find();
          },
          cargos: () => {
              return Cargos.find();
          },
          ciudades: () => {
              return Ciudades.find();
          },
          parentescos: () => {
              return Parentescos.find();
          },
          tiposDeCuentaBancaria: () => {
              return TiposDeCuentaBancaria.find();
          },
          bancos: () => {
              return Bancos.find();
          },
      });

      let fechaOriginalAsientoContable = null;
      $scope.empleado = {};

      function inicializarItem() {
        //   debugger;
          $scope.showProgress = true;

          if ($scope.id == "0") {

              $scope.empleado = {};
              $scope.empleado = {
                                  empleado: 0,
                                  faltas: [],
                                  sueldos: [],
                                  cia: companiaContabSeleccionada.numero,
                                  docState: 1
                                };

                $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
                $scope.showProgress = false;
          }
          else {
            $scope.showProgress = true;
            empleados_leerByID_desdeSql(parseInt($scope.id));
          };
      };

      inicializarItem();

      function empleados_leerByID_desdeSql(pk) {
          // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
          Meteor.call('empleados_leerByID_desdeSql', pk, (err, result) => {

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

              $scope.empleado = {};
              $scope.empleado = JSON.parse(result);

              if ($scope.empleado == null) {
                  // el usuario eliminó el empleado y, por eso, no pudo se leído desde sql
                  $scope.empleado = {};
                  $scope.showProgress = false;
                  $scope.$apply();

                  return;
              };

              // las fechas vienen serializadas como strings; convertimos nuevamente a dates
              $scope.empleado.fechaIngreso = $scope.empleado.fechaIngreso ? moment($scope.empleado.fechaIngreso).toDate() : null;
              $scope.empleado.fechaNacimiento = $scope.empleado.fechaNacimiento ? moment($scope.empleado.fechaNacimiento).toDate() : null;
              $scope.empleado.fechaRetiro = $scope.empleado.fechaRetiro ? moment($scope.empleado.fechaRetiro).toDate() : null;

              $scope.empleado.faltas.forEach((x) => {
                  x.desde = x.desde ? moment(x.desde).toDate() : null;
                  x.hasta = x.hasta ? moment(x.hasta).toDate() : null;
                  x.descontar_FechaNomina = x.descontar_FechaNomina ? moment(x.descontar_FechaNomina).toDate() : null;
              });

              $scope.empleado.sueldos.forEach((x) => {
                  x.desde = x.desde ? moment(x.desde).toDate() : null;
              });

              $scope.showProgress = false;
              $scope.$apply();
          });
      };
  }
]);
