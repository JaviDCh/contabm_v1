
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        // $locationProvider.html5Mode(true);

          $stateProvider
        // ----------------------------------------------------------------
        // contab
        // ---------------------------------------------------------------
        .state('contab', {
            url: '/contab',
            templateUrl: 'client/contab/main.html',
            controller: 'Contab_Main_Controller'
        })

        // -------------------------------------------------------------------------------------------
        // Catálogos
        // -------------------------------------------------------------------------------------------
        .state('contab.companias', {
            url: '/companias',
            templateUrl: 'client/contab/catalogos/companias/companias.html',
            controller: 'Catalogos_Companias_Controller',
            parent: 'contab'
        })
        .state('contab.monedas', {
            url: '/monedas',
            templateUrl: 'client/contab/catalogos/monedas/monedas.html',
            controller: 'Catalogos_Monedas_Controller',
            parent: 'contab'
        })
        .state('contab.cuentasContables', {
            url: '/cuentasContables',
            templateUrl: 'client/contab/catalogos/cuentasContables/cuentasContables.html',
            controller: 'Catalogos_CuentasContables_Controller',
            parent: 'contab'
        })
        .state('contab.codificacionesContables', {
            url: '/codificacionesContables',
            templateUrl: 'client/contab/catalogos/codificacionesContables/codificacionesContables.html',
            controller: 'Catalogos_Contab_CodificacionesContables_Controller',
            parent: 'contab'
        })
        .state('contab.gruposContables', {
            url: '/gruposContables',
            templateUrl: 'client/contab/catalogos/gruposContables/gruposContables.html',
            controller: 'Catalogos_GruposContables_Controller',
            parent: 'contab'
        })
        .state('contab.mesesDelAnoFiscal', {
            url: '/mesesDelAnoFiscal',
            templateUrl: 'client/contab/catalogos/mesesDelAnoFiscal/mesesDelAnoFiscal.html',
            controller: 'Catalogos_MesesDelAnoFiscal_Controller',
            parent: 'contab'
        })
        .state('contab.centrosCosto', {
            url: '/centrosCosto',
            templateUrl: 'client/imports/contab/catalogos/centrosCosto/centrosCosto.html',
            controller: 'Contab_Catalogos_CentrosCosto_Controller',
            parent: 'contab'
        })
        .state('contab.parametrosContab', {
            url: '/parametrosContab',
            templateUrl: 'client/contab/catalogos/parametrosContab/parametrosContab.html',
            controller: 'Catalogos_ParametrosContab_Controller',
            parent: 'contab'
        })
        .state('contab.filtrosConsultasContab', {
            url: '/filtrosConsultasContab',
            templateUrl: 'client/contab/catalogos/filtrosConsultasContab/filtrosConsultasContab.html',
            controller: 'Catalogos_FiltrosConsultasContab_Controller',
            parent: 'contab'
        })
        .state('contab.activosFijos', {
            url: '/activosFijos',
            templateUrl: 'client/contab/catalogos/activosFijos/activosFijos.html',
            controller: 'Catalogos_ActivosFijos_Controller',
            parent: 'contab'
        })

        // -------------------------------------------------------------------------------------------
        // Generales
        // -------------------------------------------------------------------------------------------
        .state('contab.CopiarCatalogos', {
            url: '/copiarCatalogos',
            templateUrl: 'client/contab/copiarCatalogos/copiarCatalogos.html',
            controller: 'Contab_CopiarCatalogos_Controller',
            parent: 'contab'
        })
        .state('contab.SeleccionarCompania', {
            url: '/seleccionarCompania',
            templateUrl: 'client/seleccionarCompania/seleccionarCompania.html',
            controller: 'SeleccionarCompaniaController',
            parent: 'contab'
        })
        .state('contab.PersistirCuentasContables', {
            url: '/persistirCuentasContables',
            templateUrl: 'client/contab/persistirCuentasContables/persistirCuentasContables.html',
            controller: 'Contab_PersistirCuentasContables_Controller',
            parent: 'contab'
        })
        .state('contab.reconversionMonetaria', {
            url: '/reconversionMonetaria',
            templateUrl: 'client/contab/reconversion/reconversion.html',
            controller: 'Contab_ReconversionMonetaria_Controller',
            parent: 'contab'
        })

        // -------------------------------------------------------------------------------------------
        // Consultas
        // -------------------------------------------------------------------------------------------
        // Codificaciones contables
        .state('contab.consulta_codificacionesContables', {
            url: '/consultas/codificacionesContables',
            templateUrl: 'client/contab/consultas/codificacionesContables/codificacionesContables.html',
            controller: 'Contab_Consultas_CodificacionesContables_Controller',
            parent: 'contab'
        })
        .state('contab.consulta_codificacionesContables.prepararDatos', {
            url: '/prepararDatos',
            templateUrl: 'client/contab/consultas/codificacionesContables/prepararDatos/prepararDatos.html',
            controller: 'Contab_Consultas_CodificacionesContables_PrepararDatos_Controller',
            parent: 'contab.consulta_codificacionesContables'
        })
        .state('contab.consulta_codificacionesContables.consultas', {
            url: '/consultas',
            templateUrl: 'client/contab/consultas/codificacionesContables/consultas/consultas.html',
            controller: 'Contab_Consultas_CodificacionesContables_Consultas_Controller',
            parent: 'contab.consulta_codificacionesContables'
        })

        // saldos
        .state('contab.consulta_saldos', {
            url: '/consultas/saldos',
            templateUrl: 'client/contab/consultas/saldos/saldos.html',
            controller: 'Contab_Consultas_Saldos_Controller',
            parent: 'contab'
        })
        .state('contab.consulta_saldos.filtro', {
            url: '/filtro',
            templateUrl: 'client/contab/consultas/saldos/filtro.html',
            controller: 'Contab_Consultas_Saldos_Filtro_Controller',
            parent: 'contab.consulta_saldos'
        })
        .state('contab.consulta_saldos.lista', {
            url: '/lista',
            templateUrl: 'client/contab/consultas/saldos/lista.html',
            controller: 'Contab_Consultas_Saldos_Lista_Controller',
            parent: 'contab.consulta_saldos'
        })

        // cuentas y sus movimientos (mayor general)
        .state('contab.consulta_cuentasYMovimientos', {
            url: '/consultas/cuentasYSusMovimientos',
            templateUrl: 'client/contab/consultas/cuentasYSusMovimientos/main.html',
            controller: 'Contab_Consultas_CuentasYMovimientos_Controller',
            parent: 'contab'
        })
        .state('contab.consulta_cuentasYMovimientos.filtro', {
            url: '/filtro',
            templateUrl: 'client/contab/consultas/cuentasYSusMovimientos/filtro.html',
            controller: 'Contab_Consultas_CuentasYMovimientos_Filtro_Controller',
            parent: 'contab.consulta_cuentasYMovimientos'
        })
        .state('contab.consulta_cuentasYMovimientos.lista', {
            url: '/lista?desde&hasta',
            templateUrl: 'client/contab/consultas/cuentasYSusMovimientos/lista.html',
            controller: 'Contab_Consultas_CuentasYMovimientos_Lista_Controller',
            params: { 'desde': null, 'hasta': null, },
            parent: 'contab.consulta_cuentasYMovimientos'
        })

        // -------------------------------------------------------------------------------------------
        // Asientos contables
        // -------------------------------------------------------------------------------------------
        .state('contab.asientosContables', {
            url: '/contab/asientosContables',
            templateUrl: 'client/contab/asientosContables/asientosContables.html',
            controller: 'Contab_AsientosContables_Controller',
            parent: 'contab'
        })
        .state('contab.asientosContables.filter', {
            url: '/contab/asientosContables/filter?origen',
            templateUrl: 'client/contab/asientosContables/filter.html',
            controller: 'Contab_AsientoContableFiltro_Controller',
            params: { 'origen': null, },
            parent: 'contab.asientosContables'
        })
        .state('contab.asientosContables.lista', {
            url: '/contab/asientosContables/lista?origen&pageNumber',
            templateUrl: 'client/contab/asientosContables/lista.html',
            controller: 'Contab_AsientoContableLista_Controller',
            params: { 'origen': null, 'pageNumber': null, },
            parent: 'contab.asientosContables'
        })
        .state('contab.asientosContables.asientoContable', {
            url: '/contab/asientosContables/asientoContable?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/contab/asientosContables/asientoContable.html',
            controller: 'Contab_AsientoContable_Controller',
            params: { 'origen': null, 'id': null, 'pageNumber': null, 'vieneDeAfuera': null },
            parent: 'contab.asientosContables'
            // resolve: {
            //     // para asegurarnos que los catálogos están cargados (por un publisher en el server)
            //     // antes de intentar abrir el state; ésto se hizo necesario desde que empezamos a
            //     // abrir la página de asientos desde alguna otra página, en un Tab diferente (y los
            //     // catálogos no estaban allí!!!)
            //     catalogosContab: function($q) {

            //         var deferred = $q.defer();

            //         let ciaSeleccionada = null;
            //         let ciaContabSeleccionada = null;

            //         if (Meteor.userId()) {
            //             ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
            //             if (ciaSeleccionada) {
            //                 ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
            //             }
            //         }

            //         if (ciaContabSeleccionada) {
            //             // Ok, los catálogos están en el client
            //             deferred.resolve('okey');
            //         } else {
            //             Meteor.subscribe('catalogosContab', () => {
            //                 // Ok, los catálogos están en el client
            //                 deferred.resolve('okey');
            //             });
            //         }

            //         return deferred.promise;
            //     },
            // },
        })

        // -------------------------------------------------------------------------------------------
        // cierres
        // -------------------------------------------------------------------------------------------
        .state('contab.ultimoMesCerrado', {
            url: '/ultimoMesCerrado',
            templateUrl: 'client/contab/cierres/ultimoMesCerrado/ultimoMesCerrado.html',
            controller: 'Contab_UltimoMesCerrado_Controller',
            parent: 'contab'
        })
        .state('contab.cierre', {
            url: '/cierre',
            templateUrl: 'client/contab/cierres/cierre/cierre.html',
            controller: 'Contab_Cierre_Controller',
            parent: 'contab'
        })
  }
]);
