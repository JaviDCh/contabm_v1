
import numeral from 'numeral'; 

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Empleados } from '/models/nomina/empleados'; 
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 
import { Filtros } from '/imports/collections/general/filtros'; 

import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar';

angular.module("contabm").controller("Catalogos_Nomina_CuentasContablesEmpleadoRubro_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

    $scope.showProgress = false;

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUser) { 
    companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID,
        { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
          
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionada && !_.isEmpty(companiaSeleccionada)) { 
    $scope.companiaSeleccionada = companiaSeleccionada;
    }
    else { 
    $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }
          
    // ------------------------------------------------------------------------------------------------
    $scope.helpers({
        maestraRubros: () => {
        return MaestraRubros.find({}, { items: { rubro: 1, nombreCortoRubro: 1 },
                                        sort: { nombreCortoRubro: 1 } });
        },
        empleados: () => {
            return Empleados.find({ cia:  companiaSeleccionada ? companiaSeleccionada.numero : -999 },
                                { items: { empleado: 1, alias: 1 },
                                    sort: { alias: 1 }});
        },
        departamentos: () => {
            return Departamentos.find({}, { sort: { descripcion: 1 }});
        },
        cuentasContables: () => {
            return CuentasContables2.find({ cia:  companiaSeleccionada ? companiaSeleccionada.numero : -999 },
                                        { sort: { cuenta: 1 }})
        },
    });


    let cuentasContables_ui_grid_api = null;
    let itemSeleccionado = {};

    $scope.cuentasContables_ui_grid = {

        enableSorting: true,
        showColumnFooter: false,
        enableCellEdit: false,
        enableFiltering: false,
        enableCellEditOnFocus: true,
        enableRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        enableSelectAll: false,
        selectionRowHeaderWidth: 0,
        rowHeight: 25,

        onRegisterApi: function (gridApi) {

            cuentasContables_ui_grid_api = gridApi;

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                itemSeleccionado = {};
                if (row.isSelected) {
                    itemSeleccionado = row.entity;
                }
                else
                    return;
            });

            gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                if (newValue != oldValue) {
                    if (!rowEntity.docState) {
                        rowEntity.docState = 2;
                    };
                };
            });
        },
        // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
        rowIdentity: function (row) {
            return row._id;
        },

        getRowIdentity: function (row) {
            return row._id;
        }
    };

    $scope.cuentasContablesLista = CuentasContables2.find({ cia: $scope.companiaSeleccionada.numero, totDet: 'D', actSusp: 'A' },
                                                        { sort: { cuenta: true }}).fetch();
    $scope.cuentasContablesLista.forEach((x) => { x.cuentaDescripcionCia = x.cuentaDescripcionCia(); })

    $scope.cuentasContables_ui_grid.columnDefs = [
        {
            name: 'docState',
            field: 'docState',
            displayName: '',
            cellTemplate:
            '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
            '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableColumnMenu: false,
            enableSorting: false,
            width: 25
        },

        {
            name: 'rubro',
            field: 'rubro',
            displayName: 'Rubro',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'mapDropdown:row.grid.appScope.maestraRubros:"rubro":"nombreCortoRubro"',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'rubro',
            editDropdownValueLabel: 'nombreCortoRubro',
            editDropdownOptionsArray: $scope.maestraRubros,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'empleado',
            field: 'empleado',
            displayName: 'Empleado',
            width: 120,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'mapDropdown:row.grid.appScope.empleados:"empleado":"alias"',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'empleado',
            editDropdownValueLabel: 'alias',
            editDropdownOptionsArray: $scope.empleados,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'departamento',
            field: 'departamento',
            displayName: 'Departamento',
            width: 160,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',
            cellFilter: 'mapDropdown:row.grid.appScope.departamentos:"departamento":"descripcion"',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'departamento',
            editDropdownValueLabel: 'descripcion',
            editDropdownOptionsArray: $scope.departamentos,

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'cuentaContable',
            field: 'cuentaContable',
            displayName: 'Cuenta contable',
            width: 200,
            headerCellClass: 'ui-grid-leftCell',
            cellClass: 'ui-grid-leftCell',

            editableCellTemplate: 'ui-grid/dropdownEditor',
            editDropdownIdLabel: 'id',
            editDropdownValueLabel: 'cuentaDescripcionCia',
            editDropdownOptionsArray: $scope.cuentasContablesLista,
            cellFilter: 'mapDropdown:row.grid.appScope.cuentasContablesLista:"id":"cuentaDescripcionCia"',

            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'string'
        },
        {
            name: 'sumarizarEnUnaPartidaFlag',
            field: 'sumarizarEnUnaPartidaFlag',
            displayName: 'Sumarizar?',
            width: 100,
            headerCellClass: 'ui-grid-centerCell',
            cellClass: 'ui-grid-centerCell',
            cellFilter: 'boolFilter',
            enableColumnMenu: false,
            enableCellEdit: true,
            enableSorting: true,
            type: 'boolean'
        },
        {
            name: 'delButton',
            displayName: '',
            cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
            enableCellEdit: false,
            enableSorting: false,
            width: 25
        },
    ];


    $scope.deleteItem = function (item) {
        if (item.docState && item.docState === 1)
            // si el item es nuevo, simplemente lo eliminamos del array
            _.remove($scope.cuentasContablesEmpleadoRubro, (x) => { return x._id === item._id; });
        else
            item.docState = 3;
    };

    $scope.nuevo = function () {
        let item = {
            _id: new Mongo.ObjectID()._str,
            claveUnica: 0,             // este es el pk en sql; tendrá un valor válido cuando insertemos el record en sql
            sumarizarEnUnaPartidaFlag: false,
            cia: $scope.companiaSeleccionada.numero,
            user: Meteor.userId(),
            docState: 1
        };

        $scope.cuentasContablesEmpleadoRubro.push(item);

        $scope.cuentasContables_ui_grid.data = [];
        $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesEmpleadoRubro;
    };


    // para limpiar el filtro, simplemente inicializamos el $scope.filtro ...
    $scope.limpiarFiltro = function () {
        $scope.filtro = {};
    };

    $scope.aplicarFiltro = function () {

        $scope.showProgress = true;

        Meteor.call('nomina_cuentasContablesEmpleadoRubro_leerDesdeSql', JSON.stringify($scope.filtro), $scope.companiaSeleccionada.numero, (err, result) => {

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

            // ------------------------------------------------------------------------------------------------------
            // guardamos el filtro indicado por el usuario
            if (Filtros.findOne({ nombre: 'nomina.cuentasContablesEmpleadoRubro', userId: Meteor.userId() }))
                // el filtro existía antes; lo actualizamos
                // validate false: como el filtro puede ser vacío (ie: {}), simple schema no permitiría eso; por eso saltamos la validación
                Filtros.update(Filtros.findOne({ nombre: 'nomina.cuentasContablesEmpleadoRubro', userId: Meteor.userId() })._id,
                                { $set: { filtro: $scope.filtro } },
                                { validate: false });
            else
                Filtros.insert({
                    _id: new Mongo.ObjectID()._str,
                    userId: Meteor.userId(),
                    nombre: 'nomina.cuentasContablesEmpleadoRubro',
                    filtro: $scope.filtro
                });
            // ------------------------------------------------------------------------------------------------------
            // limit es la cantidad de items en la lista; inicialmente es 50; luego avanza de 50 en 50 ...
            leerPrimerosRegistrosDesdeServidor(50);

            // usamos jquery para hacer un click en el link que collapsa el filtro (bootstrap collapse);
            $("#collapseLink").click();
        });
    };


    // ------------------------------------------------------------------------------------------------------
    // si hay un filtro anterior, lo usamos
    // los filtros (solo del usuario) se publican en forma automática cuando se inicia la aplicación
    $scope.filtro = {};
    var filtroAnterior = Filtros.findOne({ nombre: 'nomina.cuentasContablesEmpleadoRubro', userId: Meteor.userId() });

    if (filtroAnterior)
        $scope.filtro = _.clone(filtroAnterior.filtro);
    // ------------------------------------------------------------------------------------------------------

    $scope.cuentasContablesEmpleadoRubro = []
    $scope.cuentasContables_ui_grid.data = [];

    let recordCount = 0;
    let limit = 0;

    function leerPrimerosRegistrosDesdeServidor(cantidadRecs) {
        // cuando el usuario indica y aplica un filtro, leemos los primeros 50 registros desde mongo ...
        limit = cantidadRecs;
        Meteor.call('getCollectionCount', 'Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro', (err, result) => {

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

            // el método regresa la cantidad de items en el collection (siempre para el usuario)
            recordCount = result;
            $scope.leerRegistrosDesdeServer(limit);
        });
    }


    let subscriptionHandle = null;
    $scope.leerRegistrosDesdeServer = function (limit) {
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
        };

        subscriptionHandle =
        Meteor.subscribe('temp.nomina.consulta.cuentasContablesEmpleadoRubro.list', limit, () => {

            let meteorUserId = Meteor.userId();
            $scope.cuentasContablesEmpleadoRubro = [];
            $scope.cuentasContablesEmpleadoRubro =
                Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.find({ user: meteorUserId },
                                                                        { sort: { rubro: 1, cuentaContable: 1, }}).
                                                                    fetch();

            $scope.cuentasContables_ui_grid.data = $scope.cuentasContablesEmpleadoRubro;

            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'info',
                msg: `${numeral($scope.cuentasContablesEmpleadoRubro.length).format('0,0')} registros
                    (de ${numeral(recordCount).format('0,0')}) han sido seleccionados ...`
            });

            $scope.showProgress = false;
            $scope.$apply();
        });
    };

    $scope.leerMasRegistros = function () {
        limit += 50;    // la próxima vez, se leerán 50 más ...
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    };

    $scope.leerTodosLosRegistros = function () {
        // simplemente, leemos la cantidad total de registros en el collection (en el server y para el user)
        limit = recordCount;
        $scope.leerRegistrosDesdeServer(limit);     // cada vez se leen 50 más ...
    };

    $scope.save = function () {
        $scope.showProgress = true;

        // eliminamos los items eliminados; del $scope y del collection
        let editedItems = _.filter($scope.cuentasContablesEmpleadoRubro, function (item) { return item.docState; });

        // nótese como validamos cada item antes de intentar guardar (en el servidor)
        let isValid = false;
        let errores = [];

        // nótese como validamos contra un mondelo 'temp...', pues los registros no están realmente en mongo,
        // solo se copian cuando el usuario filtra en la página para consultar o editar
        editedItems.forEach((item) => {
            if (item.docState != 3) {
                isValid = Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.simpleSchema().namedContext().validate(item);

                if (!isValid) {
                    Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                        errores.push("El valor '" + error.value + "' no es adecuado para el campo <b><em>" + Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.simpleSchema().label(error.name) + "</b></em>; error de tipo '" + error.type + ".");
                    });
                }
            }
        });

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
        };

        $meteor.call('nomina.cuentasContablesEmpleadoRubroSave', editedItems).then(
            function (data) {

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'info',
                    msg: data
                });

                // leemos nuevamente los registros desde el servidor
                $scope.cuentasContables_ui_grid.data = [];
                leerPrimerosRegistrosDesdeServidor(limit);
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });

                $scope.showProgress = false;
        });
    };

    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'nomina', process: 'leerCuentasContablesEmpleadoRubroDesdeSqlServer' });
    EventDDP.addListener('nomina_leerCuentasContablesEmpleadoRubro_reportProgressDesdeSqlServer', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
    // ------------------------------------------------------------------------------------------------------

    // ------------------------------------------------------------------------------------------------
    // cuando el usuario sale de la página, nos aseguramos de detener (ie: stop) el subscription,
    // para limpiar los items en minimongo ...
    $scope.$on('$destroy', function() {
        if (subscriptionHandle && subscriptionHandle.stop) {
            subscriptionHandle.stop();
        };
    });
}
]);
