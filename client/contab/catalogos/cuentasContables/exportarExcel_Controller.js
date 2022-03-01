


import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm.contab.catalogos").controller('ContabCatalogosCuentasContablesExportarExcel_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, ciaSeleccionada) {

    // debugger;
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

    $scope.downloadDocument = false;
    $scope.selectedFile = "cuentas contables.xlsx";
    $scope.downLoadLink = "";

    $scope.exportarAExcel = (file) => {
        $scope.showProgress = true;

        $meteor.call('contab_cuentasContables_exportarExcel', ciaSeleccionada)
            .then(
            function (data) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                          Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                // $scope.selectedFile = file;
                $scope.downLoadLink = data;
                $scope.downloadDocument = true;

                $scope.showProgress = false;
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
            });
    };
}
]);
