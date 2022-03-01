
import { DialogModal } from '/client/generales/angularGenericModal'; 

angular.module("contabm").controller('MostrarFilesRegistradasController',
['$scope', '$modalInstance', '$modal', 'aplicacion', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, aplicacion, ciaSeleccionada) {

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.helpers({
        template_files: () => {
            return Files_CollectionFS_Templates.find({ 'metadata.aplicacion': aplicacion });
        },
    })

    $scope.fileURL_toString = (file) => {
        let urlString = Files_CollectionFS_Templates.findOne({ _id: file._id }).url().toString();
        return urlString;
    }

    $scope.removeFile = function(file) {

        DialogModal($modal,
            "<em>Registro de archivos</em>",
            `Desea eliminar el archivo <b><em>${file.original.name}</em></b> ?`,
            true).then(
                function (resolve) {
                    Files_CollectionFS_Templates.remove({ _id: file._id });
                    return true;
                },
                function (cancel) {
                    return true;
                }
            )
    }
}
])
