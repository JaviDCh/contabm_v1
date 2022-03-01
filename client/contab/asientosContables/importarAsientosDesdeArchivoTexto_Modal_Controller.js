
import numeral from 'numeral';
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('ImportarAsientosDesdeArchivoTexto_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$timeout', 'companiaContabSeleccionada',
 function ($scope, $modalInstance, $modal, $meteor, $timeout, companiaContabSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

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

    $scope.submitted = false;
    $scope.parametros = {};

    let asientosContablesImportadosDesdeArchivoTexto = [];

    $scope.importarAsientosContablesDesdeArchivoTexto_submit_Form = function () {
        $scope.submitted = true;
        $scope.showProgress = true;
        if ($scope.importarAsientosContablesDesdeArchivoTexto_Form.$valid) {

            $scope.importarAsientosContablesDesdeArchivoTexto_Form.$setPristine();

            let asientosImportadosJson = JSON.stringify(asientosContablesImportadosDesdeArchivoTexto);

            if (typeof $scope.parametros.mantenerNumerosAsientosContables === 'undefined') {
                $scope.parametros.mantenerNumerosAsientosContables = false;
            }

            Meteor.call('importarAsientosContablesDesdeArchivoTexto', asientosImportadosJson,
                                                                      $scope.parametros.mantenerNumerosAsientosContables,
                                                                      companiaContabSeleccionada.numero,
                                                                      (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result
                });

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }


    $scope.cargarArchivoTexto = () => {
        // permitimos al usuario leer, en un nuevo asiento contable, alguno que se haya exportado a un text file ...
        // let inputFile = angular.element("#fileInput");
        // if (inputFile)
        //     inputFile.click();        // simulamos un click al input (file)

        // let inputFile = jQuery("#fileInput");
        // inputFile.click();

        // el timeout para eliminar "$apply already in progress ..."
        $timeout(function(){
            angular.element(document.getElementById("fileInput")).trigger('click');
        });
    }

    $scope.uploadFile = function(files) {

        let userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                `Aparentemente, Ud. no ha seleccionado un archivo.<br />
                                 Por favor seleccione un archivo que corresponda a asientos
                                 contables <em>exportados</em> antes mediante la función
                                 <em><b>Exportar</b></em> del menú <em><b>Copiar</b></em> en esta página.`,
                               false).then();

           let inputFile = angular.element("#fileInput");
           if (inputFile && inputFile[0] && inputFile[0].value)
               // para que el input type file "limpie" el file indicado por el usuario
               inputFile[0].value = null;

            return;
        }

        var reader = new FileReader();
        let message = "";
        asientosContablesImportadosDesdeArchivoTexto = [];

        reader.onload = function(e) {
          //   debugger;
            try {
                var content = e.target.result;
                asientosContablesImportadosDesdeArchivoTexto = JSON.parse(content);
            }
            catch(err) {
                message = err.message ? err.message : err.toString();
            }
            finally {
                if (message)
                    DialogModal($modal, "<em>Asientos contables - Importar asientos contables</em>",
                                        "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                        message,
                                       false).then();
                 else {
                     $scope.alerts.length = 0;
                     $scope.alerts.push({
                         type: 'info',
                         msg: `Ok, <b>${numeral(asientosContablesImportadosDesdeArchivoTexto.length).format('0,0')}</b>
                               asientos contables han sido leídos desde el archivo de texto que se ha indicado.<br />
                               Haga un <em>click</em> en <b><em>Importar</em></b> para agregar los asientos contables
                               a la compañía <em>Contab</em> seleccionada.`
                     });
                 };

                 let inputFile = angular.element("#fileInput");
                 if (inputFile && inputFile[0] && inputFile[0].value)
                     // para que el input type file "limpie" el file indicado por el usuario
                     inputFile[0].value = null;

                 $scope.$apply();
            };
        };

        reader.readAsText(userSelectedFile);
    };


    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({
        myuserId: Meteor.userId(),
        app: 'contab',
        process: 'leerAsientosDesdeSqlServer_importarDesdeArchivoTexto'
    });
    EventDDP.addListener('contab_leerAsientosDesdeSqlServer_importarDesdeArchivoTexto_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
