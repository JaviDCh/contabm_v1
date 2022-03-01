

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.bancos.catalogos").controller('BancosProveedoresClientes_ExportarExcel_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, ciaSeleccionada) {

    // debugger;
    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.downloadDocument = false;
    $scope.selectedFile = "clientes y proveedores.xlsx";
    $scope.downLoadLink = "";

    $scope.exportarAExcel = (file) => {
        $scope.showProgress = true;

        Meteor.call('bancos.proveedores.exportarAExcel', ciaSeleccionada, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
                $scope.$apply();
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                      Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
            });

            $scope.downLoadLink = result;
            $scope.downloadDocument = true;

            $scope.showProgress = false;
            $scope.$apply();
        })
    };
}
]);
