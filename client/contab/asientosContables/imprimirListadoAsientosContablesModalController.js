
import lodash from 'lodash';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Filtros } from '/imports/collections/general/filtros'; 

angular.module("contabm").controller('ImprimirListadoAsientosContablesModalController',
['$scope', '$modalInstance', '$modal', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.ok = function () {
        $modalInstance.close({
            ordenarPorFechaRegistro: $scope.parametros.ordenarPorFechaRegistro,
            saveToDisk: $scope.parametros.saveFileToDisk
        });
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    $scope.ciaSeleccionada = ciaSeleccionada;

    // Nótese lo que hacemos para sortear un issue que se presenta a veces con angular; las formas no se registran en el $scope y
    // se muestran con undefined.
    $scope.form = {
      listadoAsientosContablesForm: {},
      listadoAsientosContables2Form: {}
    };

    $scope.submitted = false;
    $scope.parametros = {};

    $scope.submitListadoAsientosContablesForm = function () {
        $scope.submitted = true;
        if ($scope.form.listadoAsientosContablesForm.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.form.listadoAsientosContablesForm.$setPristine();
            $scope.ok();
        }
    }

    // el período y la fecha del reporte siempre vienen por default ...
    // para construir el período del listado leemos los registros seleccionados por el usuario
    let asientosContablesSeleccionados = Temp_Consulta_AsientosContables.find({ user: Meteor.userId() }).fetch();

    $scope.reportConfig = {};

    if (asientosContablesSeleccionados.length) {
        // estos valores en el reportConfig son siempre refrescados desde este código
        $scope.reportConfig.desde = lodash.minBy(asientosContablesSeleccionados, 'fecha').fecha;
        $scope.reportConfig.hasta = lodash.maxBy(asientosContablesSeleccionados, 'fecha').fecha;
        $scope.reportConfig.fecha = new Date();
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un 'reportConfig' anterior, lo usamos, aunque solo intentamos mantener algunos valores y no otros
    // nótese como guardamos el 'reportConfig' para este report en la misma forma en que guardamos los filtros
    let reportConfigAnterior = Filtros.findOne({ nombre: 'contab.report.asientosContables.config', userId: Meteor.userId() });

    if (reportConfigAnterior && reportConfigAnterior.reportConfig) {
        // estos valores en el reportConfig intentamos mantenerlos desde una ejecución a la otra
        $scope.reportConfig.saltoPaginaPorFecha = reportConfigAnterior.reportConfig.saltoPaginaPorFecha ? reportConfigAnterior.reportConfig.saltoPaginaPorFecha : false;
        $scope.reportConfig.titulo = reportConfigAnterior.reportConfig.titulo ? reportConfigAnterior.reportConfig.titulo : "";
    } else {
        // si no existe un config anterior, usamos defaults, para facilitar las cosas al usuario
        $scope.reportConfig.saltoPaginaPorFecha = false;
        $scope.reportConfig.titulo = "";
    }
    // ------------------------------------------------------------------------------------------------------

    $scope.reportLink_show = false;

    $scope.submitListadoAsientosContables2Form = function () {
        $scope.submitted = true;
        if ($scope.form.listadoAsientosContables2Form.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.form.listadoAsientosContables2Form.$setPristine();

            $scope.showProgress = true;

            $scope.reportConfig.ciaNumero = ciaSeleccionada.numero;
            $scope.reportConfig.ciaNombre = ciaSeleccionada.nombre;

            Meteor.call('contab.asientos.reporteWeb', $scope.reportConfig, (err, result) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                if (result.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: result.message });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message,
                });

                // ------------------------------------------------------------------------------------------------------
                // guardamos el 'reportConfig' indicado por el usuario
                let currentFilter = Filtros.findOne({ nombre: 'contab.report.asientosContables.config', userId: Meteor.userId() });

                if (currentFilter) {
                    // el filtro existía antes; lo actualizamos
                    // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                    if (currentFilter.reportConfig) {
                        Filtros.update( currentFilter._id, { $set: {
                            'reportConfig.saltoPaginaPorFecha': $scope.reportConfig.saltoPaginaPorFecha,
                            'reportConfig.titulo': $scope.reportConfig.titulo,
                        } }, { validate: false } );
                    } else {
                        // por alguna razón el registro existe en mongo, pero no tiene datos (???)
                        Filtros.remove( currentFilter._id );
                        Filtros.insert({
                            _id: new Mongo.ObjectID()._str,
                            userId: Meteor.userId(),
                            nombre: 'contab.report.asientosContables.config',
                            reportConfig: {
                                saltoPaginaPorFecha: $scope.reportConfig.saltoPaginaPorFecha,
                                titulo: $scope.reportConfig.titulo,
                            },
                        });
                    }
                }
                else {
                    Filtros.insert({
                        _id: new Mongo.ObjectID()._str,
                        userId: Meteor.userId(),
                        nombre: 'contab.report.asientosContables.config',
                        reportConfig: {
                            saltoPaginaPorFecha: $scope.reportConfig.saltoPaginaPorFecha,
                            titulo: $scope.reportConfig.titulo,
                        },
                    });
                }

                // ------------------------------------------------------------------------------------------------------
                // establecemos y mostramos el link que debe usar el usuario para obtener el reporte
                $scope.reportLink_show = true;
                $scope.reportLink = result.reportLink

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'contab.listadoAsientos.webReport' });
    EventDDP.addListener('contab.listadoAsientos.webReport.reportProgress', function(process) {
        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
