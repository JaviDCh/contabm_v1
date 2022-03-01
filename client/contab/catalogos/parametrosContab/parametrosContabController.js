
import lodash from 'lodash';
import { Monedas } from '/imports/collections/monedas';
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_ParametrosContab_Controller",
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

      if (companiaSeleccionada) {
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID);
      }

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc) {
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      }
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------

      $scope.setIsEdited = function (field) {

          if ($scope.parametrosContab.docState)
              return;

          $scope.parametrosContab.docState = 2;
      }

      // preparamos algunas listas para los dropdowns
      // proveemos una lista particular de cuentas contables para el dropdown en el ui-grid; la idea es mostrar
      // cuenta+descripción+cia, en vez de solo la cuenta contable ...
      $scope.cuentasContablesLista = [];

      CuentasContables2.find({ numNiveles: 1, cia: $scope.companiaSeleccionada.numero, },
                            { sort: { cuenta: true }} ).
                       forEach((cuenta) => {
                            // cuentaDescripcionCia() es un 'helper' definido en el collection CuentasContables ...
                            $scope.cuentasContablesLista.push({ id: cuenta.id, cuentaDescripcionCia: cuenta.cuentaDescripcionCia() });
                       });


       $scope.cuentasContablesLista2 = [];

       CuentasContables2.find({ totDet: 'D', actSusp: 'A', cia: $scope.companiaSeleccionada.numero, },
                             { sort: { cuenta: true }} ).
                        forEach((cuenta) => {
                             // cuentaDescripcionCia() es un 'helper' definido en el collection CuentasContables ...
                             $scope.cuentasContablesLista2.push({ id: cuenta.id, cuentaDescripcionCia: cuenta.cuentaDescripcionCia() });
                        });

      $scope.helpers({
          monedas: () => {
              return Monedas.find();
          },
      })


      $scope.eliminar = function () {
          if ($scope.parametrosContab.docState && $scope.parametrosContab.docState === 1) {
              // el registro es nuevo; no se ha grabado a la base de datos; informamos al usuario
              DialogModal($modal, "<em>Contab - Parámetros</em>",
                                  `El registro es nuevo y Ud. no lo ha grabado a la base de datos.<br />
                                   Ud. puede hacer un <em>click</em> en <em>refresh</em> o <em>regresar</em> para deshacer estos cambios.`,
                                 false).then();
              return;
          }
          else {
              $scope.parametrosContab.docState = 3;
          }
      }

      $scope.nuevo = function () {
          $scope.parametrosContab = {
              cia: $scope.companiaSeleccionada.numero,
              docState: 1,
          };
      }

      $scope.refresh0 = function () {

          if ($scope.parametrosContab.docState) {
              var promise = DialogModal($modal,
                                        "<em>Contab - Parámetros</em>",
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
          inicializarItem(true);
      }

      $scope.grabar = function () {

          if (!$scope.parametrosContab.docState) {inicializarItem(false);
              DialogModal($modal, "<em>Contab - Parámetros</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                 false).then();
              return;
          }

           $scope.showProgress = true;

           // nótese como validamos cada item antes de intentar guardar (en el servidor)
           let isValid = false;
           let errores = [];

           let editedItem = lodash.cloneDeep($scope.parametrosContab);

           if (editedItem.docState != 3) {
               isValid = ParametrosContab.simpleSchema().namedContext().validate(editedItem);

               if (!isValid) {
                   ParametrosContab.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                       errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + ParametrosContab.simpleSchema().label(error.name) + "'; error de tipo '" + error.type + "'.");
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


           Meteor.call('contab.parametrosContab.save', editedItem, (err, result) => {

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
                   // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                   $scope.id = result.id;

                   // 'inicializar...' lee el registro recién agregado; false, para que no muestre un mensaje al usuario; lo
                   // mostramos desde aquí ...
                   inicializarItem(false);

                   $scope.alerts.length = 0;
                   $scope.alerts.push({
                       type: 'info',
                       msg: result.message
                   });

                   $scope.showProgress = false;
                   $scope.$apply();
               }
           })
       }

      $scope.showProgress = true;

      // nótese que esta es una versión simplificada de esta función, pues siempre existirá *un solo* registro para cada compañía Contab
      function inicializarItem(mostrarMensajeAlUsuario) {
          // leemos el registro desde sql server; nótese que el pk del registro es la cia contab a la cual corresponde
          Meteor.call('contab.parametrosContab.leerDesdeSqlServer',
                       $scope.companiaSeleccionada.numero, (err, result) => {

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
                  // el método que intenta grabar los cambios puede regresar un error cuando,
                  // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: result.message
                  });
                  $scope.showProgress = false;
                  $scope.$apply();
              } else {

                  $scope.parametrosContab = JSON.parse(result.parametrosContab);

                  if (mostrarMensajeAlUsuario) {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'info',
                          msg: result.message
                      });
                  }

                  $scope.showProgress = false;
                  $scope.$apply();
              }
          })
      }

      inicializarItem(true);
}
]);
