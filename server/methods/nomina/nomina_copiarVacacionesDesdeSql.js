
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    nomina_generales_copiarVacacionesDesdeSqlServer: function (ciaContab) {
        check(ciaContab, Number);

        // si ya existen vacaciones para la cia contab seleccionada, terminamos ...
        let vacacionesMongo = Vacaciones.find({ cia: ciaContab }).count();

        if (vacacionesMongo > 0)
            throw new Meteor.Error(
                `proceso-ya-ejecutado-antes`,
                `Error: aparentemente, este proceso ya ha sido ejecutado antes, pues existen vacaciones registradas.
                        Ahora existen ${vacacionesMongo.toString()} vacaciones registradas en la base de datos.
                       `
            );


        let query = `Select v.* From Vacaciones v Inner Join tEmpleados e On v.Empleado = e.Empleado
                     Where e.Cia = ?
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query,
                {
                    replacements: [ ciaContab ],
                    type: sequelize.QueryTypes.SELECT
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.length == 0) {
            throw new Meteor.Error(
                `cero-registros-leidos`,
                `Error: no hemos podido leer vacaciones para la compañía Contab seleccionda.`
            );
        };

        response.result.forEach((vacacion) => {

            let vacacionMongo = {
                _id: new Mongo.ObjectID()._str,

                     // id en contab (no se usará más en mongo)
                    claveUnicaContab: vacacion.ClaveUnica,

                    // datos del empleado
                    empleado: vacacion.Empleado,
                    grupoNomina: vacacion.GrupoNomina,
                    sueldo: vacacion.Sueldo,

                    // disfrute de las vacaciones
                    salida: vacacion.Salida ? moment(vacacion.Salida).add(TimeOffset, 'hours').toDate() : null,
                    regreso: vacacion.Regreso ? moment(vacacion.Regreso).add(TimeOffset, 'hours').toDate() : null,
                    fechaReintegro: vacacion.FechaReintegro ? moment(vacacion.FechaReintegro).add(TimeOffset, 'hours').toDate() : null,
                    cantDiasDisfrute_Feriados: vacacion.CantDiasDisfrute_Feriados,
                    cantDiasDisfrute_SabDom: vacacion.CantDiasDisfrute_SabDom,
                    cantDiasDisfrute_Habiles: vacacion.CantDiasDisfrute_Habiles,
                    cantDiasDisfrute_Total: vacacion.CantDiasDisfrute_Total,

                    // pago de las vacaciones
                    periodoPagoDesde: vacacion.PeriodoPagoDesde ? moment(vacacion.PeriodoPagoDesde).add(TimeOffset, 'hours').toDate() : null,
                    periodoPagoHasta: vacacion.PeriodoPagoHasta ? moment(vacacion.PeriodoPagoHasta).add(TimeOffset, 'hours').toDate() : null,
                    cantDiasPago_Feriados: vacacion.CantDiasPago_Feriados,
                    cantDiasPago_SabDom: vacacion.CantDiasPago_SabDom,
                    cantDiasPago_Habiles: vacacion.CantDiasPago_Habiles,
                    cantDiasPago_YaTrabajados: vacacion.CantDiasPago_YaTrabajados,
                    cantDiasPago_Total: vacacion.CantDiasPago_Total,
                    cantDiasPago_Bono: vacacion.CantDiasPago_Bono,
                    montoBono: vacacion.MontoBono,
                    aplicarDeduccionesFlag: vacacion.AplicarDeduccionesFlag,
                    cantDiasDeduccion: vacacion.CantDiasDeduccion,

                    // nómina en la cual se aplicará la vacación
                    fechaNomina: vacacion.FechaNomina ? moment(vacacion.FechaNomina).add(TimeOffset, 'hours').toDate() : null,
                    obviarEnLaNominaFlag: vacacion.ObviarEnLaNominaFlag,
                    desactivarNominaDesde: vacacion.DesactivarNominaDesde ? moment(vacacion.DesactivarNominaDesde).add(TimeOffset, 'hours').toDate() : null,
                    desactivarNominaHasta: vacacion.DesactivarNominaHasta ? moment(vacacion.DesactivarNominaHasta).add(TimeOffset, 'hours').toDate() : null,

                    // próxima nómima (normal) de pago (al regreso)
                    proximaNomina_FechaNomina: vacacion.ProximaNomina_FechaNomina ? moment(vacacion.ProximaNomina_FechaNomina).add(TimeOffset, 'hours').toDate() : null,
                    proximaNomina_AplicarDeduccionPorAnticipo: vacacion.ProximaNomina_AplicarDeduccionPorAnticipo,
                    proximaNomina_AplicarDeduccionPorAnticipo_CantDias: vacacion.ProximaNomina_AplicarDeduccionPorAnticipo_CantDias,
                    proximaNomina_AplicarDeduccionesLegales: vacacion.ProximaNomina_AplicarDeduccionesLegales,
                    proximaNomina_AplicarDeduccionesLegales_CantDias: vacacion.ProximaNomina_AplicarDeduccionesLegales_CantDias,
                    // datos del año de la vacación
                    anoVacaciones: vacacion.AnoVacaciones,
                    numeroVacaciones: vacacion.NumeroVacaciones,
                    anoVacacionesDesde: vacacion.AnoVacacionesDesde ? moment(vacacion.AnoVacacionesDesde).add(TimeOffset, 'hours').toDate() : null,
                    anoVacacionesHasta: vacacion.AnoVacacionesHasta ? moment(vacacion.AnoVacacionesHasta).add(TimeOffset, 'hours').toDate() : null,

                    // datos para el control de días pendientes
                    cantDiasVacPendAnosAnteriores: vacacion.CantDiasVacPendAnosAnteriores,
                    cantDiasVacSegunTabla: vacacion.CantDiasVacSegunTabla,
                    cantDiasVacDisfrutadosAntes: vacacion.CantDiasVacDisfrutadosAntes,
                    cantDiasVacDisfrutadosAhora: vacacion.CantDiasVacDisfrutadosAhora,
                    cantDiasVacPendientes: vacacion.CantDiasVacPendientes,

                    cia: ciaContab,              // no existía en Contab
            };


            Vacaciones.insert(vacacionMongo, (err, _id) => {
                if (err)
                    throw new Meteor.Error("insert-error",
                    `Ha ocurrido un error al intentar ejecutar un insert en 'vacaciones': ${err.toString()}`);
            });
        });

        return `Ok, las vacaciones han sido copiadas en forma exitosa desde sql server.<br />
        En total, se han leído y copiado ${numeral(response.result.length).format('0,0')} vacaciones desde sql server.
        `;
    }
});
