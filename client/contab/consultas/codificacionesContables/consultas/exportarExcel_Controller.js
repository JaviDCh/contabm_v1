

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { Filtros } from '/imports/collections/general/filtros'; 

angular.module("contabm").controller('ContabCodificacionesContablesConsultaExportarExcel_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'codificacionContable', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, codificacionContable, ciaSeleccionada) {

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
    $scope.selectedFile = "codificaciones contables.xlsx";
    $scope.downLoadLink = "";
    $scope.filtro = {};

    $scope.exportarAExcel = (file) => {
        $scope.showProgress = true;

        let subTituloConsulta = $scope.filtro && $scope.filtro.subTitulo ? $scope.filtro.subTitulo : "";

        $meteor.call('contab_codificacionesContablesConsulta_exportarExcel',
                      subTituloConsulta,
                      codificacionContable,
                      ciaSeleccionada)
            .then(
            function (data) {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento ha sido construido en forma exitosa.<br />
                          Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                $scope.downLoadLink = data;
                $scope.downloadDocument = true;

                // ------------------------------------------------------------------------------------------------------
                // guardamos el subtitulo indicado - nótese que lo hacemos justo como si fuera un filtro ...
                if (Filtros.findOne(
                    {
                        nombre: 'contab.consulta.codificacionesContables.exportarExcel.titulo',
                        userId: Meteor.userId()
                    }))
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    Filtros.update(Filtros.findOne(
                        {
                            nombre: 'contab.consulta.codificacionesContables.exportarExcel.titulo',
                            userId: Meteor.userId()
                        })._id,
                        { $set: { filtro: $scope.filtro } },
                        { validate: false });
                else
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'contab.consulta.codificacionesContables.exportarExcel.titulo',
                        filtro: $scope.filtro
                    });
                // ------------------------------------------------------------------------------------------------------

                $scope.showProgress = false;
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
            });
    };

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne(
        {
            nombre: 'contab.consulta.codificacionesContables.exportarExcel.titulo',
            userId: Meteor.userId()
        });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) {
        $scope.filtro = _.clone(filtroAnterior.filtro);
    };
    // ------------------------------------------------------------------------------------------------------
}
]);
