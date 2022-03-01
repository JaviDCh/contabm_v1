
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('ChequeImpresoModalController',
['$scope', '$modalInstance', '$modal', '$meteor', 'tiposArchivo', 'aplicacion', 'ciaSeleccionada', 'movimientoBancarioID', 'user',
function ($scope, $modalInstance, $modal, $meteor, tiposArchivo, aplicacion, ciaSeleccionada, movimientoBancarioID, user) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.helpers({
        template_files: () => {
            return Files_CollectionFS_Templates.find({
                'metadata.tipo': { $in: tiposArchivo },
                'metadata.aplicacion': aplicacion,
                // 'metadata.cia': ciaSeleccionada._id
            })
        },
    })

    $scope.downLoadWordDocument = false;
    $scope.selectedFile = {};
    $scope.downLoadLink = "";

    $scope.obtenerChequeImpreso = (file) => {
        $scope.showProgress = true;

        // ----------------------------------------------------------------------------------------------
        // actualizamos los datos de configuracion en el collection
        let configuracionChequeImpreso = ConfiguracionChequeImpreso.findOne({ cia: ciaSeleccionada._id });
        if (configuracionChequeImpreso) {
            ConfiguracionChequeImpreso.remove({ _id: configuracionChequeImpreso._id });
        }

        if ($scope.configuracionChequeImpreso) {
            ConfiguracionChequeImpreso.insert({
                _id: new Mongo.ObjectID()._str,
                elaboradoPor: $scope.configuracionChequeImpreso.elaboradoPor ? $scope.configuracionChequeImpreso.elaboradoPor : null,
                revisadoPor: $scope.configuracionChequeImpreso.revisadoPor ? $scope.configuracionChequeImpreso.revisadoPor : null,
                aprobadoPor: $scope.configuracionChequeImpreso.aprobadoPor ? $scope.configuracionChequeImpreso.aprobadoPor : null,
                contabilizadoPor: $scope.configuracionChequeImpreso.contabilizadoPor ? $scope.configuracionChequeImpreso.contabilizadoPor : null,
                cia: ciaSeleccionada._id,
            })
        }
        // ----------------------------------------------------------------------------------------------

        $meteor.call('bancos.obtenerChequeImpreso',
                     file._id,
                     file.metadata.tipo,
                     ciaSeleccionada,
                     user,
                     movimientoBancarioID,
                     file.original.name).then(
            function (data) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                          Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                $scope.selectedFile = file;
                $scope.downLoadLink = data;
                $scope.downLoadWordDocument = true;

                $scope.showProgress = false;
            },
            function (err) {

                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
            })
    }

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("template_files", () => { return [ aplicacion, tiposArchivo, ]; }, {
        onReady: function () {
            $scope.subscribe("configuracionChequeImpreso", () => { return [ ciaSeleccionada._id ]; }, {
                onReady: function () {

                    $scope.helpers({
                        configuracionChequeImpreso: () => {
                            return ConfiguracionChequeImpreso.findOne({ cia: ciaSeleccionada._id });
                        },
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                },
                onStop: function (error) {
                    $scope.showProgress = false;
                    $scope.$apply();
              }
            });
        },
        onStop: function (error) {
            $scope.showProgress = false;
            $scope.$apply();
      }
    });
  // --------------------------------------------------------------------------------------------------------------------
}
]);
