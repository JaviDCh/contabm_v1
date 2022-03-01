

import * as lodash from 'lodash';
import * as angular from 'angular';

import { Monedas } from '../../../imports/collections/monedas';
import { Companias } from '../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../imports/collections/companiaSeleccionada';
import { Filtros } from '../../../imports/collections/general/filtros'; 
import { CuentasContables2 } from '../../../imports/collections/contab/cuentasContables2'; 

import { mensajeErrorDesdeMethod_preparar } from '../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Contab_ReconversionMonetaria_Controller",
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
    }

    $scope.origen = $stateParams.origen;

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let ciaContabSeleccionadaID = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

    if (ciaContabSeleccionadaID) { 
        $scope.companiaSeleccionada = Companias.findOne(ciaContabSeleccionadaID.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
        
    if (!$scope.companiaSeleccionada) { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.helpers({
        monedas: () => {
            return Monedas.find();
        },
    })

    // mostramos un mensaje al usuario si la tabla cuentasContables2 no existe en el client 
    if (CuentasContables2.find().count() === 0) { 
        let message = `Aparentemente, la <em>tabla de cuentas contables</em> no existe en el navegador. Por esta razón, 
                       es probable que Ud. no vea las cuentas contables en la lista.<br /><br />
                       Para corregir esta situación, Ud. debe ejecutar la opción <em>contab / generales / persistir cuentas contables</em>. <br />
                       Luego puede regresar a esta función para editar o consultar los asientos contables.`; 

        $scope.alerts.length = 0;
        $scope.alerts.push({ type: 'warning', msg: message }); 
    }


    // ahora construimos una lista enorme con las cuentas contables, desde cuentasContables2, que siempre está en el client; esta lista tiene 
    // una descripción para que se muestre cuando el usuario abre el ddl en el ui-grid ... 
    $scope.cuentasContablesLista = []; 
    CuentasContables2.find({ 
        cia: ($scope.companiaSeleccionada && $scope.companiaSeleccionada.numero ? $scope.companiaSeleccionada.numero : 0), 
        totDet: 'D', 
        actSusp: 'A' 
    },
    { 
        sort: { cuenta: true } 
    }).
    forEach((cuenta) => {
        // cuentaDescripcionCia() es un 'helper' definido en el collection CuentasContables ...
        $scope.cuentasContablesLista.push({ id: cuenta.id, cuentaDescripcionCia: cuenta.cuentaDescripcionCia() });
    }); 

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }

    // nótese lo que hacemos para corregir un bug (?) que se presenta a veces con angular; las formas no se 
    // registran en el $scope y se muestran con undefined
    $scope.form = {
        filtroForm: {}
      };

    $scope.submitted = false;

    $scope.submit_filtroForm = function () {

        $scope.alerts.length = 0;
        let validationErrors = false; 

        if (Array.isArray($scope.filtro.cuentaContable) && $scope.filtro.cuentaContable.length > 1) { 
            $scope.alerts.push({
                type: 'danger',
                msg: `Por favor seleccione <b>una sola</b> cuenta contable en la lista.`
            });

            validationErrors = true; 
        }

        if (Array.isArray($scope.filtro.ano) && $scope.filtro.ano.length > 1) { 
            $scope.alerts.push({
                type: 'danger',
                msg: `Por favor seleccione <b>un solo</b> año en la lista.`
            });

            validationErrors = true; 
        }

        if (validationErrors) { 
            return; 
        }

        $scope.submitted = true;

        if ($scope.form.filtroForm.$valid) {
            $scope.submitted = false;
            $scope.form.filtroForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'contab.reconversionMonetaria', userId: Meteor.userId() })) {
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'contab.reconversionMonetaria', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            }
            else {
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'contab.reconversionMonetaria',
                    filtro: $scope.filtro
                });
            }

            $scope.alerts.push({
                type: 'info',
                msg: `Ok, el filtro ha sido registrado en forma satisfactoria ...`
            });
        }
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'contab.reconversionMonetaria', userId: Meteor.userId() });

    // solo hacemos el subscribe si no se ha hecho antes; el collection se mantiene a lo largo de la session del usuario
    if (filtroAnterior) {
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }

    $scope.showProgress = true;

    Meteor.call('contab_leerAnosSaldosContables', $scope.companiaSeleccionada.numero, (err, result) => {

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

        if (lodash.isArray(result)) {
            $scope.anosArray = lodash.sortBy(result, (x) => { return -x; });
        }

        $scope.showProgress = false;
        $scope.$apply();
    })

    $scope.reconvertir = function() { 

        let filtro = $scope.filtro; 
        filtro.cia = $scope.companiaSeleccionada.numero; 

        Meteor.call('contab.reconversion.reconversion', filtro, (err, result) => {

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

            if (result.error) { 
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();

                return;
            }
    
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message
            });
    
            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'leerSaldosContablesDesdeSqlServer' });
    EventDDP.addListener('contab_leerSaldosContablesDesdeSqlServer_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
}
])
