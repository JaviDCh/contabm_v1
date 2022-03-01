
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('VacacionesCalcularModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', '$state', 'vacacion', 'companiaContabSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, $state, vacacion, companiaContabSeleccionada) {

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

    $scope.calcularVacaciones = () => {
        $scope.showProgress = true;
        $meteor.call('nominaVacacionesCalcular', JSON.stringify(vacacion)).then(
            function (data) {
                // debugger;
                let result = JSON.parse(data);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });

                // la idea es aplicar los valores leídos solo si el usuario lo indica
                let keep = $scope.mantenerValoresCalculadosAntes;

                // el sueldo y la fecha de ingreso no pueden ser alterados por el usuario; por ese motivo,
                // simpre los actualizamos y no solo cuando el usuario los pone en blanco ...
                vacacion.sueldo = result.vacacion.sueldo;
                // al serializar y descerializar el object, las fechas quedan como strings ...
                vacacion.fechaIngreso = moment(result.vacacion.fechaIngreso).toDate();

                if (typeof vacacion.grupoNomina == 'undefined' || !keep)
                    vacacion.grupoNomina = result.vacacion.grupoNomina;

                if (typeof vacacion.cantDiasDisfrute_Feriados == 'undefined' || !keep)
                    vacacion.cantDiasDisfrute_Feriados = result.vacacion.cantDiasDisfrute_Feriados;

                if (typeof vacacion.cantDiasDisfrute_SabDom == 'undefined' || !keep)
                    vacacion.cantDiasDisfrute_SabDom = result.vacacion.cantDiasDisfrute_SabDom;

                if (typeof vacacion.cantDiasDisfrute_Total == 'undefined' || !keep && (vacacion.regreso && vacacion.salida))
                    vacacion.cantDiasDisfrute_Total = moment(vacacion.regreso).diff(moment(vacacion.salida), 'days') + 1;

                if (typeof vacacion.cantDiasDisfrute_Habiles == 'undefined' || !keep)
                    vacacion.cantDiasDisfrute_Habiles = (vacacion.cantDiasDisfrute_Total ? vacacion.cantDiasDisfrute_Total : 0) -
                                                        (vacacion.cantDiasDisfrute_Feriados ? vacacion.cantDiasDisfrute_Feriados : 0) -
                                                        (vacacion.cantDiasDisfrute_SabDom ? vacacion.cantDiasDisfrute_SabDom : 0);

                // al serializar y descerializar el object, las fechas quedan como strings ...
                if (typeof vacacion.fechaReintegro == 'undefined' || !keep)
                    vacacion.fechaReintegro = moment(result.vacacion.fechaReintegro).toDate();

                // estos valores vienen, inicialmente, como undefined y así es como deben permanecer ...
                // if (!keep) {
                //     vacacion.cantDiasPago_Habiles = null;
                //     vacacion.cantDiasPago_Feriados = null;
                //     vacacion.cantDiasPago_SabDom = null;
                //     vacacion.cantDiasPago_Total = null;
                //     vacacion.cantDiasPago_YaTrabajados = null;
                // }

                if (vacacion.periodoPagoDesde) {
                    // nótese que el período de pago es opcional
                    if (typeof vacacion.cantDiasPago_Feriados == 'undefined' || !keep)
                        vacacion.cantDiasPago_Feriados = result.vacacion.cantDiasPago_Feriados;

                    if (typeof vacacion.cantDiasPago_SabDom == 'undefined' || !keep)
                        vacacion.cantDiasPago_SabDom = result.vacacion.cantDiasPago_SabDom;

                    if (typeof vacacion.cantDiasPago_Total == 'undefined' || !keep)
                        if (vacacion.periodoPagoDesde && vacacion.periodoPagoHasta)
                            vacacion.cantDiasPago_Total = moment(vacacion.periodoPagoHasta).
                                                            diff(moment(vacacion.periodoPagoDesde), 'days') + 1;

                    if (typeof vacacion.cantDiasPago_YaTrabajados == 'undefined' || !keep)
                        if (vacacion.salida && vacacion.periodoPagoDesde)
                            if (vacacion.salida > vacacion.periodoPagoDesde)
                                vacacion.cantDiasPago_YaTrabajados =
                                    moment(vacacion.salida).diff(moment(vacacion.periodoPagoDesde), 'days');

                    if (typeof vacacion.cantDiasPago_Habiles == 'undefined' || !keep) {
                        vacacion.cantDiasPago_Habiles = vacacion.cantDiasPago_Total ? vacacion.cantDiasPago_Total : 0;
                        vacacion.cantDiasPago_Habiles -= vacacion.cantDiasPago_Feriados ? vacacion.cantDiasPago_Feriados : 0;
                        vacacion.cantDiasPago_Habiles -= vacacion.cantDiasPago_SabDom ? vacacion.cantDiasPago_SabDom : 0;
                        vacacion.cantDiasPago_Habiles -= vacacion.cantDiasPago_YaTrabajados ? vacacion.cantDiasPago_YaTrabajados : 0;
                    }
                };

                if (typeof vacacion.anoVacacionesDesde == 'undefined' || !keep)
                    vacacion.anoVacacionesDesde =
                        moment(result.vacacion.anoVacacionesDesde).isValid() ?
                        moment(result.vacacion.anoVacacionesDesde).toDate(): null;


                if (typeof vacacion.anoVacacionesHasta == 'undefined' || !keep)
                    vacacion.anoVacacionesHasta =
                        moment(result.vacacion.anoVacacionesHasta).isValid() ?
                        moment(result.vacacion.anoVacacionesHasta).toDate(): null;

                if (typeof vacacion.anoVacaciones == 'undefined' || !keep)
                    vacacion.anoVacaciones = result.vacacion.anoVacaciones;

                if (typeof vacacion.numeroVacaciones == 'undefined' || !keep)
                    vacacion.numeroVacaciones = result.vacacion.numeroVacaciones;

                if (typeof vacacion.cantDiasPago_Bono == 'undefined' || !keep)
                    vacacion.cantDiasPago_Bono = result.vacacion.cantDiasPago_Bono;

                if (typeof vacacion.cantDiasVacSegunTabla == 'undefined' || !keep)
                    vacacion.cantDiasVacSegunTabla = result.vacacion.cantDiasVacSegunTabla;

                if (typeof vacacion.baseBonoVacacional == 'undefined' || !keep)
                    vacacion.baseBonoVacacional = result.vacacion.baseBonoVacacional;


                // antes calculabamos el bono en el server; ahora regresamos la 'base' para su cálculo y lo
                // hacemos aquí. La idea es que el usuario pueda cambiar la base y los días y el programa
                // pueda recalcular el monto del bono ...
                if (typeof vacacion.montoBono == 'undefined' || !keep)
                    if (vacacion.cantDiasPago_Bono && vacacion.baseBonoVacacional)
                        vacacion.montoBono = vacacion.baseBonoVacacional / 30 * vacacion.cantDiasPago_Bono;


                if (typeof vacacion.proximaNomina_FechaNomina == 'undefined' || !keep)
                    vacacion.proximaNomina_FechaNomina =
                        moment(result.vacacion.proximaNomina_FechaNomina).isValid() ?
                        moment(result.vacacion.proximaNomina_FechaNomina).toDate(): null;


                if (typeof vacacion.proximaNomina_AplicarDeduccionPorAnticipo_CantDias == 'undefined' || !keep)
                    vacacion.proximaNomina_AplicarDeduccionPorAnticipo_CantDias = result.vacacion.proximaNomina_AplicarDeduccionPorAnticipo_CantDias;

                if (typeof vacacion.proximaNomina_AplicarDeduccionPorAnticipo == 'undefined' || !keep)
                    vacacion.proximaNomina_AplicarDeduccionPorAnticipo = result.vacacion.proximaNomina_AplicarDeduccionPorAnticipo;

                if (typeof vacacion.cantDiasVacPendAnosAnteriores == 'undefined' || !keep)
                    vacacion.cantDiasVacPendAnosAnteriores = result.vacacion.cantDiasVacPendAnosAnteriores;

                if (typeof vacacion.cantDiasVacDisfrutadosAntes == 'undefined' || !keep)
                    vacacion.cantDiasVacDisfrutadosAntes = result.vacacion.cantDiasVacDisfrutadosAntes;

                if (typeof vacacion.cantDiasVacDisfrutadosAhora == 'undefined' || !keep)
                    vacacion.cantDiasVacDisfrutadosAhora = vacacion.cantDiasDisfrute_Habiles ?
                                                           vacacion.cantDiasDisfrute_Habiles : 0;

                if (typeof vacacion.fechaNomina == 'undefined' || !keep)
                    vacacion.fechaNomina =
                        moment(result.vacacion.fechaNomina).isValid() ?
                        moment(result.vacacion.fechaNomina).toDate(): null;

                if (typeof vacacion.obviarEnLaNominaFlag == 'undefined' || !keep)
                    vacacion.obviarEnLaNominaFlag = result.vacacion.obviarEnLaNominaFlag;

                if (typeof vacacion.desactivarNominaDesde == 'undefined' || !keep)
                    vacacion.desactivarNominaDesde =
                        moment(result.vacacion.desactivarNominaDesde).isValid() ?
                        moment(result.vacacion.desactivarNominaDesde).toDate(): null;

                if (typeof vacacion.desactivarNominaHasta == 'undefined' || !keep)
                    vacacion.desactivarNominaHasta =
                        moment(result.vacacion.desactivarNominaHasta).isValid() ?
                        moment(result.vacacion.desactivarNominaHasta).toDate(): null;


                if (typeof vacacion.cantDiasVacPendientes == 'undefined' || !keep) {
                    vacacion.cantDiasVacPendientes = 0;

                    if (vacacion.cantDiasVacSegunTabla)
                        vacacion.cantDiasVacPendientes += vacacion.cantDiasVacSegunTabla;

                    if (vacacion.cantDiasVacPendAnosAnteriores)
                        vacacion.cantDiasVacPendientes += vacacion.cantDiasVacPendAnosAnteriores;

                    if (vacacion.cantDiasVacDisfrutadosAhora)
                        vacacion.cantDiasVacPendientes -= vacacion.cantDiasVacDisfrutadosAhora;

                    if (vacacion.cantDiasVacDisfrutadosAntes)
                        vacacion.cantDiasVacPendientes -= vacacion.cantDiasVacDisfrutadosAntes;
                }


                // cuando la vacación es nueva, el empleado es leído al calcular ...
                if (vacacion.docState && vacacion.docState == 1)
                   $scope.empleado = result.empleado;

                if (!vacacion.docState)
                    vacacion.docState = 2;

                $scope.showProgress = false;
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
            });
    }














}
]);
