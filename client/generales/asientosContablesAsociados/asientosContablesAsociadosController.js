
import moment from 'moment';
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('AsientosContablesAsociados_Controller',
['$scope', '$modalInstance', '$modal', '$state', 'provieneDe', 'entidadID', 'ciaSeleccionada', 'origen', 'docState', 
function ($scope, $modalInstance, $modal, $state, provieneDe, entidadID, ciaSeleccionada, origen, docState) {

    // abrimos un modal para mostrar los asientos contables asociados a alguna entidad; ejemplos de
    // entidades son: bancos, facturas, nomina, pagos, etc.

    // un ejemplo de un asiento asociado a un movimiento bancario, tendría estos valores en estos
    // campos: ProvieneDe: 'Bancos', ProvieneDe_ID: claveUnica del movimiento bancario.

    // origen: edicion/consulta; la idea es permitir o no editar el asiento contable mostrado o
    // permtir construir uno ...

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function (asientoContableID) {
        // regresamos el _id del asiento que el usuario seleccionó en la lista ...
        // let result = { asientoContableID: asientoContableID };
        // $modalInstance.close(result);
        $modalInstance.close('Ok');
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.origen = origen;
    $scope.asientosContablesAsociadosList = [];

    $scope.showProgress = true;

    Meteor.call('leerAsientosContablesAsociados', provieneDe, entidadID, ciaSeleccionada.numero, (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: errorMessage });

            $scope.showProgress = false;
            $scope.$apply();

            return;
        }

        let asientosContablesAsociadosList = JSON.parse(result);

        // las fechas siempre quedan como strings luego de serializadas
        asientosContablesAsociadosList.forEach((x) => {
            x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
        })

        $scope.asientosContablesAsociadosList = asientosContablesAsociadosList;

        $scope.alerts.length = 0;
        $scope.alerts.push({
            type: 'info',
            msg: `Ok, <b>${asientosContablesAsociadosList.length}</b> asientos contables han sido
                  leídos para esta entidad.<br />
                  Haga un <em>click</em> en alguno de ellos para mostrarlo en forma separada.`,
        });

        $scope.showProgress = false;
        $scope.$apply();
    })


    $scope.mostrarAsientoSeleccionado = (asientoContableID) => {

        $scope.showProgress = false;

        // cerramos el modal y regresamos el pk del asiento seleccionado ...
        // $scope.ok(asientoContableID);

        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo
        // (para el current user)
        Meteor.call('asientoContable_leerByID_desdeSql', asientoContableID, (err, result) => {

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

            let filtro = {
                _id: result.asientoContableMongoID
            };

            // nótese como angular nos permite abrir un route desde el code y, con window.open, en otro Tab! ...
            var url2 = $state.href('contab.asientosContables.asientoContable',
                                   {
                                       origen: origen,
                                       id: result.asientoContableMongoID,
                                       pageNumber: 0,
                                       vieneDeAfuera: true
                                   });

            window.open(url2, '_blank');

            $scope.showProgress = false;
        });
    };

    $scope.agregarAsientoContable = () => {

        // además del origen normal, Factuas, Bancos, etc., la función puede recibir 'facturas_retencion_impuestos' para que se 
        // genere el asiento de retenciones de impuestos para una factura ... 

        // el usuario modificó la entidad (mov bancario / factura / ...); indicamos que debe grabar ...
        if (docState) {
            DialogModal($modal,
                        "<em>Generación de asientos contables - Los datos no se han guardado</em>",
                        `Aparentemente, Ud. ha efectuado cambios en el registro.<br />
                         Por favor cierre este diálogo y grabe sus cambios.<br />
                         Ud. debe hacer un <em>click</em> en <em>Grabar</em> para registrar los cambios,
                         luego regrese e intente agregar el asiento contable.
                        `, false);
            return;
        }

        $scope.showProgress = true;
        // ejecutamos un método en el servidor que lee la 'entidad' (factura, mov banc, pago, etc.) y
        // agrega un asiento contable para la mismo ...

        // usamos 'apply' en vez de 'call' para que el método no se ejecute nuevamente luego de un cierto timeout;
        // nótese que la idea es que el debugging sea más friendly, pues al hacerlo pasa algún tiempo, el method hace un
        // timeout y se reejecuta; a veces multiples veces ...
        // Meteor.apply(name, args, [options], [asyncCallback])
        Meteor.apply('generales.agregarAsientoContableAEntidad',
                     [ provieneDe, entidadID, ciaSeleccionada.numero ],
                     { noRetry: true },
                     (err, result) =>  {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage,
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }

            // luego de agregado el asiento para la entidad, leemos y mostramos en la lista ...
            Meteor.call('leerAsientosContablesAsociados', provieneDe, entidadID, ciaSeleccionada.numero, (err, result2) => {

                if (err) {
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                    $scope.alerts.length = 0;
                    $scope.alerts.push({ type: 'danger', msg: errorMessage });

                    $scope.showProgress = false;
                    $scope.$apply();

                    return;
                }

                let asientosContablesAsociadosList = JSON.parse(result2);

                // las fechas siempre quedan como strings luego de serializadas
                asientosContablesAsociadosList.forEach((x) => {
                    x.fecha = moment(x.fecha).format('DD-MMM-YYYY');
                });

                $scope.asientosContablesAsociadosList = asientosContablesAsociadosList;

                $scope.alerts.length = 0;

                if (result.error) {
                    // se produjo un error al intentar construir y grabar el asiento contable asociado
                    $scope.alerts.push({
                        type: 'danger',
                        msg: result.message,
                    });
                } else {
                    $scope.alerts.push({
                        type: 'info',
                        msg: `Ok, <b>${asientosContablesAsociadosList.length}</b> asientos contables han sido leídos para
                          esta entidad.<br />
                          Haga un <em>click</em> en alguno de ellos para mostrarlo en forma separada.`,
                    })
                }

                $scope.showProgress = false;
                $scope.$apply();
            })
        })
    }
}
]);
