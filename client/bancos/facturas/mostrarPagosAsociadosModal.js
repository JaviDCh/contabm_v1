
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('MostrarPagosAsociadosModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$state', 'companiaContabSeleccionada', 'factura', 'origen',
function ($scope, $modalInstance, $modal, $meteor, $state, companiaContabSeleccionada, factura, origen) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = companiaContabSeleccionada;

    $scope.ok = function () {
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.origen = origen;
    $scope.pagosAsociadosList = [];

    $scope.showProgress = true;
    $meteor.call('facturasLeerPagosAsociados', factura.claveUnica).then(
        function (data) {

            let pagosAsociados = JSON.parse(data);

            // las fechas siempre quedan como strings luego de serializadas
            pagosAsociados.forEach((x) => {
                x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
            });

            $scope.pagosAsociadosList = pagosAsociados;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, <b>${pagosAsociados.length} pagos</b> han sido
                      leídos para esta factura.<br />
                      Haga un <em>click</em> en alguno de ellos para mostrarlo en forma separada.`,
            });

            $scope.showProgress = false;
        },
        function (err) {

            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
        });


    $scope.mostrarPagoSeleccionado = (pago) => {
        // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab ...
        var url2 = $state.href('bancos.pagos.pago',
                               {
                                   origen: origen,
                                   id: pago.claveUnicaPago,
                                   limit: 50,
                                   vieneDeAfuera: true,
                                   proveedorID: factura.proveedor,
                               });

        window.open(url2, '_blank');
    };
}
]);
