
import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Filtros } from '/imports/collections/general/filtros'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { Bancos } from '/imports/collections/bancos/bancos';

import { FlattenBancos } from '/imports/general/bancos/flattenBancos'; 

angular.module("contabm").controller("Bancos_MovimientosBancarios_Filter_Controller",
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
        bancos: () => {
            return Bancos.find( {}, { fields: { banco: 1, nombre: 1 }} );
        },
        monedas: () => {
            return Monedas.find( {}, { fields: { moneda: 1, descripcion: 1, simbolo: 1 }} );
        },
        chequerasList: () => {
            // chequerasList_clientCollection es un 'client only' minimongo collection. Es creado en el
            // parent state para que exista para usarlo en este filter y mostrar una lista de chequeras al
            // usuario (algo editada y diferente a Chequeras)
            return chequerasList_clientCollection.find();
        },
    });


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.nuevo = function () {
        $state.go('bancos.movimientosBancarios.movimientoBancario', {
            origen: $scope.origen,
            id: "0",
            limit: 0,
            vieneDeAfuera: false
        });
    };

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };


    $scope.aplicarFiltroYAbrirLista = function () {

        $scope.showProgress = true;

        Meteor.call('bancos_movimientosBancarios_LeerDesdeSql', JSON.stringify($scope.filtro), companiaContab.numero, (err, result) => {

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

            if (Filtros.findOne({ nombre: 'bancos.movimientosBancarios', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'bancos.movimientosBancarios', userId: Meteor.userId() })._id,
                               { $set: { filtro: $scope.filtro } },
                               { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'bancos.movimientosBancarios',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------

            // // suscribimos a los asientos que se han leído desde sql y grabado a mongo para el usuario
            // Meteor.subscribe('tempConsulta_asientosContables', () => {


            $scope.showProgress = false;

            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            $state.go('bancos.movimientosBancarios.lista', { origen: $scope.origen, limit: 50 });
        });
    };


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación

    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'bancos.movimientosBancarios', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'leerBancosMovimientosBancariosDesdeSqlServer' });
    EventDDP.addListener('bancos_leerBancosMovimientosBancariosDesdeSqlServer_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
        // debugger;
    });


    // --------------------------------------------------------------------------------------------------
    $scope.usuarios = [];
    $scope.tipos = [];

    $scope.showProgress = true;

    // este método regresa los tipos y usuarios registrados en los movimientos bancarios; la idea
    // es regresar y mostrar solo tipos realmente usados y no todos los posibles ...
    Meteor.call('bancos_movimientosBancarios_LeerTiposYUsuariosRegistrados',
                JSON.stringify($scope.filtro),
                companiaContab.numero, (err, result) => {

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

        $scope.usuarios = result.usuarios;
        $scope.tipos = result.tipos;

        // ---------------------------------------------------------------------------------------------
        // construimos un array de cuentas bancarios, adecuado para mostrar en la lista en el filtro ...

        // en nuestro programa, el collecion Bancos tiene un array de agencias y, dentro, un array
        // de cuentas bancarias; con la siguiente función, regresamos una lista 'plana' para acceder
        // en forma más fácil las cuentas bancarias
        let cuentasBancariasList = FlattenBancos(companiaContab);
        $scope.cuentasBancarias = [];

        cuentasBancariasList.forEach((cuenta) => {
            let cuentaBancaria = {
                cuentaBancaria: cuenta.cuentaInterna,
                descripcion: `${cuenta.nombreBanco} - ${cuenta.simboloMoneda} - ${cuenta.cuentaBancaria}`,
            };

            $scope.cuentasBancarias.push(cuentaBancaria);
        });

        $scope.showProgress = false;
        $scope.$apply();
    });

}
]);
