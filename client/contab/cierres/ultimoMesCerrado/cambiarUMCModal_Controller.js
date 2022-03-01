
angular.module("contabm").controller('Contab_CambiarUMCModal_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'companiaSeleccionadaDoc', 'ultimoMesCerrado', 'anosArray', 'mesesDelAnoFiscal',
function ($scope, $modalInstance, $modal, $meteor, companiaSeleccionadaDoc, ultimoMesCerrado, anosArray, mesesDelAnoFiscal) {

    // debugger;
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionadaDoc = companiaSeleccionadaDoc;

    $scope.anosArray = anosArray;
    $scope.mesesArray = [];

    // la diferencia entre Contab y Bancos es que Bancos se rige siempre por años calendarios; en Contab, el año fiscal puede
    // diferir del año calendario ...
    mesesDelAnoFiscal.forEach((mesFiscal) => {
        if (mesFiscal.mesFiscal != 13)      // el usuario no debe poder retroceder a un mes 'anual' ... 
            $scope.mesesArray.push({ mesFiscal: mesFiscal.mesFiscal, nombre: mesFiscal.nombreMes, });
    });

    $scope.parametros = {};
    $scope.parametros.mesFiscal = [ ultimoMesCerrado.mes ];
    $scope.parametros.ano = [ ultimoMesCerrado.ano ];

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.submitted = false;

    $scope.submit_bancos_cambiarUMC_Form = function () {

        // debugger;
        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.parametros.mesFiscal.length == 0 || $scope.parametros.mesFiscal.length > 1 ||
            $scope.parametros.ano.length == 0 || $scope.parametros.ano.length > 1) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
              type: 'danger',
              msg: `Ud. debe seleccionar un elemento en cada lista. `
            });
            return;
        };

        // nos aseguramos que el usuario no adelante el mes cerrado; solo puede atrasarlo ...

        let ano2 = $scope.parametros.ano[0];
        let mes2 = $scope.parametros.mesFiscal[0];

        if (ano2 == ultimoMesCerrado.ano && mes2 == ultimoMesCerrado.mes) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
              type: 'danger',
              msg: `Ud. no ha cambiado el <em>último mes cerrado</em>;
                   para cerrar la forma sin efectuar ningún cambio, haga un <em>click</em> en <em>Cerrar</em>. `
            });
            return;
        };

        if (ano2 > ultimoMesCerrado.ano) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
              type: 'danger',
              msg: `Ud. no puede adelantar el mes cerrado a uno posterior; solo puede atrasarlo a un mes anterior. `
            });
            return;
        };

        if (ano2 == ultimoMesCerrado.ano && mes2 > ultimoMesCerrado.mes) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
              type: 'danger',
              msg: `Ud. no puede adelantar el mes cerrado a uno posterior; solo puede atrasarlo a un mes anterior. `
            });
            return;
        };

        if ($scope.bancos_cambiarUMC_Form.$valid) {
            // debugger;
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.bancos_cambiarUMC_Form.$setPristine();

            // actualizamos el ultimoMesCerrado con los valores necesarios y lo pasamos al meteor method que
            // lo actualiza en sql server

            let umc = _.clone(ultimoMesCerrado);

            umc.mes = mes2;
            umc.ano = ano2;
            umc.usuario = Meteor.user().emails[0].address;
            umc.manAuto = "M";
            umc.ultAct = new Date();

            delete umc.manAuto2;
            delete umc.mes2;
            delete umc.ultAct2;

            $scope.showProgress = true;

            $meteor.call('contabUpdateUMC', umc).then(
              function (data) {
                  //   debugger;
                //   $scope.alerts.length = 0;
                //   $scope.alerts.push({
                //     type: 'info',
                //     msg: `Ok, el <em>último mes cerrado</em> ha sido cambiado en forma satisfactoria.<br />
                //     El nuevo valor para el <em>último mes cerrado</em> es: ${nombreMes(mes2)} / ${ano2.toString()} `
                //   });

                  // TODO: cerrar este modal; al hacerlo, ejecutar nuevamente el meteor method que lee el UMC,
                  // para que el usuario pueda verlo ...
                  $scope.showProgress = false;
                  $scope.ok();                  // cerramos el modal y regresamos ...
              },
                function (err) {
                    //   debugger;
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
}
]);

function nombreMes(mes) {

    switch (mes) {
        case 0:
            return 'Ninguno';
            break;
        case 1:
            return 'Enero';
            break;
        case 2:
            return 'Febrero';
            break;
        case 3:
            return 'Marzo';
            break;
        case 4:
            return 'Abril';
            break;
        case 5:
            return 'Mayo';
            break;
        case 6:
            return 'Junio';
            break;
        case 7:
            return 'Julio';
            break;
        case 8:
            return 'Agosto';
            break;
        case 9:
            return 'Septiembre';
            break;
        case 10:
            return 'Octubre';
            break;
        case 11:
            return 'Noviembre';
            break;
        case 12:
            return 'Diciembre';
            break;
        case 13:
            return 'Anual';
            break;
        default:
            return "Indefinido (?)";
    };
};
