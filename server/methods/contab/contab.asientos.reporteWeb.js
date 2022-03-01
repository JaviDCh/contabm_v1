

import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

import { Temp_contab_asientos_webReport, Temp_contab_asientos_webReport_config } from '/imports/collections/temp/contab.asientos.webReport.js';
import { TimeOffset } from '/globals/globals'; 

// grabamos los asientos seleccionados por el usuario a collections en mongo y abrimos una página en ContabSysNet que
// lee este collection y construye un (asp.net) report
Meteor.methods(
{
    'contab.asientos.reporteWeb': function (reportConfig)
    {
        // check(ciaSeleccionada, {
        //     numero: Number,
        //     nombre: String,
        // });

        // TODO: debemos chequear también config !!! (desde (r), hasta (r), fecha (r), subTitulo (opc), saltoPaginaPorFecha (opc))
        // TODO: leer check en Meteor Chef para conocer mejor acerca de 'check' ...

        if (!this.userId) {
            throw new Meteor.Error('500', `Debe hacer un <em>login</em> antes de intentar ejecutar esta función.`);
        }

        // eliminamos el contenido que pueda existir en mongo para el usuario específico
        Temp_contab_asientos_webReport_config.remove({ user: this.userId });
        Temp_contab_asientos_webReport.remove({ user: this.userId });

        // grabamos el nuevo reportConfig; el reportConfig es un objeto que luego usa el proceso (asp.net?) que genera el reporte para
        // conocer 'metadata' como: período, cia contab, titulo, etc.
        Temp_contab_asientos_webReport_config.insert({ _id: new Mongo.ObjectID()._str, reportConfig: reportConfig, user: this.userId });

        // leemos los asientos contables que el usuario seleccionó al consultar los asientos
        let asientosSeleccionados = Temp_Consulta_AsientosContables.find({ user: this.userId, }, { fields: { numeroAutomatico: 1 }}).fetch();

        if (!asientosSeleccionados || !asientosSeleccionados.length) {
            return {
                error: true,
                message: 'No existen registros para construir el reporte. Ud. debe seleccionar registros antes de intentar obtener este reporte.'
            }
        }

        let where = `a.Cia = ${reportConfig.ciaNumero}`;
        let numeroAutomaticoLista = "";

        asientosSeleccionados.forEach((a) => {
            if (!numeroAutomaticoLista)
                numeroAutomaticoLista = `(${a.numeroAutomatico}`;
            else
                numeroAutomaticoLista += `, ${a.numeroAutomatico}`;
        });

        numeroAutomaticoLista += ")";
        where += ` and (a.NumeroAutomatico In ${numeroAutomaticoLista})`;

        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)
        let query = `Select m.Descripcion as nombreMoneda, m.Simbolo as simboloMoneda, a.Fecha as fecha, a.Numero as numero,
                     a.Descripcion as descripcionComprobante, d.Partida as numeroPartida,
            		 c.Cuenta as cuentaContable, c.CuentaEditada as cuentaEditada, c.Descripcion as nombreCuenta,
                     d.Descripcion as descripcionPartida, d.Referencia as referencia, d.Debe as debe, d.Haber as haber
                     From dAsientos d Inner Join Asientos a On a.NumeroAutomatico = d.NumeroAutomatico
                     Inner Join CuentasContables c On d.CuentaContableID = c.ID
                     Inner Join Monedas m On a.Moneda = m.Moneda
                     Where ${where}
                    `;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 50);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contab.listadoAsientos.webReport.reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'contab.listadoAsientos.webReport' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((asientoContable) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields adicionales que existen en mongo ...
            // let asientoContable = _.cloneDeep(item.dataValues);
            asientoContable._id = new Mongo.ObjectID()._str;
            asientoContable.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:30, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();

            Temp_contab_asientos_webReport.insert(asientoContable);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab.listadoAsientos.webReport.reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'contab.listadoAsientos.webReport' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab.listadoAsientos.webReport.reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'contab.listadoAsientos.webReport' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // construimos un link para obtener el reporte
        const contabSysNet_app_address = Meteor.settings.public.contabSysNet_app_address;

        // nótese que no pasamos una 'cia' correcta, pues el reporte (asp.net) la leera desde el collection '..._config' ...
        const reportLink = `${contabSysNet_app_address}/ReportViewer4.aspx?user=${Meteor.userId()}&report=listadoAsientos_webReport&cia=-999`;

        return {
            error: false,
            message: `En total, se han seleccionado <b>${cantidadRecs.toString()}</b> registros para construir el reporte.<br />
                      Ud. debe hacer un <em>click</em> en el <em>link</em> <b>que se muestra abajo</b>, para obtener el reporte.
                     `,
            reportLink: reportLink,
        }
    }
});
