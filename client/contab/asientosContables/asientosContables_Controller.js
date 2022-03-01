

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 

angular.module("contabm").controller("Contab_AsientosContables_Controller", ['$scope', '$stateParams', '$state', function ($scope, $stateParams, $state) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // mostramos un mensaje al usuario si la tabla cuentasContables2 no existe en el client 
    if (CuentasContables2.find().count() === 0) { 
        let message = `Aparentemente, la <em>tabla de cuentas contables</em> no existe en el navegador. Por esta razón, 
                       es probable que Ud. no vea las cuentas contables en la lista para cada partida del asiento.<br /><br />
                       Para corregir esta situación, Ud. debe ejecutar la opción <em>contab / generales / persistir cuentas contables</em>. <br />
                       Luego puede regresar a esta función para editar o consultar los asientos contables.`; 

        $scope.alerts.length = 0;
        $scope.alerts.push({ type: 'warning', msg: message }); 
    } else { 
        // determinamos la cantidad de registros en la tabla de cuentas contables. La idea es comparar contra la cantidad que 
        // existe en CuentasContables2. De ser diferentes, informamos que se debe refrescar este 'cache' ... 
        Meteor.call('getCollectionCount', 'CuentasContables', (err, result) => {

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

            // el método regresa la cantidad de items en el collection 
            let recordCount = result;

            if (recordCount != CuentasContables2.find().count()) { 
                let message = `Aparentemente, la cantidad de cuentas contables en la <em>tabla de cuentas contables</em> es 
                               <b>diferente</b> a la <em>copia</em> que existe para la misma en el navegador. <br />
                               Esto puede indicar que esta copia no es igual a la tabla y, por lo tanto, deba ser refrescada. <br /><br />
                               Para corregir esta situación, Ud. debe ejecutar la opción:  
                               <em>contab / generales / persistir cuentas contables</em>. <br />
                               Luego puede regresar a esta función para editar o consultar los asientos contables.`; 
        
                $scope.alerts.length = 0;
                $scope.alerts.push({ type: 'warning', msg: message }); 
            }

            $scope.showProgress = false;
            $scope.$apply();
        })
    }
    
    let companiaSeleccionada = { };
    $scope.companiaSeleccionada = { };

    // ejecutamos un método para leer los centros de costro desde sql server 
    // los centros de costro no existen en mongo; los leemos directamente desde sql server y los agregamos a un array en $scope para que estén 
    // disponiles para todos los children de este state ... 
    $scope.showProgress = true;
    $scope.centrosCosto = [];

    Meteor.subscribe('catalogosContab', () => {
        // Ok, los catálogos necesarios están en el client

        // leemos la compañía seleccionada
        companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

        if (companiaSeleccionada) { 
            $scope.companiaSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, 
                { fields: { numero: true, nombre: true, nombreCorto: true } });

            if (!$scope.companiaSeleccionada) { 
                $scope.companiaSeleccionada = { nombre: "No hay una compañía seleccionada ..." };
            }
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

        Meteor.call('contab.leerCentrosCostro.desdeSqlServer',(err, result) => {

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

            $scope.centrosCosto = JSON.parse(result); 
    
            // agregamos un evento para que el child controller sepa que ahora tenemos los centros de costo en el parent controller 
            // los centros de costo son mostrados en la lista de partidas en un ddl; deben existir para que la lista pueda ser mostrada 
            $scope.$broadcast('actualizarCatalogos', { "val": null }); 
    
            $scope.showProgress = false;
    
            // para que el child controller (asientoContable) ejecute el watch sobre este array y muestre los centros de costo en el ddl en el ui-grid
            $scope.$digest();           // (según angular docs) Processes all of the watchers of the current scope and its children.      
            $scope.$apply();
        })
    })

  }
]);
