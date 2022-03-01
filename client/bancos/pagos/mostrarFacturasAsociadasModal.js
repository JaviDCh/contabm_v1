
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('MostrarFacturasAsociadasModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$state', 'companiaContabSeleccionada', 'pago', 'origen',
function ($scope, $modalInstance, $modal, $meteor, $state, companiaContabSeleccionada, pago, origen) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = companiaContabSeleccionada;

    $scope.ok = function (asientoContableID) {
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.origen = origen;
    $scope.cuotasFacturaAsociadasList = [];

    $scope.showProgress = true;
    $meteor.call('pagosLeerFacturasAsociadas', pago.claveUnica).then(
        function (data) {

            let cuotasFacturaAsociadas = JSON.parse(data);

            // las fechas siempre quedan como strings luego de serializadas
            cuotasFacturaAsociadas.forEach((x) => {
                x.fechaEmision = moment(x.fechaEmision).format('DD-MMM-YYYY');
                x.fechaRecepcion = moment(x.fechaRecepcion).format('DD-MMM-YYYY');
            });

            $scope.cuotasFacturaAsociadasList = cuotasFacturaAsociadas;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, <b>${cuotasFacturaAsociadas.length} facturas</b> han sido
                      leídas para este pago.<br />
                      Haga un <em>click</em> en alguna de ellas para mostrarla en forma separada.`,
            });

            $scope.showProgress = false;
        },
        function (err) {

            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
        });


    $scope.mostrarFacturaSeleccionada = (cuotaFactura) => {
        // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab ...
        var url2 = $state.href('bancos.facturas.factura',
                               {
                                   origen: origen,
                                   id: cuotaFactura.claveUnicaFactura,
                                   limit: 50,
                                   vieneDeAfuera: true,
                                   proveedorID: cuotaFactura.proveedorID,
                               });

        window.open(url2, '_blank');
    };
}
]);
