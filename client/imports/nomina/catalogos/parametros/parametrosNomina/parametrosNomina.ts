


import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { mensajeErrorDesdeMethod_preparar } from '../../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { parametrosNomina_schema } from '../../../../../../imports/collections/nomina/parametros.nomina.parametrosNomina'; 

import { Companias } from '../../../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../../../imports/collections/companiaSeleccionada';
import { Monedas } from '../../../../../../imports/collections/monedas';
import { TiposAsientoContable } from '../../../../../../imports/collections/contab/tiposAsientoContable'; 
import { CuentasContables2 } from '../../../../../../imports/collections/contab/cuentasContables2'; 

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm.nomina.catalogos").controller("catalogos_nomina_parametros_parametrosNomina_Controller",
['$scope', function ($scope) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada: any = null;
    let ciaContabSeleccionada: any = null;

    if (Meteor.userId()) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    $scope.helpers({ 
        monedas: () => { 
            return Monedas.find({}, { fields: { moneda: 1, descripcion: 1, }})
        }, 
        tiposAsientoContable: () => {
            return TiposAsientoContable.find();
        },
    })


    $scope.setIsEdited = function (field) {
        if ($scope.parametrosNomina.docState) { 
            return;
        }
            
        $scope.parametrosNomina.docState = 2;
    }


// proveemos una lista particular de cuentas contables para el dropdown en el ui-grid; la idea es mostrar
    // cuenta+descripción+cia, en vez de solo la cuenta contable ...
    $scope.cuentasContablesLista = [];
    
    CuentasContables2.find({ cia: ciaContabSeleccionada.numero, totDet: 'D', actSusp: 'A' },
                            { sort: { cuenta: true }} ).
                        forEach((cuenta: any) => {
                            // cuentaDescripcionCia() es un 'helper' definido en el collection CuentasContables ...
                            $scope.cuentasContablesLista.push({ id: cuenta.id, cuentaDescripcionCia: cuenta.cuentaDescripcionCia() });
                        })

    $scope.sumarizarAsientosContables_list = [
        { id: null, descripcion: " " }, 
        { id: 1, descripcion: "Una sola partida" }, 
        { id: 2, descripcion: "Por departamento" }, 
    ]

    $scope.save = function() { 

        $scope.showProgress = true;
        
        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];

        if ($scope.parametrosNomina && $scope.parametrosNomina.docState && $scope.parametrosNomina.docState != 3) {
            isValid = parametrosNomina_schema.namedContext().validate($scope.parametrosNomina);

            if (!isValid) {
                parametrosNomina_schema.namedContext().validationErrors().forEach(function (error) {
                    errores.push(`El valor '${error.value}' no es adecuado para el campo <b><em>${parametrosNomina_schema.label(error.name)}</b></em>; error de tipo '${error.type}'.`);
                });
            }
        }

        if (errores && errores.length) {
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                    errores.reduce(function (previous, current) {

                        if (previous == "")
                            // first value
                            return current;
                        else
                            return previous + "<br />" + current;
                    }, "")
            });

            $scope.showProgress = false;
            return;
        }
        
        Meteor.call('nomina.parametros.parametrosNomina.save', $scope.parametrosNomina, (err, saveMethodResult) => {
            
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

            // luego de grabar, y si no se ha producido un error, leemos nuevamente los registros desde la base de datos 
            Meteor.call('nomina.parametros.parametrosNomina.leerDesdeSqlServer', (err, result) => {

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
                        msg: result.message,
                    });
                
                    $scope.showProgress = false;
                    $scope.$apply(); 
                } else { 
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: saveMethodResult,          // mostramos el mensaje que regresó el save method y no el que lee sql server ...
                    });
                    
                    $scope.parametrosNomina = {}; 
                    $scope.parametrosNomina = JSON.parse(result.parametrosNomina); 
                    
                    $scope.showProgress = false;
                    $scope.$apply(); 
                }
            })
        })
    }


    $scope.showProgress = true;
    $scope.parametrosNomina = {}; 

    Meteor.call('nomina.parametros.parametrosNomina.leerDesdeSqlServer', (err, result) => { 

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
                msg: result.message,
            });
        
            $scope.showProgress = false;
            $scope.$apply(); 
        } else { 
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result.message,
            });
            
            $scope.parametrosNomina = JSON.parse(result.parametrosNomina); 

            $scope.showProgress = false;
            $scope.$apply();
        }
    })
}
])
