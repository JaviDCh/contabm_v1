

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").controller("Bancos_Pagos_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    // solo cuando el usuario abre Factura con 'vieneDeAfuera', este (parent) state puede acceder a sus parámetros,
    // pues no hay filtro/list. Los states se ejecutan así: Facturas (parent) / Factura. Entonces si revisamos
    // $state.params vamos a obtener los parámetros de Factura desde este parent y vamos a tener acceso al
    // parámetro 'proveedor'. Cuando este parámetro viene, es porque Factura es abierto con 'vieneDeAfuera' y
    // solo hacemos el publishing del proveedor específico ...
    let proveedorID = null;
    if ($state.params && $state.params.proveedorID) {
        proveedorID = parseInt($state.params.proveedorID);
    }

      $scope.miSu_List = [
          { miSu: 1, descripcion: 'Mi', },
          { miSu: 2, descripcion: 'Su', },
      ];

      $scope.showProgress = true;

      // bancosCollectionsFacturacion regresa algunos catálogos necesarios para mostrar la página, como
      // la compañía seleccionada. Cuando esta página 'viene de afuera', no espera por los catálogos que
      // existen en el cliente por el publisher 'automático' que los carga al principio. Por ese motivo,
      // debemos ejecutar este publisher y, solo cuando termina, ejecutar helpers como la compañía
      // seleccionada para que se muestre en la página ...

      let bancosCollectionsFacturacion_subscriptionHandle = null;
      let proveedores_subscriptionHandle = null;

      bancosCollectionsFacturacion_subscriptionHandle = Meteor.subscribe('bancosCollectionsFacturacion', () => {
          // 'proveedores' publica solo el proveedor indicado cuando viene uno (proveedorID);
          // caso contrario, vienen todos ...
          proveedores_subscriptionHandle = Meteor.subscribe('proveedores', proveedorID, () => {

                  let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
                  $scope.helpers({
                      companiaSeleccionada: () => {
                          return Companias.findOne(ciaContabSeleccionada.companiaID, { fields: { numero: 1, nombre: 1, nombreCorto: 1 } });
                      },
                  });

                  $scope.showProgress = false;
                  $scope.$apply();
              })
          })

          // nótese como detenemos (stop) los subscriptions cuando el controller termina ...
          $scope.$on("$destroy", function handler() {

            if (bancosCollectionsFacturacion_subscriptionHandle) {
              bancosCollectionsFacturacion_subscriptionHandle.stop();
            }

            if (proveedores_subscriptionHandle) {
              proveedores_subscriptionHandle.stop();
            }
          })
  }
]);
