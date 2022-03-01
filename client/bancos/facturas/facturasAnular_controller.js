

import moment from 'moment';

angular.module("contabm").controller('FacturasAnular_Controller',
['$scope', '$modalInstance', '$modal', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {

        let noModificarAsientoContableAsociado = false;

        if ($scope.opciones && $scope.opciones.noModificarAsientoContableAsociado) {
            noModificarAsientoContableAsociado = $scope.opciones.noModificarAsientoContableAsociado;
        }

        $modalInstance.close(noModificarAsientoContableAsociado);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };
}
]);
