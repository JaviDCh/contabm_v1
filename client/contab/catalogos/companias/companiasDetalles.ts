


angular.module("contabm.contab.catalogos").controller('CompaniaDetalles_Modal_Controller',
['$scope', '$modalInstance', '$modal', 'companiaSeleccionada', 'monedas', 
function ($scope, $modalInstance, $modal, companiaSeleccionada, monedas) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.ok = function () {
        $modalInstance.close("Okey");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.setIsEdited = function () {
        if ($scope.companiaSeleccionada.docState) { 
            return;
        }
            
        $scope.companiaSeleccionada.docState = 2;
    }

    $scope.companiaSeleccionada = companiaSeleccionada;
    $scope.monedas = monedas; 
}
])