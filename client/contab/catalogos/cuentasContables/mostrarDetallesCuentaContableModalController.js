

import { Companias } from '/imports/collections/companias';
import { GruposContables } from '/imports/collections/contab/gruposContables'; 

angular.module("contabm.contab.catalogos").controller('MostrarDetallesCuentaContable_Modal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'companiaSeleccionadaDoc', 'cuentaContableSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, companiaSeleccionadaDoc, cuentaContableSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.ok = function () {
        $modalInstance.close("Okey");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    let grupoContable = GruposContables.findOne({ grupo: cuentaContableSeleccionada.grupo });
    $scope.grupoContableNombre = grupoContable ? grupoContable.descripcion : "Indefinido (?)";

    let companiaContab = Companias.findOne({ numero: cuentaContableSeleccionada.cia });
    $scope.companiaContab = companiaContab ? companiaContab.nombre : "Indefinida (?)";

    $scope.companiaSeleccionadaDoc = companiaSeleccionadaDoc;
    $scope.cuentaContableSeleccionada = cuentaContableSeleccionada;

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.submit_exportarAsientosContablesForm = function () {
        $scope.submitted = true;
        if ($scope.exportarAsientosContablesForm.$valid) {
            $scope.submitted = false;
        };
    };
}
]);
