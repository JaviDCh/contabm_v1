

import lodash from 'lodash';

import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Filtros } from '/imports/collections/general/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Contab_Consultas_Saldos_Filtro_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.origen = $stateParams.origen;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada) {
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
    // ------------------------------------------------------------------------------------------------

    $scope.helpers({
        monedas: () => {
            return Monedas.find();
        },
    })

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    $scope.aplicarFiltroYAbrirLista = function () {

        if (lodash.isEmpty($scope.filtro)) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: `Por favor indique un <b><em>filtro</em></b> a este proceso. La ejecución de este proceso sin la aplicación de un filtro seria,
                      probablemente, muy costosa.`
            });

            return;
        }

        $scope.showProgress = true;

        Meteor.call('contab_consulta_saldos_LeerDesdeSql', JSON.stringify($scope.filtro), companiaContab.numero, (err, result) => {

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

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'contab.consulta.saldos', userId: Meteor.userId() })) {
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'contab.consulta.saldos', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            }
            else {
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'contab.consulta.saldos',
                    filtro: $scope.filtro
                });
            }

            $scope.showProgress = false;
            $state.go('contab.consulta_saldos.lista', { origen: $scope.origen, pageNumber: -1 });
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'contab.consulta.saldos', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) {
        $scope.filtro = _.clone(filtroAnterior.filtro);
    }

    $scope.showProgress = true;

    Meteor.call('contab_leerAnosSaldosContables', companiaContab.numero, (err, result) => {

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

        if (_.isArray(result)) {
            $scope.anosArray = lodash.sortBy(result, (x) => { return -x; });
        }

        $scope.showProgress = false;
        $scope.$apply();
    })


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'leerSaldosContablesDesdeSqlServer' });
    EventDDP.addListener('contab_leerSaldosContablesDesdeSqlServer_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
}
])
