

import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 
import { Filtros } from '/imports/collections/general/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Bancos_Pagos_Filter_Controller",
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
    };

    $scope.origen = $stateParams.origen;

    $scope.helpers({
        ciaContabSeleccionada: () => {
            return CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        },
        companiaSeleccionada: () => {
            return Companias.findOne($scope.ciaContabSeleccionada &&
                                     $scope.ciaContabSeleccionada.companiaID ?
                                     $scope.ciaContabSeleccionada.companiaID :
                                     -999,
                                     { fields:
                                        {
                                            numero: true,
                                            nombre: true,
                                            nombreCorto: true
                                        } });
        },
    });

    $scope.miSu_List = $scope.$parent.miSu_List;
    // ------------------------------------------------------------------------------------------------

    $scope.helpers({
        proveedores: () => {
            // la lista de compañías viene desde el parent state; allí hacemos el subscribe ...
            return Proveedores.find({ }, { fields: { proveedor: 1, nombre: 1, }, });
        },
        monedas: () => {
            return Monedas.find();
        },
    });

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.nuevo = function () {
        $state.go('bancos.pagos.pago', {
            origen: $scope.origen,
            id: "0",
            limit: 50,
        });
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;

        Meteor.call('bancos.pagos.leerDesdeSqlServer', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

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
            };

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'bancos.pagos', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'bancos.pagos', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'bancos.pagos',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------

            $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('bancos.pagos.lista', { origen: $scope.origen, limit: 50 });
        });
    };

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'bancos.pagos', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosPagosDesdeSqlServer' });
    EventDDP.addListener('bancos_leerBancosPagos_reportProgressDesdeSqlServer', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
