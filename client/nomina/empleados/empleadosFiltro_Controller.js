
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { Filtros } from '/imports/collections/general/filtros'; 

angular.module("contabm").controller("Nomina_EmpleadosFilter_Controller",
['$scope', '$stateParams', '$state', '$meteor', '$modal',
function ($scope, $stateParams, $state, $meteor, $modal) {

    // debugger;
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

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContab = {};

    if (companiaContabSeleccionada)
        companiaContab = Companias.findOne(companiaContabSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    // ------------------------------------------------------------------------------------------------


    // -------------------------------------------------------------------------------------------
    // leemos los catálogos en el $scope

    $scope.helpers({

        departamentos: () => {
            return Departamentos.find();
        },

        cargos: () => {
            return Cargos.find();
        },

    });


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.nuevo = function () {
        $state.go("nomina.empleados.empleado", { origen: 'edicion', id: '0', pageNumber: -1, vieneDeAfuera: false });
    };

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;

        Meteor.call('nomina_empleados_LeerDesdeSql', JSON.stringify($scope.filtro), companiaContab.numero, (err, result) => {

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

            if (Filtros.findOne({ nombre: 'nomina.empleados', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'nomina.empleados', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'nomina.empleados',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------

            // // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
            // Meteor.subscribe('tempConsulta_asientosContables', () => {


            $scope.showProgress = false;
            // $scope.$apply();
            $state.go('nomina.empleados.lista', { origen: $scope.origen, pageNumber: -1 });
            // });
        });
    };


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'nomina.empleados', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'nomina', process: 'leerNominaEmpleadosDesdeSqlServer' });
    EventDDP.addListener('nomina_leerNominaEmpleadosDesdeSqlServer_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
        // debugger;
    });
}
]);
