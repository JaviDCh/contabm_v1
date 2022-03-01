

import * as numeral from 'numeral';
import * as moment from 'moment';
import * as lodash from 'lodash';
import * as angular from 'angular';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo'; 

import { Companias } from '../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../imports/collections/companiaSeleccionada';
import { Filtros } from '../../../../imports/collections/general/filtros'; 
import { Temp_Consulta_Contab_ActivosFijos } from '../../../../imports/collections/contab/temp.contab.consulta.activosFijos'; 
import { Empleados } from '../../../../models/nomina/empleados'; 

import { ActivosFijos_SimpleSchema } from '../../../../imports/collections/contab/inventarioActivosFijos'; 

import { DialogModal } from '../../../generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '../../../imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller("Catalogos_ActivosFijos_Controller",
['$stateParams', '$state', '$scope', '$modal', 'uiGridConstants', '$interval', 
function ($stateParams, $state, $scope,  $modal, uiGridConstants, $interval) {

    $scope.showProgress = false;

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.origen = $stateParams.origen;

    // para obtener el reporte de la reposición, necesitamos el address de ContabSysNet; está en settings 
    let contabSysNet_app_address = Meteor.settings.public.contabSysNet_app_address;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.setIsEdited = function (value) {
        if (!$scope.activoFijo.docState) { 
            $scope.activoFijo.docState = 2;
        }

        return;
    }

    $scope.helpers({
        ciaContabSeleccionada: () => {
            return CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
        },
        companiaSeleccionada: () => {
            return Companias.findOne($scope.ciaContabSeleccionada &&
                                     $scope.ciaContabSeleccionada.companiaID ?
                                     $scope.ciaContabSeleccionada.companiaID :
                                     -999,
                                     { fields:
                                        {
                                            numero: true,
                                            nombre: true,
                                            nombreCorto: true
                                        } });
        },
    })

    $scope.helpers({
        empleados: () => {
            return Empleados.find({ cia:  $scope.companiaSeleccionada ? $scope.companiaSeleccionada.numero : -999 },
                                  { fields: { empleado: 1, alias: 1 },
                                    sort: { alias: 1 }});
        },
    });


    $scope.refresh0 = function () {
        if ($scope.activoFijo && $scope.activoFijo.docState && $scope.activoFijo.docState === 1) { 
            let message = `Ud. está ahora agregando un registro nuevo, no hay nada que refrescar.<br />
                           Ud. puede deshacer los cambios y, nuevamente, intentar agregar un nuevo registro, si hace un  
                           <em>click</em> en <em>Nuevo, e indica que desea perder los cambios. <br /><br />
                           También puede hacer un <em>click</em> en <em>Regresar</em>, para deshacer los cambios y regresar a la lista. 
                           `; 

            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
            message = message.replace(/\/\//gi, "");

            DialogModal($modal, "<em>Contab - Activos fijos</em>", message, false); 
            return; 
        }

        if ($scope.activoFijo && $scope.activoFijo.docState) {
            DialogModal($modal, "<em>Contab - Activos fijos</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>refrescar el registro</em> y perder los cambios?`,
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
        // si el usuario hace un click en Refresh, leemos nuevamente el item seleccionado en la lista ...
        $scope.activoFijo = {};
        // $scope.aplicarFiltro();

        if (itemSeleccionado) {
            // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
            inicializarItem(itemSeleccionado.claveUnica, $scope).then((result) => { 
                // en este momento, podemos hacer algo con el registro que se leyó de la base de datos ... 
            })
        }

        $scope.alerts = [];
    }

    // este es el tab 'activo' en angular bootstrap ui ...
    // NOTA IMPORTANTE: esta propiedad cambio a partir de 1.2.1 en angular-ui-bootstrap. Sin embargo, parece que
    // atmosphere no tiene esta nueva versión (se quedó en 0.13.0) y no pudimos instalarla desde NPM. La verdad,
    // cuando podamos actualizar angular-ui-bootstrap a una nueve vesión, la propiedad 'active' va en el tabSet
    // y se actualiza con el index de la página (0, 1, 2, ...). Así resulta mucho más intuitivo y fácil
    // establecer el tab 'activo' en ui-bootstrap ...
    $scope.activeTab = { tab1: true, tab2: false, tab3: false, };

    let activosFijos_ui_grid_api: any = null;

    let itemSeleccionado = {} as any;
    let itemSeleccionadoParaSerEliminado = false;

    let angularInterval = null;           // para detener el interval que usamos más abajo

    $scope.activosFijos_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        showGridFooter: true,
        enableFiltering: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            activosFijos_ui_grid_api = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;

                    if (itemSeleccionadoParaSerEliminado) {
                        // cuando el usuario hace un click en 'x' para eliminar el item en la lista, no lo mostramos en el tab que sigue
                        itemSeleccionadoParaSerEliminado = false;
                        return;
                    }

                    // leemos, desde sql, el registro seleccionado en la lista
                    // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
                    inicializarItem(itemSeleccionado.claveUnica, $scope).then((result) => { 
                        // aquí podemos hacer algo con el item que se ha leído desde sql server ... 
                    })
                }
                else
                    return;
            }), 

            // -----------------------------------------------------------------------------------------------------
            // cuando el ui-grid está en un bootstrap tab y tiene más columnas de las que se pueden ver,
            // al hacer horizontal scrolling los encabezados no se muestran sincronizados con las columnas;
            // lo que sigue es un 'workaround'
            // -----------------------------------------------------------------------------------------------------
            angularInterval = $interval(function() {
                activosFijos_ui_grid_api.core.handleWindowResize();
            }, 200)
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }


    // para detener el angular $Interval que usamos en el ui-gris arriba, cuando el $scope es destruido ...
    $scope.$on('$destroy', function() {
        // Make sure that the interval is destroyed too
        $interval.cancel(angularInterval);
    })

    $scope.activosFijos_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableColumnMenu: false,
            enableSorting: false,
            pinnedLeft: true,
            width: 25
        },
        {
            name: 'claveUnica',
            field: 'claveUnica',
            displayName: '##',
            width: 60,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',

            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'number'
        },
        {       
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 200,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: true,
            type: 'string'
        },
        {
            name: 'departamento',
            field: 'departamento',
            displayName: 'Departamento',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'tipoProducto',
            field: 'tipoProducto',
            displayName: 'Tipo',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'proveedor',
            field: 'proveedor',
            displayName: 'Proveedor',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'string'
        },
        {
            name: 'fechaCompra',
            field: 'fechaCompra',
            displayName: 'F compra',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {       
            name: 'serial',
            field: 'serial',
            displayName: 'Serial',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {       
            name: 'modelo',
            field: 'modelo',
            displayName: 'Modelo',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {       
            name: 'placa',
            field: 'placa',
            displayName: 'Placa',
            width: 80,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'costoTotal',
            field: 'costoTotal',
            displayName: 'Costo total',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'valorResidual',
            field: 'valorResidual',
            displayName: 'Valor residual',
            width: '120',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'montoADepreciar',
            field: 'montoADepreciar',
            displayName: 'Monto a depreciar',
            width: '100',
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilter',
            enableFiltering: true,
            enableColumnMenu: false,
            enableSorting: true,
            pinnedLeft: false,
            type: 'number'
        },
        {
            name: 'desincorporadoFlag',
            field: 'desincorporadoFlag',
            displayName: 'Desincorp?',
            width: '80',
            enableFiltering: false,
            cellFilter: 'boolFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'fechaDesincorporacion',
            field: 'fechaDesincorporacion',
            displayName: 'F desincorp',
            width: '80',
            enableFiltering: false,
            cellFilter: 'dateFilter',
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableSorting: true,
            type: 'date'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            pinnedLeft: false,
            width: 25
        },
    ]

    $scope.deleteItem = function (item) {
        // nótese como  indicamos que el usuario no quiere seleccionar el item en la lista, solo marcarlo para ser eliminado;
        // la idea es que el item se marque para ser eliminado, pero no se muestre (sus detalles) en el tab que sigue ...

        if (item.docState === 3) {
            delete $scope.activosFijos.find(x => x.claveUnica === item.claveUnica).docState; 
        }
        else { 
            $scope.activosFijos.find(x => x.claveUnica === item.claveUnica).docState = 3;
        }

        itemSeleccionadoParaSerEliminado = true;
    }

    $scope.eliminar = function () {

        if ($scope.reposicion && $scope.reposicion.docState && $scope.reposicion.docState === 1) {
            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
            let message = `La reposición de caja chica que Ud. intenta eliminar es <em>nueva</em>. No hay nada que 
                           eliminar (pues no se ha grabado aún).<br />
                           Ud. puede <em>revertir</em> la creación del registro si ejecuta cualquier otra acción e indica que desea 
                           <em>perder los cambios</em> que ha registrado hasta ahora, para el registro nuevo.`;  
            
            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ...                `
            message = message.replace(/\/\//gi, "");

            DialogModal($modal, "<em>Bancos - Caja chica - Reposiciones</em>", message, false).then();
            return;
        }

        $scope.reposicion.docState = 3;
    }

    $scope.nuevo = function () {
        if ($scope.reposicion && $scope.reposicion.docState) {
            DialogModal($modal, "<em>Contab - Activos fijos</em>",
                                `Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>agregar un nuevo registro</em> y perder los cambios?`,
                                true).then(
                function (resolve) {
                    // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
                    inicializarItem(0, $scope).then((result) => { 
                        // en este momento, podemos hacer algo con el registro que se ha recién leído en la base de datos
                    })
                },
                function (err) {
                    return;
                })
        }
        else { 
            // inicializarItem regresa un promise; cuando se ejecuta, regresa la reposición ... 
            inicializarItem(0, $scope).then((result) => { 
                // en este momento, podemos hacer algo con el registro que se ha recién leído en la base de datos
            })
        }
    }

    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    }


    // solo para eliminar los registros que el usuario 'marca' en la lista
    $scope.grabarEliminaciones = () => {

        if (!$scope.activosFijos.find((x: any) => x.docState && x.docState === 3)) {
            let message = `Aparentemente, <em>Ud. no ha marcado</em> registros en la lista para ser eliminados.<br />.<br />
                           Recuerde que mediante esta función Ud. puede eliminar los registros que se hayan <em>marcado</em> (
                           haciendo un <em>click</em> en la x roja al final de cada registro) para ello en la lista.`; 

            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
            message = message.replace(/\/\//gi, "");

            DialogModal($modal, "<em>Contab - Activos fijos - Eliminar desde la lista</em>", message, false).then();
            return;
        }

        grabarEliminaciones2();
    }

    let grabarEliminaciones2 = function() {

        $scope.showProgress = true;
        let registrosAEliminar = $scope.activosFijos.filter((x) => x.docState && x.docState === 3);

        Meteor.call('contab.activosFijos.eliminar', registrosAEliminar, (err, resolve) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
                $scope.showProgress = false;
                $scope.$apply()

                return;
            }

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: resolve
            });

            Meteor.call('getCollectionCount', 'Temp_Consulta_Contab_ActivosFijos', (err, result) => {

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
    
                // el método regresa la cantidad de items en el collection (siempre para el usuario)
                recordCount = result;
                $scope.leerRegistrosDesdeServer(limit, false);      // false para que no muestre su propio mensaje y se mantenga el de arriba   
            })  
        })
    }

    $scope.aplicarFiltro = function () {
        $scope.showProgress = true;

        Meteor.call('contab.activosFijos.LeerDesdeSql', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

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

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() })) { 
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            }
            else { 
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'contab.activosFijos',
                    filtro: $scope.filtro
                });
            }
            // ------------------------------------------------------------------------------------------------------
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            leerPrimerosRegistrosDesdeServidor(50);

            // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
            $scope.activeTab = { tab1: false, tab2: true, tab3: false, };
        })
    }

    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'contab.activosFijos', userId: Meteor.userId() });

    if (filtroAnterior) { 
        $scope.filtro = lodash.clone(filtroAnterior.filtro);
    }
    // ------------------------------------------------------------------------------------------------------

    $scope.activosFijos_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_Consulta_Contab_ActivosFijos', (err, result) => {

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

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit);
        })
    }


    let subscriptionHandle = {} as any;
    $scope.leerRegistrosDesdeServer = function (limit, mostrarPropioMensaje = true) {
        // la idea es 'paginar' los registros que se suscriben, de 50 en 50
        // el usuario puede indicar 'mas', para leer 50 más; o todos, para leer todos los registros ...
        $scope.showProgress = true;

        // lamentablemente, tenemos que hacer un stop al subscription cada vez que hacemos una nueva,
        // pues el handle para cada una es diferente; si no vamos deteniendo cada una, las anteriores
        // permanecen pues solo detenemos la última al destruir el stop (cuando el usaurio sale de
        // la página). Los documents de subscriptions anteriores permanecen en minimongo y el reactivity
        // de los subscriptions también ...
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }

        subscriptionHandle =
        Meteor.subscribe('temp.contab.consulta.activosFijos.list', limit, () => {

            let meteorUserId = Meteor.userId();

            $scope.helpers({
                activosFijos: () => {
                    return Temp_Consulta_Contab_ActivosFijos.find({ user: meteorUserId }, { sort: { claveUnica: 1 }});
                }
            })

            $scope.activosFijos_ui_grid.data = $scope.activosFijos;

            if (mostrarPropioMensaje) { 

                // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
                let message = `${numeral($scope.activosFijos.length).format('0,0')} registros
                               (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`; 
                message = message.replace(/\/\//gi, "");

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: message, 
                });
            }
            
            $scope.showProgress = false;
            $scope.$apply();
        })
    }

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    }



    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        if (!$scope.activoFijo.docState) {
            DialogModal($modal, "<em>Contab - Inventario de activos fijos</em>",
                                `Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.`,
                                false).then();
            return;
        }

        grabar2();
    }


    function grabar2() {
        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItem = lodash.cloneDeep($scope.activoFijo);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

        if (editedItem.docState != 3) {
            isValid = ActivosFijos_SimpleSchema.namedContext().validate(editedItem);

            if (!isValid) {
                ActivosFijos_SimpleSchema.namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + ActivosFijos_SimpleSchema.label(error.name) + "'; error de tipo '" + error.type + "'." as never);
                });
            }
        }

        if (errores && errores.length) {
            $scope.alerts.length = 0;

            let message = "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                            errores.reduce(function (previous, current) {

                                if (previous == "")
                                    // first value
                                    return current;
                                else
                                    return previous + "<br />" + current;
                            }, ""); 

            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
            message = message.replace(/\/\//gi, "");

            $scope.alerts.push({
                type: 'danger',
                msg: message, 
            });

            $scope.showProgress = false;
            return;
        }

        Meteor.call('contab.activosFijos.save', editedItem, (err, result) => {

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
            } else {
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: result.message
                });

                // el meteor method regresa siempre el _id del item; cuando el usuario elimina, regresa "-999"
                let claveUnicaRegistro = result.id;

                // nótese que siempre, al registrar cambios, leemos el registro desde sql server; la idea es
                // mostrar los datos tal como fueron grabados y refrescarlos para el usuario. Cuando el
                // usuario elimina el registro, su id debe regresar en -999 e InicializarItem no debe
                // encontrar nada ...
                // inicializarItem regresa un promise; cuando se ejecuta, regresa el registro ... 
                inicializarItem(claveUnicaRegistro, $scope).then((result) => { 
                    // aquí podemos aplicar algunas modificaciones al registro 
                })  
            }
        })
    }


    $scope.calcularDepreciacion = function() { 
        let result: any = calcularDepreciacion($scope.activoFijo); 

        if (result.error) { 

            // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
            let message = result.message; 
            message = message.replace(/\/\//gi, "");

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: message
            });
        } else { 
            $scope.activoFijo.depreciarDesdeMes = result.activoFijo.depreciarDesdeMes; 
            $scope.activoFijo.depreciarDesdeAno = result.activoFijo.depreciarDesdeAno; 
            $scope.activoFijo.depreciarHastaMes = result.activoFijo.depreciarHastaMes; 
            $scope.activoFijo.depreciarHastaAno = result.activoFijo.depreciarHastaAno; 
            $scope.activoFijo.cantidadMesesADepreciar = result.activoFijo.cantidadMesesADepreciar; 
            $scope.activoFijo.montoDepreciacionMensual = result.activoFijo.montoDepreciacionMensual; 

            if (!$scope.activoFijo.docState) { 
                $scope.activoFijo.docState = 2;
            }
        }
    }


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'contab', process: 'leerContabActivosFijosDesdeSqlServer' });
    EventDDP.addListener('contab_activosFijos_reportProgressDesdeSqlServer', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't excecute this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    })
    // ------------------------------------------------------------------------------------------------------

    $scope.showProgress = true;
    Meteor.call('contab.activosFijos.leerTablasCatalogosDesdeSqlServer', $scope.companiaSeleccionada.numero, (err, result) => {

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

        let catalogos = JSON.parse(result);

        $scope.departamentos = catalogos.departamentos;
        $scope.tiposProducto = catalogos.tiposProducto; 
        $scope.proveedores = catalogos.proveedores; 

        $scope.showProgress = false;
        $scope.$apply();
    })

    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...
    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        }
    })
}
])


function inicializarItem(itemID, $scope) {

    return new Promise(function(resolve:any, reject:any) { 
        if (itemID == 0) {
            $scope.showProgress = true;
            $scope.reposicion = {};
            let usuario: any =  Meteor.user();
    
            $scope.activoFijo = {
                claveUnica: 0,
                fechaCompra: new Date(),

                ingreso: new Date(), 
                ultAct: new Date(), 
                usuario: usuario.emails[0].address,
                cia: $scope.companiaSeleccionada.numero, 

                docState: 1
            };

            $scope.alerts.length = 0;               // pueden haber algún 'alert' en la página ...
            $scope.reportLink = "#";                // para invalidar el link que permite imprimir, hasta que el usuario grabe ... 
            $scope.activeTab = { tab1: false, tab2: false, tab3: true, };
            $scope.showProgress = false;
            
            resolve($scope.activoFijo); 
        }
        else {
            $scope.showProgress = true;
    
            // nótese que ejecutamos un promise que lee el item en la base de datos (server) y lo regresa 
            item_leerByID_desdeSql(itemID, $scope).then( 
    
                function (result:any) { 
                    $scope.activoFijo = {};
                    $scope.activoFijo = JSON.parse(result);
    
                    if (!$scope.activoFijo || ($scope.activoFijo && lodash.isEmpty($scope.activoFijo))) {
                        // el usuario eliminó el registro y, por eso, no pudo se leído desde sql
                        $scope.activoFijo = {};
                        $scope.showProgress = false;
                        $scope.$apply();
    
                        return;
                    }
    
                    // las fechas vienen serializadas como strings; convertimos nuevamente a dates ...
                    $scope.activoFijo.fechaCompra = $scope.activoFijo.fechaCompra ? moment($scope.activoFijo.fechaCompra).toDate() : null;
                    $scope.activoFijo.fechaDesincorporacion = $scope.activoFijo.fechaDesincorporacion ? moment($scope.activoFijo.fechaDesincorporacion).toDate() : null;
                    $scope.activoFijo.ingreso = $scope.activoFijo.ingreso ? moment($scope.activoFijo.ingreso).toDate() : null;
                    $scope.activoFijo.ultAct = $scope.activoFijo.ultAct ? moment($scope.activoFijo.ultAct).toDate() : null;

                    // nótese como establecemos el tab 'activo' en ui-bootstrap; ver nota arriba acerca de ésto ...
                    $scope.activeTab = { tab1: false, tab2: false, tab3: true, };
    
                    $scope.showProgress = false;
                    $scope.$apply();

                    resolve($scope.activoFijo); 
    
                }).catch(function(err) { 
    
                    let errorMessage = mensajeErrorDesdeMethod_preparar(err);
    
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: errorMessage
                    });
    
                    $scope.showProgress = false;
    
                    $scope.$apply();
                    reject(err); 
                })
        }
    })
}


function item_leerByID_desdeSql(pk, $scope) {
    return new Promise(function(resolve, reject) { 
        // ejecutamos un método para leer el asiento contable en sql server y grabarlo a mongo (para el current user)
        Meteor.call('contab.activosFijos.leerByID.desdeSql', pk, (err, result) => {

            if (err) {
                reject(err); 
            } else { 
                resolve(result); 
            }
        })
    })
}


function calcularDepreciacion(activoFijo) { 

    if (!activoFijo.fechaCompra || !activoFijo.montoADepreciar || !activoFijo.numeroDeAnos) { 
        return { 
            error: true, 
            message: `Antes de intentar determinar la depreciación del activo, debe haber valores indicados para los siguientes campos: 
                      fecha de compra, monto a depreciar y cantidad de años.<br /><br /> 
                      Por favor indique valores para estos campos y luego regrese a ejecutar esta función. 
                     `
        }
    }

    let depreciarDesde_mes: number; 
    let depreciarDesde_ano: number; 

    if (!activoFijo.depreciarDesdeMes) { 
        depreciarDesde_mes = activoFijo.fechaCompra.getMonth() + 1; 
    } else { 
        depreciarDesde_mes = activoFijo.depreciarDesdeMes;
    }

    if (!activoFijo.depreciarDesdeAno) { 
        depreciarDesde_ano = activoFijo.fechaCompra.getFullYear();
    } else { 
        depreciarDesde_ano = activoFijo.depreciarDesdeAno;
    }

    let fechaDepreciar_desde = new Date(depreciarDesde_ano, depreciarDesde_mes -1, 1); 
    let fechaDepreciar_hasta = moment(fechaDepreciar_desde).add((activoFijo.numeroDeAnos * 12) -1, 'months').toDate();

    let depreciarHasta_mes = fechaDepreciar_hasta.getMonth() + 1;
    let depreciarHasta_ano = fechaDepreciar_hasta.getFullYear();

    // determinamos la cantidad de meses entre ambas fechas 
    let hasta = moment(fechaDepreciar_hasta);
    let desde = moment(fechaDepreciar_desde);

    let cantidadMeses = hasta.diff(desde, 'months') + 1;

    let montoDepreciacionMensual = 0; 

    if (cantidadMeses) {
        montoDepreciacionMensual = activoFijo.montoADepreciar / cantidadMeses;
        montoDepreciacionMensual = lodash.round(montoDepreciacionMensual, 4);
    }

    activoFijo.depreciarDesdeMes = depreciarDesde_mes; 
    activoFijo.depreciarDesdeAno = depreciarDesde_ano; 
    activoFijo.depreciarHastaMes = depreciarHasta_mes; 
    activoFijo.depreciarHastaAno = depreciarHasta_ano; 
    activoFijo.cantidadMesesADepreciar = cantidadMeses; 
    activoFijo.montoDepreciacionMensual = montoDepreciacionMensual; 

    return { 
        error: false, 
        activoFijo: activoFijo, 
    }
}