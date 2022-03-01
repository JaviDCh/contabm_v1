

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('EmpleadosCartaTrabajoController',
['$scope', '$modalInstance', '$modal', '$meteor', 'tiposArchivo', 'aplicacion', 'ciaSeleccionada', 'empleadoID', 'user',
function ($scope, $modalInstance, $modal, $meteor, tiposArchivo, aplicacion, ciaSeleccionada, empleadoID, user) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.helpers({
        template_files: () => {
            return Files_CollectionFS_Templates.find({
                'metadata.tipo': { $in: tiposArchivo },
                'metadata.aplicacion': aplicacion,
                // 'metadata.cia': ciaSeleccionada._id
            });
        },
    });

    $scope.downLoadWordDocument = false;
    $scope.selectedFile = {};
    $scope.downLoadLink = "";

    $scope.obtenerCartaTrabajo = (file) => {
        $scope.showProgress = true;

        $meteor.call('nomina_construirCartaTrabajoEmpleados',
                     file._id,
                     file.metadata.tipo,
                     ciaSeleccionada,
                     user,
                     empleadoID,
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

                // el meteor método crea el archivo en el server y regresa su _id; suscribimos ahora
                // para tener el collection (no el archivo como tal) y mostrar su uri ...

                // $scope.subscribe("leerTempFileByID_collectionFS", () => { return [ data, ]; }, {
                //     onReady: function () {
                //         // debugger;
                //         $scope.alerts.length = 0;
                //         $scope.alerts.push({
                //             type: 'info',
                //             msg: data
                //         });
                //
                //         let tempFile = Files_CollectionFS_tempFiles.findOne(data);
                //
                //         $scope.selectedFile = tempFile;
                //         $scope.downLoadLink = tempFile.url();
                //         $scope.downLoadWordDocument = true;
                //
                //         $scope.showProgress = false;
                //         $scope.$apply();
                //     },
                //     onStop: function (error) {
                //         $scope.showProgress = false;
                //         $scope.$apply();
                //   }
                // });
            },
            function (err) {

                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
            });
    };

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("template_files", () => { return [ aplicacion, tiposArchivo, ]; }, {
        onReady: function () {
            // debugger;
            $scope.showProgress = false;
            $scope.$apply();
        },
        onStop: function (error) {
            $scope.showProgress = false;
            $scope.$apply();
      }
    });
  // --------------------------------------------------------------------------------------------------------------------
}
]);
