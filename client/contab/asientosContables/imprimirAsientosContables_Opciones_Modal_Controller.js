
import moment from 'moment';

angular.module("contabm").controller('ImprimirAsientosContables_Opciones_Modal_Controller',
['$scope', '$modalInstance', 'companiaSeleccionadaDoc',
function ($scope, $modalInstance, companiaSeleccionadaDoc) {

    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    $scope.companiaSeleccionadaDoc = companiaSeleccionadaDoc;

    $scope.ok = function () {
        $modalInstance.close($scope.parametros);
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.parametros = {};

    // ----------------------------------------------------------------------
    // intentamos recuperar el filtro
    let filtro = Filtros_clientColl.findOne({
                    nombreApp: 'contab',
                    nombreProc: 'asientos contables - imprimir reporte - opciones',
                    user: Meteor.userId(),
                });

    if (filtro) {
        $scope.parametros = filtro.filtro.parametros;
    }
    // ----------------------------------------------------------------------

    $scope.submitted = false;

    if (!$scope.parametros.fechaPropia)
        $scope.parametros.fechaPropia = moment(new Date()).format('DD-MMM-YYYY h:m a');

    $scope.submit_asientoContableListadoOpciones_Form = function () {

        if ($scope.parametros.mostrarFechaPropia === 'si' && !$scope.parametros.fechaPropia) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Si Ud. quiere mostrar su propia fecha en el listado, debe indicar una."
            });
            return;
        };

        $scope.submitted = true;

        $scope.alerts.length = 0;

        if ($scope.asientoContableListadoOpciones_Form.$valid) {
            $scope.submitted = false;
            // para que la clase 'ng-submitted deje de aplicarse a la forma ... button
            $scope.asientoContableListadoOpciones_Form.$setPristine();

            // -------------------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            Filtros_clientColl.remove({
                nombreApp: 'contab',
                nombreProc: 'asientos contables - imprimir reporte - opciones',
                // cia: companiaSeleccionadaDoc._id,                       // nótese que usamos el _id (mongo) y no el número (sql) ...
                user: Meteor.userId(),
            });

            Filtros_clientColl.insert({
                _id: new Mongo.ObjectID()._str,
                nombreApp: 'contab',
                nombreProc: 'asientos contables - imprimir reporte - opciones',
                filtro: {
                    parametros: $scope.parametros,
                },
                cia: companiaSeleccionadaDoc._id,                       // nótese que usamos el _id (mongo) y no el número (sql) ...
                user: Meteor.userId(),
            });
            // -------------------------------------------------------------------------------------------------------------------
            $scope.ok();
        }
    };
}
]);
