

angular.module("contabm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
        // ----------------------------------------------------------------
        // bancos
        // ----------------------------------------------------------------
        .state('bancos', {
            url: '/bancos',
            templateUrl: 'client/bancos/main.html',
            controller: 'Bancos_Main_Controller'
        })
        .state('bancos.companias', {
            url: '/companias',
            templateUrl: 'client/contab/catalogos/companias/companias.html',
            controller: 'Catalogos_Companias_Controller',
            parent: 'bancos'
        })
        .state('bancos.monedas', {
            url: '/monedas',
            templateUrl: 'client/contab/catalogos/monedas/monedas.html',
            controller: 'Catalogos_Monedas_Controller',
            parent: 'bancos'
        })
        // proveedores
        .state('bancos.proveedoresClientes', {
            url: '/proveedoresClientes',
            templateUrl: 'client/bancos/catalogos/proveedoresClientes/lista.html',
            controller: 'ProveedoresClientes_Lista_Controller',
            parent: 'bancos'
        })
        .state('bancos.cuentasBancarias', {
            url: '/cuentasBancarias',
            templateUrl: 'client/bancos/catalogos/cuentasBancarias/cuentasBancarias.html',
            controller: 'Catalogos_CuentasBancarias_Controller',
            parent: 'bancos'
        })
        .state('bancos.unidadTributaria', {
            url: '/unidadTributaria',
            templateUrl: 'client/imports/bancos/catalogos/unidadTributaria/unidadTributaria.html',
            controller: 'Bancos_Catalogos_UnidadTributaria_Controller',
            parent: 'bancos'
        })
        .state('bancos.categoriasRetencion', {
            url: '/categoriasRetencion',
            templateUrl: 'client/imports/bancos/catalogos/categoriasRetencion/categoriasRetencion.html',
            controller: 'Bancos_Catalogos_CategoriasRetencion_Controller',
            parent: 'bancos',
        })
        .state('bancos.parametros', {
            url: '/parametros',
            templateUrl: 'client/bancos/catalogos/parametros/parametros.html',
            controller: 'Catalogos_ParametrosBancos_Controller',
            parent: 'bancos'
        })
        .state('bancos.parametrosGlobal', {
            url: '/parametrosGlobal',
            templateUrl: 'client/bancos/catalogos/parametrosGlobal/parametrosGlobal.html',
            controller: 'Catalogos_ParametrosGlobalBancos_Controller',
            parent: 'bancos'
        })
        .state('bancos.definicionCuentasContables', {
            url: '/definicionCuentasContables',
            templateUrl: 'client/bancos/catalogos/definicionCuentasContables/definicionCuentasContables.html',
            controller: 'Catalogos_Bancos_DefinicionCuentasContables_Controller',
            parent: 'bancos'
        })
        // caja chica 
        .state('bancos.cajaChica_cajasChicas', {
            url: '/cajaChica_cajasChicas',
            templateUrl: 'client/bancos/catalogos/cajaChica/cajasChicas/cajasChicas.html',
            controller: 'Catalogos_Bancos_CajaChica_CajasChicas_Controller',
            parent: 'bancos'
        })
        .state('bancos.cajaChica_rubros', {
            url: '/cajaChica_rubros',
            templateUrl: 'client/bancos/catalogos/cajaChica/rubros/rubros.html',
            controller: 'Catalogos_Bancos_CajaChica_Rubros_Controller',
            parent: 'bancos'
        })
        .state('bancos.cajaChica_cuentasContables', {
            url: '/cajaChica_cuentasContables',
            templateUrl: 'client/bancos/catalogos/cajaChica/cuentasContables/cuentasContables.html',
            controller: 'Catalogos_Bancos_CajaChica_CuentasContables_Controller',
            parent: 'bancos'
        })
        .state('bancos.cajaChica_parametros', {
            url: '/cajaChica_parametros',
            templateUrl: 'client/bancos/catalogos/cajaChica/parametros/parametros.html',
            controller: 'Catalogos_Bancos_CajaChica_Parametros_Controller',
            parent: 'bancos'
        })

        // -------------------------------------------------------------------------------------------
        // Generales
        .state('bancos.CopiarCatalogos', {
            url: '/copiarCatalogos',
            templateUrl: 'client/bancos/copiarCatalogos/copiarCatalogos.html',
            controller: 'Bancos_CopiarCatalogos_Controller',
            parent: 'bancos'
        })
        .state('bancos.SeleccionarCompania', {
            url: '/seleccionarCompania',
            templateUrl: 'client/seleccionarCompania/seleccionarCompania.html',
            controller: 'SeleccionarCompaniaController',
            parent: 'bancos'
        })
        // registrar files
        .state('bancos.registrarFiles', {
            url: '/registrarFiles?aplicacion',
            templateUrl: 'client/generales/registrarFiles/registroFiles.html',
            controller: 'RegistroFiles_Controller',
            params: { 'aplicacion': 'bancos', },
            parent: 'bancos'
        })

        // -------------------------------------------------------------------------------------------
        // movimientos bancarios
        .state('bancos.movimientosBancarios', {
            url: '/movimientosBancarios',
            templateUrl: 'client/bancos/movimientosBancarios/movimientosBancarios.html',
            controller: 'Bancos_MovimientosBancarios_Controller',
            parent: 'bancos'
        })
        .state('bancos.movimientosBancarios.filter', {
            url: '/filter?origen',
            templateUrl: 'client/bancos/movimientosBancarios/filter.html',
            controller: 'Bancos_MovimientosBancarios_Filter_Controller',
            params: { 'origen': null, },
            parent: 'bancos.movimientosBancarios'
        })
        .state('bancos.movimientosBancarios.lista', {
            url: '/lista?origen&pageNumber',
            templateUrl: 'client/bancos/movimientosBancarios/lista.html',
            controller: 'Bancos_MovimientosBancarios_List_Controller',
            params: { 'origen': null, 'limit': null, },
            parent: 'bancos.movimientosBancarios'
        })
        .state('bancos.movimientosBancarios.movimientoBancario', {
            url: '/movimientoBancario?origen&id&limit&vieneDeAfuera&proveedorID',
            templateUrl: 'client/bancos/movimientosBancarios/movimientoBancario.html',
            controller: 'Bancos_MovimientosBancarios_MovimientoBancario_Controller',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null, proveedorID: null, },
            parent: 'bancos.movimientosBancarios'
        })


        // -------------------------------------------------------------------------------------------
        // facturas
        .state('bancos.facturas', {
            url: '/facturas',
            templateUrl: 'client/bancos/facturas/facturas.html',
            controller: 'Bancos_Facturas_Controller',
            parent: 'bancos',
            abstract: true,
            resolve: {
                leerTablasImpuestosRetenciones: function(leerTablasImpuestos_service) {
                    return leerTablasImpuestos_service.leerTablasImpuestos().then(function(response) {
                          return response;
                    })
                },
            },
        })
        .state('bancos.facturas.filter', {
            url: '/filter?origen',
            templateUrl: 'client/bancos/facturas/filter.html',
            controller: 'Bancos_Facturas_Filter_Controller',
            params: { 'origen': null, },
            parent: 'bancos.facturas'
        })
        .state('bancos.facturas.lista', {
            url: '/lista?origen&limit',
            templateUrl: 'client/bancos/facturas/lista.html',
            controller: 'Bancos_Facturas_List_Controller',
            params: { 'origen': null, 'limit': null, },
            parent: 'bancos.facturas'
        })
        .state('bancos.facturas.factura', {
            url: '/facturas?origen&id&limit&vieneDeAfuera&proveedorID',
            templateUrl: 'client/bancos/facturas/factura.html',
            controller: 'Bancos_Facturas_Factura_Controller',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null, proveedorID: null, },
            parent: 'bancos.facturas',
            resolve: {
                // nótese que al injectar el resolve del parent state, nos aseguramos que aquel se resuelva siempre
                // antes que este ...
                tablasImpuestosRetenciones: (leerTablasImpuestosRetenciones) => {
                    return leerTablasImpuestosRetenciones;
                }
            },
        })

        // -------------------------------------------------------------------------------------------
        // pagos
        .state('bancos.pagos', {
            url: '/pagos',
            templateUrl: 'client/bancos/pagos/pagos.html',
            controller: 'Bancos_Pagos_Controller',
            parent: 'bancos'
        })
        .state('bancos.pagos.filter', {
            url: '/filter?origen',
            templateUrl: 'client/bancos/pagos/filter.html',
            controller: 'Bancos_Pagos_Filter_Controller',
            params: { 'origen': null, },
            parent: 'bancos.pagos'
        })
        .state('bancos.pagos.lista', {
            url: '/lista?origen&pageNumber',
            templateUrl: 'client/bancos/pagos/lista.html',
            controller: 'Bancos_Pagos_List_Controller',
            params: { 'origen': null, 'limit': null, },
            parent: 'bancos.pagos'
        })
        .state('bancos.pagos.pago', {
            url: '/pagos?origen&id&limit&vieneDeAfuera&proveedorID',
            templateUrl: 'client/bancos/pagos/pago.html',
            controller: 'Bancos_Pagos_Pago_Controller',
            params: { 'origen': null, 'id': null, 'limit': null, 'vieneDeAfuera': null, 'proveedorID': null, },
            parent: 'bancos.pagos'
        })

        // -------------------------------------------------------------------------------------------
        // conciliación bancaria
        .state('bancos.conciliacionesBancarias', {
            url: '/conciliacionesBancarias',
            templateUrl: 'client/bancos/conciliacionBancaria/conciliacionesBancarias.html',
            controller: 'Bancos_ConciliacionesBancarias_Controller',
            parent: 'bancos'
        })
        .state('bancos.conciliacionesBancarias.filter', {
            url: '/filter?origen',
            templateUrl: 'client/bancos/conciliacionBancaria/filter.html',
            controller: 'Bancos_ConciliacionesBancarias_Filter_Controller',
            params: { 'origen': null, },
            parent: 'bancos.conciliacionesBancarias'
        })
        .state('bancos.conciliacionesBancarias.lista', {
            url: '/lista?origen&limit',
            templateUrl: 'client/bancos/conciliacionBancaria/lista.html',
            controller: 'Bancos_ConciliacionesBancarias_List_Controller',
            params: { 'origen': null, 'limit': null, },
            parent: 'bancos.conciliacionesBancarias'
        })
        .state('bancos.conciliacionesBancarias.conciliacionBancaria', {
            url: '/conciliacionBancaria?origen&id&pageNumber&vieneDeAfuera',
            templateUrl: 'client/bancos/conciliacionBancaria/conciliacionBancaria.html',
            controller: 'Bancos_ConciliacionesBancarias_ConciliacionBancaria_Controller',
            params: { 'origen': null, 'id': null, 'limit': null },
            parent: 'bancos.conciliacionesBancarias'
        })

        // -------------------------------------------------------------------------------------------
        // caja chica - reposiciones 
        .state('bancos.cajaChica', {
            url: '/cajaChica',
            templateUrl: 'client/bancos/cajaChica/reposiciones/lista.html',
            controller: 'Bancos_CajaChica_Reposiciones_Controller',
            params: { 'origen': null, },
            parent: 'bancos',
        })

        // -------------------------------------------------------------------------------------------
        // ITF (impuesto transacciones financieras)
        .state('bancos.impuestoTransaccionesFinancieras', {
            url: '/impuestoTransaccionesFinancieras',
            templateUrl: 'client/bancos/impuestoITF/itf.html',
            controller: 'Bancos_ImpuestoITF_Controller',
            parent: 'bancos'
        })
        .state('bancos.impuestoTransaccionesFinancieras.filtro', {
            url: '/filtro',
            templateUrl: 'client/bancos/impuestoITF/itf_filtro.html',
            controller: 'Bancos_ImpuestoITF_Filtro_Controller',
            parent: 'bancos.impuestoTransaccionesFinancieras'
        })
        .state('bancos.impuestoTransaccionesFinancieras.lista', {
            url: '/lista',
            templateUrl: 'client/bancos/impuestoITF/itf_movimientos.html',
            controller: 'Bancos_ImpuestoITF_Movimientos_Controller',
            parent: 'bancos.impuestoTransaccionesFinancieras'
        })
        .state('bancos.impuestoTransaccionesFinancieras.resultados', {
            url: '/resultados?cantidadMovimientosITFLeidos&cantidadMovimientosITFAgregados',
            templateUrl: 'client/bancos/impuestoITF/itf_resultados.html',
            controller: 'Bancos_ImpuestoITF_resultados_Controller',
            params: { cantidadMovimientosITFLeidos: null, cantidadMovimientosITFAgregados: null },
            parent: 'bancos.impuestoTransaccionesFinancieras'
        })
        .state('bancos.ultimoMesCerrado', {
            url: '/ultimoMesCerrado',
            templateUrl: 'client/bancos/cierres/ultimoMesCerrado/ultimoMesCerrado.html',
            controller: 'Bancos_UltimoMesCerrado_Controller',
            parent: 'bancos'
        })
        .state('bancos.cierre', {
            url: '/cierre',
            templateUrl: 'client/bancos/cierres/cierre/cierre.html',
            controller: 'Bancos_Cierre_Controller',
            parent: 'bancos'
        })
  }
]);
