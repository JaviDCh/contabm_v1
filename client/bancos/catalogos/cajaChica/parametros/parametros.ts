

import * as angular from 'angular';
import * as lodash from 'lodash';
import { Meteor } from 'meteor/meteor';

import { CompaniaSeleccionada } from '../../../../../imports/collections/companiaSeleccionada';
import { Companias } from '../../../../../imports/collections/companias';
import { CuentasContables2 } from '../../../../../imports/collections/contab/cuentasContables2'; 
import { TiposAsientoContable } from '../../../../../imports/collections/contab/tiposAsientoContable'; 

import { CajaChica_Parametros_SimpleSchema } from '../../../../../imports/collections/bancos/cajaChica.cajasChicas'; 
import { mensajeErrorDesdeMethod_preparar } from '../../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

import { DialogModal } from '../../../../generales/angularGenericModal'; 

angular.module("contabm.contab.catalogos").controller("Catalogos_Bancos_CajaChica_Parametros_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let ciaContab = {} as any;

    if (companiaSeleccionada) { 
        ciaContab = Companias.findOne(companiaSeleccionada.companiaID);
    }
        
    $scope.companiaSeleccionada = {};
    let numeroCiaContabSeleccionada = -9999;

    if (ciaContab) {
        $scope.companiaSeleccionada = ciaContab;
        numeroCiaContabSeleccionada = ciaContab.numero;
    }
    else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
    // ------------------------------------------------------------------------------------------------

    $scope.setIsEdited = function (value) {
        if (!$scope.cajaChica_parametros.docState) { 
            $scope.cajaChica_parametros.docState = 2;
        }

        return;
    }


    $scope.refresh0 = function () {
        if ($scope.cajaChica_parametros && $scope.cajaChica_parametros.docState && $scope.cajaChica_parametros.docState === 1) { 
            DialogModal($modal, "<em>Bancos - Caja chica - Parámetros</em>",
                                `Ud. está ahora agregando un registro nuevo, no hay nada que refrescar.
                                `,
                                false); 
            return; 
        }

        if ($scope.cajaChica_parametros && $scope.cajaChica_parametros.docState) {
            DialogModal($modal, "<em>Bancos - Caja chica - Parámetros</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así,
                                desea <em>refrescar el registro</em> y perder los cambios?`,
                                true).then(
                function (resolve) {
                    refresh();
                },
                function (err) {
                    return true;
                })

            return;
        }
        else { 
            refresh();
        }
    }

    let refresh = () => {
        $scope.cajaChica_parametros = { 
            id: 0, 
            tipoAsiento: "", 
            cuentaContablePuenteID: 0, 
            cia: 0, 
        }

        $scope.showProgress = true;
        leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
            (result: any) => { 
                $scope.cajaChica_parametros = JSON.parse(result);

                $scope.showProgress = false;
                $scope.$apply();
            }, 
            (err) => { 
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
        
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
            }
        )
    }

    $scope.helpers({ 
        tiposAsientoContable: () => { 
            return TiposAsientoContable.find({}, { sort: { descripcion: 1 }}); 
        }
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


    $scope.grabar = function () {
        $scope.showProgress = true;

        let editedItem = $scope.cajaChica_parametros;

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores: string[] = [];


        isValid = CajaChica_Parametros_SimpleSchema.namedContext().validate(editedItem);

        if (!isValid) {
            CajaChica_Parametros_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + CajaChica_Parametros_SimpleSchema.label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
            })
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

        Meteor.call('bancos.cajaChica.catalogos.parametros.save', editedItem, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                    (result: any) => { 
                        $scope.cajaChica_parametros = JSON.parse(result);
                        
                        $scope.showProgress = false;
                        $scope.$apply();
                    }, 
                    (err) => { 
                        let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                        $scope.alerts.length = 0;
                        $scope.alerts.push({
                            type: 'danger',
                            msg: errorMessage
                        });
            
                        $scope.showProgress = false;
                        $scope.$apply();
                    }
                )
                return; 
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: result
            });

            leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
                (result: any) => { 
                    $scope.cajaChica_parametros = JSON.parse(result);
            
                    $scope.showProgress = false;
                    $scope.$apply();
                }, 
                (err) => { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
            
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
                }
            )
        })
    }

    $scope.cajaChica_parametros = { 
        id: 0, 
        tipoAsiento: "", 
        cuentaContablePuenteID: 0, 
        cia: 0, 
    }

    $scope.showProgress = true;
    leerItemsDesdeSqlServer($scope.companiaSeleccionada.numero).then(
        (result: any) => { 
            $scope.cajaChica_parametros = JSON.parse(result);
            
            // leemos los rubros desde sql server, para construir el ddl de rubros en la lista 
            leerRubrosDesdeSqlServer().then(
                (result: any) => { 
                    $scope.cajaChica_rubros = JSON.parse(result);

                    $scope.showProgress = false;
                    $scope.$apply();
                }, 
                (err) => { 
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
            
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
        
                    $scope.showProgress = false;
                    $scope.$apply();
                }
            )
        }, 
        (err) => { 
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
        }
    )
}
])


function leerItemsDesdeSqlServer(ciaContabID) { 
    return new Promise((resolve, reject) => { 
        Meteor.call('bancos.cajaChica.catalogos.parametros.LeerDesdeSql', ciaContabID, (err, result) => {

            if (err) {
                reject(err); 
            }
    
            resolve(result); 
        })
    })
}

function leerRubrosDesdeSqlServer() { 
    return new Promise((resolve, reject) => { 
        Meteor.call('bancos.cajaChica.catalogos.rubros.LeerDesdeSql', (err, result) => {

            if (err) {
                reject(err); 
            }
    
            resolve(result); 
        })
    })
}