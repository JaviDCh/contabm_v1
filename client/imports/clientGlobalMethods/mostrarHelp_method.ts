

export function mostrarHelp(currentStateName) {
    // abrimos un página, en un tab separado, que muestra un help para el state actual.
    // NOta: normalmente, el help para cada state será un post en el blog que mantenemos para contab ...
    switch (currentStateName) {
        case 'bancos.impuestoTransaccionesFinancieras':
        case 'bancos.impuestoTransaccionesFinancieras.filtro':
        case 'bancos.impuestoTransaccionesFinancieras.lista':
        case 'bancos.impuestoTransaccionesFinancieras.resultados': {
          window.open('https://smrsoftware.wordpress.com/2016/03/29/bancos-impuesto-a-las-transacciones-financieras/', '_blank');
          break;
        }
        case 'contab.filtrosConsultasContab': {
          window.open('https://smrsoftware.wordpress.com/2016/06/11/filtros-definidos-para-usuarios/', '_blank');
          break;
        }
        case 'contab.codificacionesContables': {
          window.open('https://smrsoftware.wordpress.com/2016/03/30/contab-codificaciones-contables/', '_blank');
          break;
        }
        case 'contab.consulta_codificacionesContables.copiarInfoContable': {
          window.open('https://smrsoftware.wordpress.com/2016/04/07/contab-codificaciones-contables-copiar-info-contab/', '_blank');
          break;
        }
        case 'contab.consulta_codificacionesContables.prepararDatos': {
          window.open('https://smrsoftware.wordpress.com/2016/04/07/contab-codificaciones-contables-preparar-datos/', '_blank');
          break;
        }
        case 'contab.consulta_codificacionesContables.consultas': {
          window.open('https://smrsoftware.wordpress.com/2016/04/07/contab-codificaciones-contables-consulta/', '_blank');
          break;
        }
        case 'contab.cuentasContables': {
          window.open('https://smrsoftware.wordpress.com/2016/08/18/cuentas-contables/', '_blank');
          break;
        }
        case 'contab.reconversionMonetaria': {
          window.open('https://smrsoftware.wordpress.com/2018/05/27/contab-reconversion-monetaria/', '_blank');
          break;
        }
        case 'bancos.ultimoMesCerrado': {
          window.open('https://smrsoftware.wordpress.com/2016/04/20/bancos-ultimo-mes-cerrado/', '_blank');
          break;
        }
        case 'contab.asientosContables.lista': {
          window.open('https://smrsoftware.wordpress.com/2017/02/10/asientos-contables-copia-de-asientos-contables/', '_blank');
          break;
        }
        case 'nomina.diasFeriados': {
          window.open('https://nominadoc.wordpress.com/2017/02/23/nomina-registro-de-dias-feriados/', '_blank');
          break;
        }
        case 'administracion.utilitarios.eliminarCompaniasContab': {
          window.open('https://smrsoftware.wordpress.com/2017/05/31/contabm-como-eliminar-una-compania/', '_blank');
          break;
        }
        case 'bancos.conciliacionesBancarias':
        case 'bancos.conciliacionesBancarias.filter':
        case 'bancos.conciliacionesBancarias.lista':
        case 'bancos.conciliacionesBancarias.conciliacionBancaria': {
          window.open('https://smrsoftware.wordpress.com/2013/10/18/bancosconciliacin-bancaria/', '_blank');
          break;
        }
        case 'contab.cierre': {
          window.open('https://smrsoftware.wordpress.com/2017/07/26/cierre-contable/', '_blank');
          break;
        }
        case 'contab.consulta_saldos.filtro': {
          window.open('https://smrsoftware.wordpress.com/2017/08/06/contab-saldos-contables-consulta/', '_blank');
          break;
        }
        case 'contab.consulta_saldos.lista': {
          window.open('https://smrsoftware.wordpress.com/2017/08/06/contab-saldos-contables-consulta/', '_blank');
          break;
        }
        case 'bancos.facturas.filter':
        case 'bancos.facturas.lista':
        case 'bancos.facturas.factura': {
          window.open('https://smrsoftware.wordpress.com/2018/05/15/facturas/', '_blank');
          break;
        }
        case 'bancos.movimientosBancarios':
        case 'bancos.movimientosBancarios.filter':
        case 'bancos.movimientosBancarios.lista':
        case 'bancos.movimientosBancarios.movimientoBancario': {
          window.open('https://smrsoftware.wordpress.com/2014/04/08/bancosregistro-de-movimientos/', '_blank');
          break;
        }



        case 'bancos.CopiarCatalogos':
        case 'contab.CopiarCatalogos':
        case 'nomina.CopiarCatalogos': {
          window.open('https://smrsoftware.wordpress.com/2018/11/24/copiar-catalogos/', '_blank');
          break;
        }




        default:
    }
}