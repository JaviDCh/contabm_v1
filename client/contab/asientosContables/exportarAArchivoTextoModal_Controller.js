
import saveAs from 'save-as';
import numeral from 'numeral'; 
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('ExportarAArchivoTextoModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'companiaContabSeleccionada',
 function ($scope, $modalInstance, $modal, $meteor, companiaContabSeleccionada) {

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

    $scope.companiaContabSeleccionada = companiaContabSeleccionada;

    let subscriptionHandle = null;

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.exportarAsientosContables_textFile_submit_Form = function () {
        $scope.submitted = true;
        $scope.showProgress = true;
        if ($scope.exportarAsientosContables_textFile_Form.$valid) {

            $scope.exportarAsientosContables_textFile_Form.$setPristine();

            Meteor.call('exportarAsientosContablesAArchivoTexto', (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                    $scope.$apply();
                    return;
                }


                if (subscriptionHandle && subscriptionHandle.stop) {
                    subscriptionHandle.stop();
                };

                subscriptionHandle =
                Meteor.subscribe('tempConsultaAsientosContables2', () => {

                    let meteorUserId = Meteor.userId();
                    let asientosContablesLeidosDesdeSqlServer = [];
                    asientosContablesLeidosDesdeSqlServer = Temp_Consulta_AsientosContables2.find({ user: meteorUserId },
                                                                                                  { sort: { numero: 1 }}).
                                                                                             fetch();
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: `${numeral(asientosContablesLeidosDesdeSqlServer.length).format('0,0')} asientos contables
                              han sido leídos desde la base de datos ...`
                    });

                    $scope.showProgress = false;
                    $scope.$apply();

                    let message = '';

                    // nótese como convertimos el array que contiene los asientos contables en un string y lo
                    // registramos en un 'blob'; luego permitimos que el usuario lo guarde en algún lado en su PC ...
                    try {
                        var blob = new Blob([JSON.stringify(asientosContablesLeidosDesdeSqlServer)],
                                            {type: "text/plain;charset=utf-8"});
                        saveAs(blob, "asientosContables");
                    }
                    catch(err) {
                        message = err.message ? err.message : err.toString();
                    }
                    finally {
                        if (message) {
                            DialogModal($modal, "<em>Asientos contables - Exportar asientos contables</em>",
                                                "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                                message,
                                               false).then();
                        };
                    };
                })
            })
        }
    }


    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'leerAsientosDesdeSqlServer_exportarArchivoTexto' });
    EventDDP.addListener('contab_leerAsientosDesdeSqlServer_exportarArchivoTexto_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
