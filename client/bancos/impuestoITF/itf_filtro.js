

import lodash from 'lodash'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Monedas } from '../../../imports/collections/monedas'; 
import { Bancos } from '/imports/collections/bancos/bancos';

angular.module("contabm").controller("Bancos_ImpuestoITF_Filtro_Controller",
['$scope', '$meteor', '$modal', '$state', function ($scope, $meteor, $modal, $state) {

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

      // ------------------------------------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada)
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });
      // ------------------------------------------------------------------------------------------------------------------------------

      // obtenemos las cuentas bancarias, para la cia seleccionada,  en un array;
      // recuérdese que están en bancos --> agencias --> cuentas bancarias
      $scope.cuentasBancarias2 = lodash(Bancos.find().fetch())
                                                  .map('agencias')
                                                  .flatten()
                                                  .map('cuentasBancarias')
                                                  .flatten()
                                                  .filter((c) => { return c.cia == companiaSeleccionadaDoc.numero; })
                                                  .map((c) => { return {
                                                            cuentaInterna: c.cuentaInterna,
                                                            cuentaBancaria: Bancos.findOne({ 'agencias.cuentasBancarias._id': c._id }).abreviatura.toLowerCase() + "  " +
                                                                            c.cuentaBancaria +
                                                                            "  (" +
                                                                            Monedas.findOne({ moneda: c.moneda }).simbolo +
                                                                            " " +
                                                                            c.tipo + ")"
                                                    }})
                                                  .value();



    $scope.submitted = false;
    $scope.parametros = {};

    $scope.submit_filtroForm = function () {

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if (!$scope.parametros || !$scope.parametros.desde || !$scope.parametros.hasta) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar un período."
            });

            return;
        }

        if ($scope.parametros.desde > $scope.parametros.hasta) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Ud. debe indicar un período."
            });

            return;
        }

        // el período no debe abarcar más de un mes (ej: 1-1-15 al 10-2-15; inválido!)
        let mesInicial = $scope.parametros.desde.getMonth();
        let anoInicial = $scope.parametros.desde.getFullYear();

        let mesFinal = $scope.parametros.hasta.getMonth();
        let anoFinal = $scope.parametros.hasta.getFullYear();


        if (anoInicial != anoFinal || mesInicial != mesFinal) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "El período debe siempre definirse para un mes calendario; es decir, no debe abarcar más de un mes."
            });

            return;
        }


        if ($scope.filtroForm.$valid) {
            $scope.submitted = false;
            $scope.filtroForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            // debugger;

            $scope.showProgress = true;

            // -------------------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            Filtros_clientColl.remove({
                nombreApp: 'bancos',
                nombreProc: 'impuesto itf',
                cia: companiaSeleccionadaDoc._id,                       // nótese que usamos el _id (mongo) y no el número (sql) ...
                user: Meteor.userId(),
            });

            Filtros_clientColl.insert({
                _id: new Mongo.ObjectID()._str,
                nombreApp: 'bancos',
                nombreProc: 'impuesto itf',
                filtro: {
                    parametros: $scope.parametros,
                },
                cia: companiaSeleccionadaDoc._id,                       // nótese que usamos el _id (mongo) y no el número (sql) ...
                user: Meteor.userId(),
            });
            // -------------------------------------------------------------------------------------------------------------------

            // para reportar el progreso de la tarea en la página
            $scope.processProgress.current = 0;
            $scope.processProgress.max = 0;
            $scope.processProgress.progress = 0;

            $meteor.call('bancos_itf_leerMovimientosBancarios', $scope.parametros, companiaSeleccionada.companiaID).then(
                function (data) {
                    $state.go('bancos.impuestoTransaccionesFinancieras.lista');
                    $scope.showProgress = false;
                },
                function (err) {

                    let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                    if (err.errorType)
                        errorMessage += " (" + err.errorType + ")";

                    errorMessage += "<br />";

                    if (err.message)
                        // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                        errorMessage += err.message + " ";
                    else {
                        if (err.reason)
                            errorMessage += err.reason + " ";

                        if (err.details)
                            errorMessage += "<br />" + err.details;
                    };

                    if (!err.message && !err.reason && !err.details)
                        errorMessage += err.toString();

                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });

                    $scope.showProgress = false;
                });
        }
    };

    // para reportar el progreso de la tarea en la página
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'agregarMovimientos_ITF' });
    EventDDP.addListener('bancos_agregarMovimientos_ITF_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();

        // debugger;
    });


    // ----------------------------------------------------------------------
    // intentamos recuperar el filtro
    let filtro = Filtros_clientColl.findOne({
                    nombreApp: 'bancos',
                    nombreProc: 'impuesto itf',
                    cia: companiaSeleccionadaDoc._id,                       // nótese que usamos el _id (mongo) y no el número (sql) ...
                    user: Meteor.userId(),
                });

    if (filtro) {
        if (!$scope.parametros)
            $scope.parametros = {};

        $scope.parametros.desde = filtro.filtro.parametros.desde;
        $scope.parametros.hasta = filtro.filtro.parametros.hasta;

        $scope.parametros.cuentasBancarias = filtro.filtro.parametros.cuentasBancarias ? filtro.filtro.parametros.cuentasBancarias : [];
    };
    // ----------------------------------------------------------------------
}
]);
