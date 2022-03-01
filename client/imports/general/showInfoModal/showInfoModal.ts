
import * as angular from 'angular';
import './showInfoModal.html'; 

// -----------------------------------------------------------------------------
// modal (popup) para mostrar información (help) al usuario 
// -----------------------------------------------------------------------------
export const DialogInfoModal = function ($modal, titulo, message, size) {

    // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
    message = message.replace(/\/\//gi, "");

    var modalInstance = $modal.open({
        templateUrl: 'client/imports/general/showInfoModal/showInfoModal.html',
        controller: 'DialogInfoController',
        animation: true, 
        size: size,
        resolve: {
            titulo: function () {
                return titulo;
            },
            mensaje: function () {
                return message;
            },
        }
    });

    return modalInstance.result;
}


angular.module("contabm").controller('DialogInfoController',
['$scope', '$modalInstance', 'titulo', 'mensaje',
function ($scope, $modalInstance, titulo, mensaje) {

    $scope.dialogData = {};
    $scope.dialogData.titulo = titulo;
    $scope.dialogData.mensaje = mensaje;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };
}
])