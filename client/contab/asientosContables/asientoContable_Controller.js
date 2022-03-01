
import lodash from 'lodash';
import numeral from 'numeral'; 
import saveAs from 'save-as'
import { Monedas } from '/imports/collections/monedas';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { TiposAsientoContable } from '/imports/collections/contab/tiposAsientoContable'; 
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2';  
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 
import { AsientosContables } from '/imports/collections/contab/asientosContables'; 

import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 
import { join } from 'path';

import { cuadrarAsientoContable, revisarSumasIguales } from './funciones/generales'; 

angular.module("contabm").controller("Contab_AsientoContable_Controller",

// ['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants', 'catalogosContab',
// function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants, catalogosContab) {

['$scope', '$stateParams', '$state', '$meteor', '$modal', 'uiGridConstants', 
function ($scope, $stateParams, $state, $meteor, $modal, uiGridConstants) {

    // 'catalogosContab' es un 'resolve' en el state que se ejecuta con un promise; el promise
    // se resuelve solo cuando los catálogos están cargados en el client. Esto resulta muy importante,
    // sobre todo desde que empezamos a abrir esta página desde otras, *en un Tab diferente*; en
    // estos casos, el state se abria, pero los catálogos no se habían cargado aún ...
    $scope.showProgress = false;
    $scope.$parent.alerts.length = 0;

    let companiaSeleccionada = {};
    let companiaContabSeleccionada = {};

    // sin las compañías existen en el client, las leemos; de otra forma, cuando el evento que sigue se ejecute ... 
    companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

    if (companiaSeleccionada) { 
        companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID);
        $scope.companiaSeleccionada = companiaContabSeleccionada;
    }

    $scope.$on('actualizarCatalogos', function (event, args) {
        // leemos la compañía Contab seleccioinada solo cuando el parent controller indica que los 
        // catálogos están en el client ... 
        companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

        if (companiaSeleccionada) { 
            companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID);
            $scope.companiaSeleccionada = companiaContabSeleccionada;
        }
    })


    $scope.origen = $stateParams.origen;
    $scope.id = $stateParams.id;
    $scope.pageNumber = parseInt($stateParams.pageNumber);
    // convertirmos desde 'true' a true
    $scope.vieneDeAfuera = String($stateParams.vieneDeAfuera).toLowerCase() === 'true';


    $scope.setIsEdited = function (field) {

        // cuando el usuario cambia la moneda, cambiamos la moneda original del asiento ...
        if (field && field === 'moneda') {
            if ($scope.asientoContable && $scope.asientoContable.moneda) {
                $scope.asientoContable.monedaOriginal = $scope.asientoContable.moneda;
            }
        }

        if ($scope.asientoContable.docState)
            return;

        $scope.asientoContable.docState = 2;
    }

    $scope.windowClose = () => {
        window.close();
    }

    $scope.fechaChanged = function() {

        if (!$scope.asientoContable.fecha) {
            $scope.setIsEdited();
            return;
        };

        $scope.showProgress = true;

        // cuando el usuario cambia la fecha, intentamos leer e inicializar el factor de cambio ...
        Meteor.call('contab.asientos.leerFactorCambioMasReciente', $scope.asientoContable.fecha, (err, result) => {

            if (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.setIsEdited();
                $scope.showProgress = false;
                $scope.$apply();
                return;
            };

            $scope.asientoContable.factorDeCambio = result.factorCambio;
            $scope.setIsEdited();

            $scope.showProgress = false;
            $scope.$apply();
        });
    }

    $scope.regresarALista = function () {

        if ($scope.asientoContable && $scope.asientoContable.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Asientos contables</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>regresar</em> y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
                    $state.go('contab.asientosContables.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
                },
                function (err) {
                    return true;
                });

            return;
        }
        else
            $state.go('contab.asientosContables.lista', { origen: $scope.origen, pageNumber: $scope.pageNumber });
    }

    $scope.eliminar = function () {

        if ($scope.asientoContable && $scope.asientoContable.docState && $scope.asientoContable.docState == 1) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "El registro es nuevo (no existe en la base de datos); para eliminar, simplemente haga un <em>Refresh</em> o <em>Regrese</em> a la lista.",
                                false).then();

            return;
        };

        // simplemente, ponemos el docState en 3 para que se elimine al Grabar ...
        $scope.asientoContable.docState = 3;
    }

    $scope.refresh0 = function () {

        if ($scope.asientoContable.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                    "<em>Asientos contables</em>",
                                    "Aparentemente, Ud. ha efectuado cambios; aún así, desea <em>refrescar el registro</em> y perder los cambios?",
                                    true);

            promise.then(
                function (resolve) {
                    $scope.refresh();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else
            $scope.refresh();
    }

    $scope.refresh = () => {

        // hacemos un nuevo subscribe para volver a leer el asiento contable; solo desde mongo; desde la lista,
        // se leyó el asiento contable desde sql server y se grabó a mongo; al refrescar, lo volvemos a leer, tal
        // como fue grabado en mongo ...
        $scope.showProgress = true;

        Meteor.subscribe('asientosContables', JSON.stringify({ _id: $scope.id }), () => {

            $scope.asientoContable = {};
            $scope.partidas_ui_grid.data = [];

            $scope.helpers({
                asientoContable: () => {
                    return AsientosContables.findOne({ _id: $scope.id });
                }
            })

            // guardamos, en una propiedad separada, la fecha del asiento; esto nos permitirá validar 2 cosas, aún
            // si el usuario cambia la fecha del asiento:
            // 1.- que no se cambie a un mes diferente (esto podría permitirse, pero tomando en cuenta varios criterios)
            // 2.- que el asiento no corresponda a un mes cerrado (y su fecha sea cambiada a uno que no lo es)
            fechaOriginalAsientoContable = $scope.asientoContable && $scope.asientoContable.fecha ? $scope.asientoContable.fecha : null;

            $scope.partidas_ui_grid.data = [];
            if ($scope.asientoContable && Array.isArray($scope.asientoContable.partidas)) { 
                $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
            }

            let result = {}; 

            if ($scope.asientoContable && Array.isArray($scope.asientoContable.partidas)) { 
                result = revisarSumasIguales($scope.asientoContable.partidas);
            }
               
            $scope.alerts.length = 0; 
            if (result.error) {
                // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, 
                // como new line ... 
                let message = result.message.replace(/\/\//gi, "");
                $scope.alerts.push({ type: 'warning', msg: message });
            }

            $scope.showProgress = false;
            $scope.$apply();
        })
    }


    $scope.imprimir = () => {

        $modal.open({
            templateUrl: 'client/contab/asientosContables/imprimirAsientosContables_Opciones_Modal.html',
            controller: 'ImprimirAsientosContables_Opciones_Modal_Controller',
            size: 'md',
            resolve: {
                companiaSeleccionadaDoc: () => {
                    return companiaContabSeleccionada;
                }
            }
        }).result.then(
            function (resolve) {
                // ejecutamos el código una vez que el usuario indica algunas opciones y regresa ...
                let parametrosReporte = resolve;
                AsientosContables_Methods.imprimirAsientoContable($scope, $scope.asientoContable, parametrosReporte);
                return true;
            },
            function (cancel) {
                return true;
            });
    }

    $scope.exportarAsientoContable = () => {

        let message = ""; 

        // permitimos grabar el asiento contable, como un json, a un archivo en la máquina. Luego, este archivo podrá
        // ser importado como un asiento nuevo ...
        try {
            let asientoContable = lodash.cloneDeep($scope.asientoContable);

            var blob = new Blob([JSON.stringify(asientoContable)], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "asiento contable");
        }
        catch(err) {
            message = err.message ? err.message : err.toString();
        }
        finally {
            if (message) {
                DialogModal($modal, "<em>Asientos contables - Exportar asientos contables</em>",
                                    "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                    message,
                                    false).then();
            };
        };
    }

    $scope.importarAsientoContable = () => {
        // permitimos al usuario leer, en un nuevo asiento contable, alguno que se haya exportado a un text file ...
        let inputFile = angular.element("#fileInput");
        if (inputFile) { 
            inputFile.click();        // simulamos un click al input (file)
        }
    }

    $scope.uploadFile = function(files) {

        if (!$scope.asientoContable || !$scope.asientoContable.docState || $scope.asientoContable.docState != 1) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                `Aparentemente, el asiento que <em>recibirá la copia</em> no es nuevo (ya existía).<br /> 
                                 Ud. debe importar un asiento siempre en un asiento <b>nuevo</b>; es decir, no en uno que ya exista.
                                `,
                                false).then();

            let inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }
                
            return;
        }

        let userSelectedFile = files[0];

        if (!userSelectedFile) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, Ud. no ha seleccionado un archivo.<br />" +
                                "Por favor seleccione un archivo que corresponda a un asiento contable <em>exportado</em> antes.",
                                false).then();

            let inputFile = angular.element("#fileInput");
            if (inputFile && inputFile[0] && inputFile[0].value) { 
                // para que el input type file "limpie" el file indicado por el usuario
                inputFile[0].value = null;
            }
                
            return;
        }

        var reader = new FileReader();
        let message = "";

        reader.onload = function(e) {
            try {
                var content = e.target.result;
                let asientoContable = JSON.parse(content);

                if (asientoContable.tipo) { 
                    $scope.asientoContable.tipo = asientoContable.tipo;
                }
                
                $scope.asientoContable.descripcion = "";

                if (asientoContable.descripcion) { 
                    $scope.asientoContable.descripcion = asientoContable.descripcion > 250 ?
                                                     asientoContable.descripcion.substr(0, 250) :
                                                     asientoContable.descripcion; 
                }
                
                $scope.asientoContable.moneda = asientoContable.moneda ? asientoContable.moneda : 0;
                $scope.asientoContable.monedaOriginal = asientoContable.monedaOriginal ? asientoContable.monedaOriginal : 0;
                $scope.asientoContable.factorDeCambio = asientoContable.factorDeCambio ? asientoContable.factorDeCambio : 0;

                // si no viene la moneda, puede venir su simbolo (scrwebm)
                if (!$scope.asientoContable.moneda && asientoContable.monedaSimbolo) {
                    let moneda = Monedas.findOne({ simbolo: asientoContable.monedaSimbolo });
                    if (moneda) {
                        $scope.asientoContable.moneda = moneda.moneda;
                    }
                }

                if (!$scope.asientoContable.monedaOriginal && asientoContable.monedaOriginalSimbolo) {
                    let monedaOriginal = Monedas.findOne({ simbolo: asientoContable.monedaOriginalSimbolo });
                    if (monedaOriginal) {
                        $scope.asientoContable.monedaOriginal = monedaOriginal.moneda;
                    }
                }

                if (lodash.isArray(asientoContable.partidas)) {

                    if (!lodash.isArray($scope.asientoContable.partidas)) { 
                        $scope.asientoContable.partidas = [];
                    }

                    // si existe una partida tipo 0 (docState == 0), la eliminamos y la agregamos al final. Este row está listo
                    // para que el usuario agregue una partida sin siquiera hacer un click en Nuevo. La idea es que, cada vez que 
                    // el usuario usa un row del tipo 0, se agrega uno en forma automática. Al Grabar, este row (no usado) es ignorado ... 
                    lodash.remove($scope.asientoContable.partidas, (x) => { return x.docState === 0; }); 
                        
                    asientoContable.partidas.forEach((p) => {

                        // permitimos que el usuario haya agregado partidas (al asiento nuevo ....)
                        let ultimaPartida = lodash.last( lodash.sortBy($scope.asientoContable.partidas, (x) => { return x.partida; }) );

                        let partida = {
                            _id: new Mongo.ObjectID()._str,
                            partida: 10,
                            debe: 0,
                            haber: 0,
                            docState: 1
                        };

                        if (ultimaPartida && !lodash.isEmpty(ultimaPartida)) {
                            partida.partida = ultimaPartida.partida + 10;
                        }

                        // TODO: modificar para que, si el valor cuentaContableID no viene con la partida, y si viene
                        // cuentaContable, buscar el id de la cuenta en el catálogo de cuenta y resolver.

                        // la idea es resolver: el asiento que viene desde scrwebm no trae una cuentaContableID (ej: 2500) sino,
                        // más bien, la cuenta contable (ej: cuentaContable: '1 001 001 01')
                        partida.cuentaContableID = p.cuentaContableID ? p.cuentaContableID : null;

                        // la descripción en la partida no debe ser mayor a 75 chars 
                        partida.descripcion = "";

                        if (p.descripcion) { 
                            partida.descripcion = p.descripcion > 75 ?
                                                  p.descripcion.substr(0, 75) :
                                                  p.descripcion; 
                        }

                        // la referencia en la partida no debe ser mayor a 20 chars ... 
                        partida.referencia = "";

                        if (p.referencia) { 
                            partida.referencia = p.referencia > 20 ?
                                                  p.referencia.substr(0, 20) :
                                                  p.referencia; 
                        }

                        partida.debe = p.debe ? p.debe : 0;
                        partida.haber = p.haber ? p.haber : 0;
                        partida.centroCosto = p.centroCosto ? p.centroCosto : null;
                        partida.docState = 1;

                        // puede venir el código de la cuenta (scrwebm)
                        if (!partida.cuentaContableID && p.cuentaContable) {
                            let codigoCuenta = p.cuentaContable.trim();
                            codigoCuenta = codigoCuenta.replace(/ /g, '');
                            let cuentaContable = CuentasContables2.findOne({ cuenta: codigoCuenta });

                            if (cuentaContable) {
                                partida.cuentaContableID = cuentaContable.id;
                            }
                        }

                        $scope.asientoContable.partidas.push(partida);
                    })

                    // cuando ya hemos agregado todas las partidas que vienen en el archivo, agregamos una partida tipo 0, para que esté 
                    // disponible al usuario para agregar una nueva, sin siquiera hacer un click en Nuevo ... 
                    $scope.agregarPartida(); 
                }
            }
            catch(err) {
                message = err.message ? err.message : err.toString();
            }
            finally {
                if (message) { 
                    DialogModal($modal, "<em>Asientos contables - Importar asientos contables</em>",
                                        "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                        message,
                                        false).then();
                }
                else {
                    $scope.partidas_ui_grid.data = [];
                    if (lodash.isArray($scope.asientoContable.partidas))
                        $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
                }

                let inputFile = angular.element("#fileInput");
                if (inputFile && inputFile[0] && inputFile[0].value) { 
                    // para que el input type file "limpie" el file indicado por el usuario
                    inputFile[0].value = null;
                }

                DialogModal($modal, "<em>Asientos contables - Importar asiento</em>",
                            `Ok, el asiento contable ha sido importado en un asiento nuevo. 
                             Ud. puede hacer modificaciones y <em>Grabar</em>.<br /> 
                             La fecha del asiento, sin embargo, no ha sido inicializada. 
                             Ud. debe indicar una y <em>salir del campo</em>, 
                             para que el programa lea y asigne el <em>factor de cambio</em> más reciente.`,
                            false).then();
                    
                $scope.$apply();
            }
        }

        reader.readAsText(userSelectedFile);
    }

    $scope.cuadrarAsientoContable = () => {
        // recorremos las partidas del asiento y 'cuadramos' en la partida que el usuario ha seleccionado ...
        if (!partidaSeleccionada || lodash.isEmpty(partidaSeleccionada)) {
            DialogModal($modal, "<em>Asientos contables - Cuadrar asiento contable</em>",
                `Ud. debe seleccionar la partida que <b>será ajustada</b>, para <em>cuadrar</em> el asiento contable.`,
                false).then();
            return;
        }

        if (!$scope.asientoContable || !$scope.asientoContable.partidas || !Array.isArray($scope.asientoContable.partidas) || !$scope.asientoContable.partidas.length) {
            DialogModal($modal, "<em>Asientos contables - Cuadrar asiento contable</em>",
                `Error inesperado: aparentemente, el asiento contable no tiene partidas registradas. Por favor revise.`,
                false).then();
            return;
        }

        let result = cuadrarAsientoContable($scope.asientoContable.partidas, partidaSeleccionada); 

        if (!$scope.asientoContable.docState) { 
            $scope.asientoContable.docState = 2;
        }

        if (result.error) { 
            $scope.alerts.push({
                type: 'danger',
                msg: result.message
            })

            return; 
        }

        $scope.alerts.length = 0; 
        $scope.alerts.push({
            type: 'info',
            msg: result.message
        })
    }


    $scope.renumerarPartidas = () => {

        if (!lodash.isArray($scope.asientoContable.partidas)) { 
            return;
        }

        $scope.partidas_ui_grid.data = [];
        let partida = 10;

        lodash($scope.asientoContable.partidas).orderBy([ 'partida' ], [ 'asc' ]).forEach((p) => {
            p.partida = partida;
            partida = partida + 10;
        })

        if (!$scope.asientoContable.docState) { 
            $scope.asientoContable.docState = 2;
        }
            
        if (lodash.isArray($scope.asientoContable.partidas)) { 
            $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
        }
    }

    $scope.nuevo0 = function () {

        if ($scope.asientoContable.docState && $scope.origen == 'edicion') {
            var promise = DialogModal($modal,
                                        "<em>Asientos contables</em>",
                                        "Aparentemente, <em>se han efectuado cambios</em> en el registro. Si Ud. continúa para agregar un nuevo registro, " +
                                        "los cambios se perderán.<br /><br />Desea continuar y perder los cambios efectuados al registro actual?",
                                        true);

            promise.then(
                function (resolve) {
                    $scope.nuevo();
                },
                function (err) {
                    return true;
                });

            return;
        }
        else { 
            $scope.nuevo();
        }
    }

    $scope.nuevo = function () {
        $scope.asientoContable = {};
        $scope.id = "0";                        // para que inicializar() agregue un nuevo registro
        inicializarItem();
    }

    let partidas_ui_grid_api = null;
    let partidaSeleccionada = {};

    $scope.partidas_ui_grid = {

        enableSorting: true,
        showColumnFooter: true,
        enableCellEdit: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            partidas_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                partidaSeleccionada = {};

                if (row.isSelected) {
                    partidaSeleccionada = row.entity;
                }
                else
                    return;
            });

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {

                    // solo cuando el usuario indica la cuenta contable, intentamos inicializar el row en base al anteior ...
                    if (colDef.field == 'cuentaContableID') {
                        let index = $scope.asientoContable.partidas.indexOf(rowEntity, 0);

                        if (index != -1 && index > 0) {

                            let rowAnterior = $scope.asientoContable.partidas[index - 1];
                            if (rowAnterior) {

                                if (rowAnterior.descripcion && !rowEntity.descripcion) { 
                                    rowEntity.descripcion = rowAnterior.descripcion;
                                }
                                    
                                if (rowAnterior.referencia && !rowEntity.referencia) { 
                                    rowEntity.referencia = rowAnterior.referencia;
                                }
                                    
                                if (!rowEntity.debe && !rowEntity.haber) {
                                    // intentamos cuadrar el asiento en la partida actual ...
                                    let totalDebe = lodash.sumBy($scope.asientoContable.partidas, (x) => { return x.debe ? x.debe : 0; });
                                    let totalHaber = lodash.sumBy($scope.asientoContable.partidas, (x) => { return x.haber ? x.haber : 0; });

                                    if (totalDebe > totalHaber) {
                                        rowEntity.haber = lodash.round(totalDebe - totalHaber, 2);
                                    }
                                    else {
                                        rowEntity.debe = lodash.round(totalHaber - totalDebe, 2);
                                    }
                                }
                            }
                        }
                    }

                    // cuando el usuario indica un monto, ponemos cero en el otro; si indica un monto en el
                    // debe, ponemos cero en haber y viceversa ...

                    if (colDef.field == 'debe') { rowEntity.haber = 0; }
                    if (colDef.field == 'haber') { rowEntity.debe = 0; }

                    if (!rowEntity.docState && rowEntity.docState != 0) { 
                        rowEntity.docState = 2;
                    } else if (rowEntity.docState === 0) { 
                        // el registro es nuevo; pasamos a nuevo-editado cuando el usaurio edita; agregamos uno nuevo al instante, 
                        // para que siempre haya uno nuevo en la lista. La idea es que el usuario no tenga que hacer click en Nuevo en el toolbar  
                        rowEntity.docState = 1; 
                        $scope.agregarPartida(); 
                    }
                        
                    if (!$scope.asientoContable.docState) { 
                        $scope.asientoContable.docState = 2;
                    }
                }
            })
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },
        getRowIdentity: function (row) {
            return row._id;
        }
    }

    let cuentasContablesLista = Array.isArray($scope.$parent.cuentasContablesLista) ? $scope.$parent.cuentasContablesLista : [];
    $scope.centrosCosto = $scope.$parent.centrosCosto; 
    $scope.centrosCostoActivos = $scope.$parent.centrosCosto.filter(x => !x.suspendido); 

    $scope.partidas_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 0" class="fa fa-circle-thin" style="color: gray; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: blue; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: brown; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: red; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },
        {
            name: 'partida',
            field: 'partida',
            displayName: '#',
            width: 35,
            enableFiltering: true,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'cuentaContableID',
            field: 'cuentaContableID',
            displayName: 'Cuenta contable',
            width: "*",
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'cuentasContables_cuentaDescripcionCia',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'cuentaDescripcionCia',
            editDropdownOptionsArray: cuentasContablesLista,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
        },
        {
            name: 'descripcion',
            field: 'descripcion',
            displayName: 'Descripción',
            width: 180,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'referencia',
            field: 'referencia',
            displayName: 'Referencia',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'debe',
            field: 'debe',
            displayName: 'Debe',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'haber',
            field: 'haber',
            displayName: 'Haber',
            width: 100,
            enableFiltering: true,
            headerCellClass: 'ui-grid-rightCell',
            cellClass: 'ui-grid-rightCell',
            cellFilter: 'currencyFilterNorCeroNorNull',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,

            aggregationType: uiGridConstants.aggregationTypes.sum,
            aggregationHideLabel: true,
            footerCellFilter: 'currencyFilter',
            footerCellClass: 'ui-grid-rightCell',

            type: 'number'
        },
        {
            name: 'centroCosto',
            field: 'centroCosto',
            displayName: 'Centro de costo',
            width: "100",
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            
            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'centroCosto',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.centrosCostoActivos,
            cellFilter: 'mapDropdown:row.grid.appScope.centrosCosto:"centroCosto":"descripcion"',

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'number'
    },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ]


    $scope.$on('actualizarCatalogos', function (event, args) {
        $scope.centrosCosto = $scope.$parent.centrosCosto;
        $scope.partidas_ui_grid.columnDefs[7].editDropdownOptionsArray = $scope.centrosCosto;

        cuentasContablesLista = Array.isArray($scope.$parent.cuentasContablesLista) ? $scope.$parent.cuentasContablesLista : [];
        $scope.partidas_ui_grid.columnDefs[2].editDropdownOptionsArray = cuentasContablesLista;
    })

    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1)
            // si el item es nuevo, simplemente lo eliminamos del array
            lodash.remove($scope.asientoContable.partidas, (x) => { return x._id === item._id; });
        else
            item.docState = 3;

        if (!$scope.asientoContable.docState) { 
            $scope.asientoContable.docState = 2;
        }
    }

    $scope.agregarPartida = function () {

        if (!lodash.isArray($scope.asientoContable.partidas)) { 
            $scope.asientoContable.partidas = [];
        }
            
        // obtenemos la última partida, para definir la nueva en base a esa ...
        let ultimaPartida = lodash.last( lodash.sortBy($scope.asientoContable.partidas, (x) => { return x.partida; }) );

        let partida = {
            _id: new Mongo.ObjectID()._str,
            partida: 10,
            debe: 0,
            haber: 0,
            docState: 0             // partida nueva que el usuario no ha editado ... 
        };

        if (ultimaPartida && !lodash.isEmpty(ultimaPartida)) {
            partida.partida = ultimaPartida.partida + 10;
        }

        $scope.asientoContable.partidas.push(partida);

        $scope.partidas_ui_grid.data = [];
        if (lodash.isArray($scope.asientoContable.partidas)) { 
            $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
        }
            
        if (!$scope.asientoContable.docState) { 
            $scope.asientoContable.docState = 2;
        }    
    }


    // -------------------------------------------------------------------------
    // Grabar las modificaciones hechas al registro
    // -------------------------------------------------------------------------
    $scope.grabar = function () {

        if (!$scope.asientoContable.docState) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, <em>no se han efectuado cambios</em> en el registro. No hay nada que grabar.",
                                false).then();
            return;
        }

        // ninguna de las partidas debe tener un monto con más de 2 decimales
        if ($scope.asientoContable && $scope.asientoContable.partidas) {
            if (montoConMasDeDosDecimales($scope.asientoContable.partidas)) {
                
            let message = `Aparentemente, al menos una de las partidas en el asiento contable,
                        tiene un monto con <b>más de dos decimales</b>.<br /><br />
                        Para corregir esta situación, Ud. debe seleccionar alguna partida en la lista y
                        hacer un <em>click</em> en la función <em>cuadrar asiento</em>.<br />
                        Esto redondeara los montos en las partidas a un máximo de <b>dos decimales</b>.<br /><br />
                        Luego puede regresar e intentar <em>Grabar</em> el asiento contable.`; 

            $scope.alerts.length = 0;
            $scope.alerts.push({ type: 'danger', msg: message }); 

            return;
            }
        }

        $scope.showProgress = true;

        // obtenemos un clone de los datos a guardar ...
        let editedItem = lodash.cloneDeep($scope.asientoContable);

        // nótese como validamos cada item antes de intentar guardar en el servidor
        let isValid = false;
        let errores = [];

        // para que el usuario tenga una mejor experiencia al registrar el asiento, agregamos siempre una nueva partida a la lista. Por ésto, 
        // siempre va a haber una partida de más en el array. La eliminamos pues no pasaría la validación ... 
        if (editedItem && editedItem.partidas && Array.isArray(editedItem.partidas) && editedItem.partidas.length) { 
            lodash.remove(editedItem.partidas, (p) => { return p.docState === 0; }); 
        }

        if (editedItem.docState != 3) {
            isValid = AsientosContables.simpleSchema().namedContext().validate(editedItem);

            if (!isValid) {
                AsientosContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                    errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
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

        $scope.partidas_ui_grid.data = [];
        Meteor.call('asientosContablesSave', editedItem, fechaOriginalAsientoContable, (err, result) => {

            if (err) {

                let errorMessage = mensajeErrorDesdeMethod_preparar(err);
                
                $scope.$parent.alerts.length = 0;
                $scope.$parent.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
    
                $scope.showProgress = false;
                $scope.$apply();
    
                return;
            }

            if ($scope.asientoContable && $scope.asientoContable.numeroAutomatico == 0) {
                // cuando el asiento es nuevo, hacemos un refresh(). El resultado es que el asiento es leído desde la
                // base de datos, con todos sus valores, tal como se determinaron en el servidor: número automático (pk),
                // mes y año fiscal, número del asiento, etc.

                // nota: cuando el usuario elimine un asiento, éste será eliminado de mongo y, por efecto de reactividad,
                // $scope.asientoContable será undefined ...
                $scope.id = $scope.asientoContable._id;  // asiento nuevo: $scope.id siempre es cero (hasta que lo grabamos)
                $scope.refresh();
            }
            else {
                $scope.refresh();
            }
        })
    }


    $scope.asignarNumeroContab = () => {

        if ($scope.asientoContable.docState) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        if (!$scope.asientoContable || !$scope.asientoContable.numeroAutomatico) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, el asiento contable no está completo aún. " +
                                "Ud. debe completar el registro del asiento contable antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        // ninguna de las partidas debe tener un monto con más de 2 decimales
        if ($scope.asientoContable && $scope.asientoContable.partidas) {
            if (montoConMasDeDosDecimales($scope.asientoContable.partidas)) {
                DialogModal($modal, "<em>Asientos contables</em>",
                                    `Aparentemente, al menos una de las partidas en el asiento contable,
                                    tiene un monto con <b>más de dos decimales</b>.<br /><br />
                                    Para corregir esta situación, Ud. debe seleccionar alguna partida en la lista y
                                    hacer un <em>click</em> en la función <em>cuadrar asiento</em>.<br />
                                    Esto redondeara los montos en las partidas a un máximo de dos decimales.<br /><br />
                                    Luego puede regresar e intentar grabar el asiento contable.`,
                                    false).then();
                return;
            }
        }

        $scope.showProgress = true;

        $meteor.call('contab_asignarNumeroAsientoContab', $scope.asientoContable.numeroAutomatico).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

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
                }

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


    $scope.convertirAOtraMoneda = () => {

        if ($scope.asientoContable.docState) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        if (!$scope.asientoContable || !$scope.asientoContable.numeroAutomatico || !$scope.asientoContable.numero) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "Aparentemente, el asiento contable no está completo aún. " +
                                "Ud. debe completar el registro del asiento contable antes de intentar ejecutar esta función.",
                                false).then();
            return;
        }

        if ($scope.asientoContable.numero < 0) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                "El asiento contable tiene un número negativo. <br />" +
                                "Solo asientos contables con números <b><em>Contab</b></em> pueden ser convertidos.",
                                false).then();
            return;
        }

        if ($scope.asientoContable.moneda != $scope.asientoContable.monedaOriginal) {
            DialogModal($modal, "<em>Asientos contables</em>",
                                `El asiento contable es un asiento convertido; es decir, es el resultado de una
                                conversión. <br />
                                Solo asientos contables registrados en <em>moneda original</em> pueden ser convertidos.`,
                                false).then();
            return;
        }

        // ninguna de las partidas debe tener un monto con más de 2 decimales
        if ($scope.asientoContable && $scope.asientoContable.partidas) {
            if (montoConMasDeDosDecimales($scope.asientoContable.partidas)) {
                DialogModal($modal, "<em>Asientos contables</em>",
                                    `Aparentemente, al menos una de las partidas en el asiento contable,
                                    tiene un monto con <b>más de dos decimales</b>.<br /><br />
                                    Para corregir esta situación, Ud. debe seleccionar alguna partida en la lista y
                                    hacer un <em>click</em> en la función <em>cuadrar asiento</em>.<br />
                                    Esto redondeara los montos en las partidas a un máximo de dos decimales.<br /><br />
                                    Luego puede regresar e intentar grabar el asiento contable.`,
                                    false).then();
                return;
            }
        }

        $scope.showProgress = true;

        Meteor.call('contab.asientos.convertir',
                $scope.asientoContable.numeroAutomatico,
                (err, result) => {

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

                // el método puede regresar un error (y su mensaje)
                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: result.error ? 'danger' : 'info',
                    msg: result.message
                });

                $scope.showProgress = false;
                $scope.$apply();
        });
    }


    $scope.helpParaCuentasContables = function() { 

        if (!partidaSeleccionada || lodash.isEmpty(partidaSeleccionada)) {
            DialogModal($modal, "<em>Asientos contables - Consultar cuentas contables</em>",
                `Ud. debe seleccionar una partida en la lista. <br />
                 Si Ud. selecciona una cuenta contable mediante esta función, ésta será asignada a la partida seleccionada en la lista.`,
                false).then();
            return;
        }

        if (!$scope.asientoContable || !$scope.asientoContable.partidas || !Array.isArray($scope.asientoContable.partidas) || !$scope.asientoContable.partidas.length) {
            DialogModal($modal, "<em>Asientos contables - Cuadrar asiento contable</em>",
                `Error inesperado: aparentemente, el asiento contable no tiene partidas registradas. Por favor revise.`,
                false).then();
            return;
        }

        var modalInstance = $modal.open({
            templateUrl: 'client/contab/asientosContables/cuentasContablesSearch/buscarCuentasContables_modal.html',
            controller: 'BuscarCuentasContables_Modal_Controller',
            size: 'md',
            resolve: {
                companiaContabSeleccionada: () => {
                    return companiaContabSeleccionada;
                }, 
                partidaSeleccionada: () => {
                    return partidaSeleccionada;
                }
            }
        }).result.then(
            function (resolve) {
                // el usuario seleccionó una cuenta contable en la lista; actualizamos la partida seleccionada ... 
                partidaSeleccionada.cuentaContableID = resolve.cuentaContableID; 

                if (!partidaSeleccionada.docState && partidaSeleccionada.docState != 0) { 
                    partidaSeleccionada.docState = 2;
                } else if (partidaSeleccionada.docState === 0) { 
                    // el registro es nuevo; pasamos a nuevo-editado cuando el usaurio edita; agregamos uno nuevo al instante, 
                    // para que siempre haya uno nuevo en la lista. La idea es que el usuario no tenga que hacer click en Nuevo en el toolbar  
                    partidaSeleccionada.docState = 1; 

                    let index = $scope.asientoContable.partidas.indexOf(partidaSeleccionada, 0);

                    if (index != -1 && index > 0) {

                        let partidaAnterior = $scope.asientoContable.partidas[index - 1];
                        if (partidaAnterior) {
                            if (partidaAnterior.descripcion && !partidaSeleccionada.descripcion) { 
                                partidaSeleccionada.descripcion = partidaAnterior.descripcion;
                            }
                                
                            if (partidaAnterior.referencia && !partidaSeleccionada.referencia) { 
                                partidaSeleccionada.referencia = partidaAnterior.referencia;
                            }
                                
                            if (!partidaSeleccionada.debe && !partidaSeleccionada.haber) {
                                // intentamos cuadrar el asiento en la partida actual ...
                                let totalDebe = lodash.sumBy($scope.asientoContable.partidas, (x) => { return x.debe ? x.debe : 0; });
                                let totalHaber = lodash.sumBy($scope.asientoContable.partidas, (x) => { return x.haber ? x.haber : 0; });

                                if (totalDebe > totalHaber) {
                                    partidaSeleccionada.haber = lodash.round(totalDebe - totalHaber, 2);
                                }
                                else {
                                    partidaSeleccionada.debe = lodash.round(totalHaber - totalDebe, 2);
                                }
                            }
                        }
                    }

                    $scope.agregarPartida(); 
                }
                    
                if (!$scope.asientoContable.docState) { 
                    $scope.asientoContable.docState = 2;
                }

                return true;
            },
            function (cancel) {
                return true;
            });
    }


    // -------------------------------------------------------------------------
    // para inicializar el item (en el $scope) cuando el usuario abre la página
    // -------------------------------------------------------------------------

    $scope.helpers({
        monedas: () => {
        return Monedas.find();
        },
        tiposAsientoContable: () => {
            return TiposAsientoContable.find();
        },
    });

    let fechaOriginalAsientoContable = null;

    function inicializarItem() {

        $scope.showProgress = true;

        if ($scope.id == "0") {
            let usuario = Meteor.users.findOne(Meteor.userId());
            let monedaDefecto = Monedas.findOne({ defaultFlag: true });
            let tipoAsientoDefecto = ParametrosGlobalBancos.findOne();
            fechaOriginalAsientoContable = null;

            if (!monedaDefecto) {
                DialogModal($modal, "<em>Asientos contables</em>",
                                    `Aparentemente, no se ha definido una moneda <em>defecto</em>
                                    en el catálogo de monedas. <br />
                                    Ud. debe revisar el catálgo <em>Monedas</em> y corregir esta situación.`,
                                    false).then();

                $scope.showProgress = false;
                return;
            }

            if (!tipoAsientoDefecto || !tipoAsientoDefecto.tipoAsientoDefault) {
                DialogModal($modal, "<em>Asientos contables</em>",
                                    `Aparentemente, no se ha definido una tipo de asientos <em>defecto</em>,
                                    en el catálogo <em>Parámetros globales</em> en <em>Bancos</em>. <br />
                                    Ud. debe revisar el catálgo <em>Parámetros globales</em> (en Bancos) y
                                    corregir esta situación.`,
                                    false).then();

                $scope.showProgress = false;
                return;
            }

            $scope.asientoContable = {  _id: new Mongo.ObjectID()._str,
                                        numeroAutomatico: 0,
                                        mes: 0,
                                        ano: 0,
                                        mesFiscal: 0,
                                        anoFiscal: 0,
                                        numero: 0,
                                        tipo: tipoAsientoDefecto.tipoAsientoDefault,
                                        moneda: monedaDefecto.moneda,
                                        monedaOriginal: monedaDefecto.moneda,
                                        partidas: [],
                                        ingreso: new Date(),
                                        ultAct: new Date(),
                                        user: Meteor.userId(),
                                        usuario: usuario.emails[0].address,
                                        cia: companiaContabSeleccionada.numero,
                                        docState: 1
                                    };

            $scope.agregarPartida();        // para que el asiento nuevo venga con una partida y el usuario no tenga que hacer un click en Nuevo ... 

            $scope.partidas_ui_grid.data = [];
            $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
                
            $scope.showProgress = false;
        }
        else {

            let filtro = {
                _id: $scope.id,
            };

            // cuando el usuario selecciona el asiento en la lista (asientosContablesList), alli, con
            // un Meteor method se lee desde sql y se graba a mongo; ahora suscribimos para leerlo
            // desde mongo y mostrarlo en esta página
            Meteor.subscribe('asientosContables', JSON.stringify(filtro), () => {

                $scope.helpers({
                    asientoContable: () => {
                    return AsientosContables.findOne({ _id: $scope.id });
                    }
                });

                // guardamos, en una propiedad separada, la fecha del asiento; esto nos permitirá validar 2 cosas, aún
                // si el usuario cambia la fecha del asiento:
                // 1) que no se cambie a un mes diferente (esto podría permitirse, pero tomando en cuenta varios criterios)
                // 2) que el asiento no corresponda a un mes cerrado (y su fecha sea cambiada a uno que no lo es)
                fechaOriginalAsientoContable = $scope.asientoContable ? $scope.asientoContable.fecha : null;

                $scope.partidas_ui_grid.data = [];

                if (lodash.isArray($scope.asientoContable.partidas)) { 
                    $scope.partidas_ui_grid.data = $scope.asientoContable.partidas;
                }

                let result = revisarSumasIguales($scope.asientoContable.partidas); 

                if (result.error) { 
                    let message = result.message.replace(/\/\//gi, "");
                    $scope.alerts.push({ type: 'warning', msg: message });
                }

                $scope.showProgress = false;
                $scope.$apply();
            })
        }
    }

    inicializarItem();
  }
]);

function montoConMasDeDosDecimales(partidas) {
    // verificamos que ninguna de las partidas en el array, tenga más de dos decimales en su monto

    let montoMas2Decimales = false;

    partidas.forEach((x) => {
        if (x.debe != lodash.round(x.debe, 2)) {
            montoMas2Decimales = true;
        }

        if (x.haber != lodash.round(x.haber, 2)) {
            montoMas2Decimales = true;
        }
    })

    return montoMas2Decimales;
}
