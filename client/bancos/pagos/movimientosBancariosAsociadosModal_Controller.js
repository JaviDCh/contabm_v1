
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('Pagos_MovimientoBancarioAsociado_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$state', 'pagoID', 'proveedorID', 'ciaSeleccionada', 'origen',
function ($scope, $modalInstance, $modal, $meteor, $state, pagoID, proveedorID, ciaSeleccionada, origen) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.origen = origen;
    $scope.movimientosBancariosAsociadosList = [];

    $scope.showProgress = true;
    $meteor.call('leerMovimientosBancariosAsociados', pagoID).then(
        function (data) {

            let movimientosBancariosList = JSON.parse(data);

            // las fechas siempre quedan como strings luego de serializadas
            movimientosBancariosList.forEach((x) => {
                x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
            });

            $scope.movimientosBancariosAsociadosList = movimientosBancariosList;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `Ok, <b>${movimientosBancariosList.length} movimientos bancarios</b> han sido
                      leídos para este pago.<br />
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


    $scope.mostrarMovimientoBancarioSeleccionado = (movimientoBancarioID) => {

        // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab ...
        var url2 = $state.href('bancos.movimientosBancarios.movimientoBancario',
                               {
                                   origen: origen,
                                   id: movimientoBancarioID,
                                   limit: 50,
                                   vieneDeAfuera: true,
                                   proveedorID: proveedorID,
                               });

        window.open(url2, '_blank');
    };

    $scope.agregarMovimientoBancario = () => {
        $scope.showProgress = true;
        $meteor.call('bancos.pagos.agregarMovimientoBancario', pagoID).then(
            function (data0) {

                if (data0.error) {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: data0.message,
                    });

                    $scope.showProgress = false;
                    return;
                }

                $meteor.call('leerMovimientosBancariosAsociados', pagoID).then(
                    function (data) {

                        let movimientosBancariosList = JSON.parse(data);
                        // las fechas siempre quedan como strings luego de serializadas
                        movimientosBancariosList.forEach((x) => {
                            x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
                        });

                        $scope.movimientosBancariosAsociadosList = movimientosBancariosList;

                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'info',
                            msg: `Ok, <b>${movimientosBancariosList.length} movimientos bancarios</b> han sido
                                  leídos para este pago.<br />
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
            },
            function (err) {

                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'danger', msg: errorMessage });

                $scope.showProgress = false;
            });
    };
}
]);
