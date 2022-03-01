
import moment from 'moment';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm").controller('FacturasExportarAMicrosoftWordModalController',
['$scope', '$modalInstance', '$meteor', 'tiposArchivo', 'aplicacion', 'ciaSeleccionada', 'factura', 'facturasFiltro', 'user',
function ($scope, $modalInstance, $meteor, tiposArchivo, aplicacion, ciaSeleccionada, factura, facturasFiltro, user) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.helpers({
        template_files: () => {
            return Files_CollectionFS_Templates.find({
                'metadata.tipo': { $in: tiposArchivo },
                'metadata.aplicacion': aplicacion,
            });
        },
    })

    $scope.downLoadWordDocument = false;
    $scope.selectedFile = {};
    $scope.downLoadLink = "";

    $scope.obtenerDocumentoWord = (file) => {
        $scope.showProgress = true;

        if (file.metadata.tipo === 'BANCOS-RET-IMP-IVA') {
            // construimos y pasamos el período al meteor method
            let periodoRetencion = `${moment(factura.fechaRecepcion).format('MM')} - ${moment(factura.fechaRecepcion).format('YYYY')}`;

            Meteor.call('bancos.facturas.obtenerComprobanteRetencionIva', file._id,
                                                                          file.metadata.tipo,
                                                                          ciaSeleccionada,
                                                                          user,
                                                                          facturasFiltro, 
                                                                          periodoRetencion,
                                                                          file.original.name, (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                            Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                $scope.selectedFile = file;
                $scope.downLoadLink = result;
                $scope.downLoadWordDocument = true;

                $scope.showProgress = false;
                $scope.$apply();
            })

        } else if (file.metadata.tipo === 'BANCOS-RET-IMP-ISLR') {

            Meteor.call('bancos.facturas.obtenerComprobanteRetencionIslr', file._id,
                                                                           file.metadata.tipo,
                                                                           user,
                                                                           facturasFiltro, 
                                                                           file.original.name, (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                            Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                $scope.selectedFile = file;
                $scope.downLoadLink = result;
                $scope.downLoadWordDocument = true;

                $scope.showProgress = false;
                $scope.$apply();
            })

        } else if (file.metadata.tipo === 'BANCOS-FACTURAS') {

            Meteor.call('bancos.facturas.obtenerFacturaImpresa', file._id,
                                                                 file.metadata.tipo,
                                                                 user,
                                                                 facturasFiltro,
                                                                 file.original.name, (err, result) => {

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

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: `Ok, el documento (Word) ha sido construido en forma exitosa.<br />
                            Haga un <em>click</em> en el <em>link</em> que se muestra para obtenerlo.`,
                });

                $scope.selectedFile = file;
                $scope.downLoadLink = result;
                $scope.downLoadWordDocument = true;

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }

    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    Meteor.subscribe('template_files', aplicacion, tiposArchivo, () => {
        $scope.showProgress = false;
        $scope.$apply();
    })
  // --------------------------------------------------------------------------------------------------------------------
}
]);
