
// -----------------------------------------------------------------------------
// modal (popup) para pedir confirmación al usuario
// -----------------------------------------------------------------------------

export const DialogModal = function ($modal, titulo, message, showCancelButton) {

    var modalInstance = $modal.open({
        templateUrl: 'client/generales/genericUIBootstrapModal.html',
        controller: 'DialogModalController',
        size: 'md',
        resolve: {
            titulo: function () {
                return titulo;
            },
            mensaje: function () {
                return message;
            },
            showCancelButton: function () {
                return showCancelButton;
            }
        }
    });

    return modalInstance.result;
};


angular.module("contabm").controller('DialogModalController',
['$scope', '$modalInstance', 'titulo', 'mensaje', 'showCancelButton',
function ($scope, $modalInstance, titulo, mensaje, showCancelButton) {

    $scope.dialogData = {};
    $scope.dialogData.titulo = titulo;
    $scope.dialogData.mensaje = mensaje;
    $scope.dialogData.showCancelButton = showCancelButton;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };
}
]);
