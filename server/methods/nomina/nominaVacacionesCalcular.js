

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    nominaVacacionesCalcular: function (vacacion0) {

        check(vacacion0, String);

        let vacacion = JSON.parse(vacacion0);

        check(vacacion, Object);

        if (!vacacion.empleado)
            throw new Meteor.Error("error-validacion", "La vacación debe corresponder a un empleado.");

        if (!vacacion.salida || !vacacion.regreso)
            throw new Meteor.Error("error-validacion", "La vacación debe tener fechas de salida y regreso.");

        if (vacacion.periodoPagoDesde || vacacion.periodoPagoHasta) {
            if (vacacion.periodoPagoDesde && vacacion.periodoPagoHasta) {
                if (moment(vacacion.periodoPagoDesde).isValid() && moment(vacacion.periodoPagoHasta).isValid()) {
                    vacacion.periodoPagoDesde = moment(vacacion.periodoPagoDesde).toDate();
                    vacacion.periodoPagoHasta = moment(vacacion.periodoPagoHasta).toDate();
                }
                else {
                    throw new Meteor.Error("error-validacion", "El período de pago no está correctamente construido.");
                }
            }
            else {
                throw new Meteor.Error("error-validacion", "El período de pago no está correctamente construido.");
            };
        };

        if (!vacacion.cia)
            throw new Meteor.Error("error-validacion", "La vacación debe corresponder a una <em>Cia Contab</em>.");


        vacacion.salida = moment(vacacion.salida).toDate();
        vacacion.regreso = moment(vacacion.regreso).toDate();

        // lo primero que hacemos es intentar leer el sueldo del empleado, más cercano a la fecha de 'salida'
        let response = null;
        response = Async.runSync(function(done) {
            Empleados_sql.findAll({ where: { empleado: vacacion.empleado },
                include: [
                    { model: EmpleadosSueldo_sql, as: 'sueldos', }
                ],
                // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let empleado = response.result[0].dataValues;

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!empleado)
            throw new Meteor.Error("database-error", "Error inesperado: el empleado no pudo ser leído en la base de datos.");

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        empleado.fechaIngreso = empleado.fechaIngreso ? moment(empleado.fechaIngreso).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaRetiro = empleado.fechaRetiro ? moment(empleado.fechaRetiro).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaNacimiento = empleado.fechaNacimiento ? moment(empleado.fechaNacimiento).add(TimeOffset, 'hours').toDate() : null;

        empleado.sueldos.forEach((x) => {
            x.desde = x.desde ? moment(x.desde).add(TimeOffset, 'hours').toDate() : null;
        });

        // regresamos no solo el sueldo, también la fecha de ingreso del empleado ...
        vacacion.fechaIngreso = empleado.fechaIngreso;

        let sueldo = lodash(empleado.sueldos).
                     orderBy([ 'desde' ], [ 'desc' ]).
                     first((x) => { x.desde <= vacacion.salida; });

        if (sueldo && sueldo.dataValues && sueldo.dataValues.sueldo)
            vacacion.sueldo = sueldo.dataValues.sueldo;
        else
            throw new Meteor.Error("error-validacion",
                                   `No hemos podido leer un sueldo para el empleado que
                                    corresponda a la fecha de salida (${moment(empleado.salida).format('DD-MM-YYYY')}).`);

        // ---------------------------------------------------------------------------------------------------------
        // intentamos leer el grupo de nómina del empleado desde los encabezados de nómina
        let query = '';
        query = `Select Top(1) h.GrupoNomina as grupoNomina
                        From tNominaHeaders h Inner Join tNomina n On h.ID = n.HeaderID
                        Where n.Empleado = ? And h.FechaNomina <= ?
                        Order By h.FechaNomina Desc
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [
                vacacion.empleado,
                moment(vacacion.regreso).format('YYYY-MM-DD'),
            ],
                type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let grupoNomina = null;
        lodash.forEach(response.result, (x) => {
            grupoNomina = x.grupoNomina ? x.grupoNomina : null;
            return false;           // exit forEach
        });

        if (grupoNomina)
            vacacion.grupoNomina = grupoNomina;
        else
            throw new Meteor.Error("error-validacion",
                                   `No hemos podido leer un grupo de nómina que contenga al empleado de esta vacación.
                                    Cada empleado debe corresponder a un grupo de nómina.`);

        let result = {};

        // -----------------------------------------------------------------------------------------------
        // calculamos la cantidad de días entre salida y regreso
        // NOTA IMPORTANTE: en realidad, determinamos ANTES el regreso y luego la cantidad de feriados y
        // fines de semana entre salida y reintegro (y no regreso)
        vacacion.fechaReintegro = moment(vacacion.regreso).add(1, 'days').toDate();

        result = NominaFunctions.fechaEsDiaFeriado(vacacion.fechaReintegro);

        if (result.error) {
            throw new Meteor.Error("error-validación", result.errMessage);
        };

        while (result.esFeriado) {
            vacacion.fechaReintegro = moment(vacacion.fechaReintegro).add(1, 'days').toDate();
            result = NominaFunctions.fechaEsDiaFeriado(vacacion.fechaReintegro);

            if (result.error) {
                throw new Meteor.Error("error-validación", result.errMessage);
            };
        };

        result = NominaFunctions.cantDiasFeriadosEnPeriodo(vacacion.salida, vacacion.fechaReintegro);

        if (result.error) {
            throw new Meteor.Error("error-validación", result.errMessage);
        };

        vacacion.cantDiasDisfrute_Feriados = result.cantDiasFeriados;
        vacacion.cantDiasDisfrute_SabDom = result.cantSabDom;
        // -----------------------------------------------------------------------------------------------

        // -----------------------------------------------------------------------------------------------
        // calculamos la cantidad de días del período de pago (si existe uno!)
        if (vacacion.periodoPagoDesde) {

            result = NominaFunctions.cantDiasFeriadosEnPeriodo(vacacion.periodoPagoDesde, vacacion.periodoPagoHasta);

            if (result.error) {
                throw new Meteor.Error("error-validación", result.errMessage);
            };

            vacacion.cantDiasPago_Feriados = result.cantDiasFeriados;
            vacacion.cantDiasPago_SabDom = result.cantSabDom;
        };

        // ---------------------------------------------------------------------------------------------------------------
        // determinamos el año de vacaciones del empleado; para hacerlo, tomamos el año *anterior* del empleado en la empresa;
        // por ejemplo: si un empleado toma las vacaciones en su 4to año, asumimos que corresponden a su 3er. año en la empresa
        // (recuérdese que el 1er. año no hay vacaciones)

        vacacion.anoVacacionesDesde = null;
        vacacion.anoVacacionesHasta = null;
        vacacion.anoVacaciones = 0;

        let anoVacacionesDesde = empleado.fechaIngreso;
        let anoVacacionesHasta = moment(empleado.fechaIngreso).add(1, 'years').subtract(1, 'days').toDate();
        let anoVacaciones = 0;

        while (vacacion.salida > anoVacacionesHasta) {
             anoVacaciones++;

             vacacion.anoVacacionesDesde = anoVacacionesDesde;
             vacacion.anoVacacionesHasta = anoVacacionesHasta;
             vacacion.anoVacaciones = anoVacaciones;

             anoVacacionesDesde = moment(anoVacacionesDesde).add(1, 'years').toDate();
             anoVacacionesHasta = moment(anoVacacionesDesde).add(1, 'years').subtract(1, 'days').toDate();
         };

         // -------------------------------------------------------------------------------------------------------
         // determinamos si existen vacaciones para el mismo año; de haberlas, se deben reflejar en el campo Número
         // el año actual de vacaciones va desde el añoVacacionesHasta hasta Salida ...
         let cantVacacionesMismoAno = 0;

         if (vacacion.anoVacacionesHasta) {
            cantVacacionesMismoAno =
            Vacaciones.find({ salida: { $lt: vacacion.salida },
                              salida: { $gte: vacacion.anoVacacionesHasta },
                              empleado: vacacion.empleado,
                              _id: { $ne: vacacion._id }
                          }).count();
         };

         vacacion.numeroVacaciones = 1;
         vacacion.numeroVacaciones += cantVacacionesMismoAno;

         // -------------------------------------------------------------------------------------------------------
         // determinamos la cantidad de días de bono y de vacaciones (disfrute) que se han definido en las
         // tablas respectivas (VacacPorAnoParticulares y VacacPorAnoGenericas)
         result = NominaFunctions.determinarDiasVacacionesYBono(empleado.empleado, vacacion.anoVacaciones);

         if (result.error) {
             throw new Meteor.Error("error-validación", result.errMessage);
         };

         vacacion.cantDiasPago_Bono = result.cantDiasBono;
         vacacion.cantDiasVacSegunTabla = result.cantDiasVacacionesSegunTabla;

         // -------------------------------------------------------------------------------------------------------
         // determinamos el monto del bono vacacional
         result = NominaFunctions.determinarMontoBonoVacacional(empleado, vacacion.sueldo, vacacion.cantDiasPago_Bono);

         if (result.error) {
             throw new Meteor.Error("error-validación", result.errMessage);
         };

         // como ahora regresamos la base para el cálculo del bono, no lo calculamos aquí; más bien, lo hacemos
         // al regresar, en el client
         // vacacion.montoBono = result.montoBonoVacacional;

         // la base para el calculo del bono del empleado es su sueldo más cestatickets y un monto adicional; todo ésto,
         // se parametriza en la maestra de empleados ...
         vacacion.baseBonoVacacional = result.baseBonoVacacional;

         // ---------------------------------------------------------------------------------------------------------------
         // calculamos la fecha de la próxima nómina y la cantidad de días que se deben descontar de anticipo en esa nómina
         // nótese como necesitamos saber si las nóminas del empleado son quincenales (1) o mensuales (2) ...
         if (empleado.tipoNomina == 1 || empleado.tipoNomina == 2) {        // tipo nómina: 1: quinc / 2: mensual
             result = NominaFunctions.determinarFechaProximaNomina(empleado.tipoNomina, vacacion.regreso);

             if (result.error) {
                 throw new Meteor.Error("error-validación", result.errMessage);
             };

             vacacion.proximaNomina_FechaNomina = result.fechaProxNomina;

             // para calcular los días de anticipo que se deben descontar en la próxima nómina,
             // debemos determinar la fecha de la nómina
             // justo anterior al regreso de las vacaciones; la cantidad de días de descuento son los
             // días que van desde esa nómina hasta el regreso de las vacaciones ...

             result = NominaFunctions.determinarFechaNominaAnterior(empleado.tipoNomina, vacacion.regreso);

             if (result.error) {
                 throw new Meteor.Error("error-validación", result.errMessage);
             };

             let cantidadDiasDescontarProxNomina =
                 moment(vacacion.regreso).diff(moment(result.fechaNominaAnterior), 'days');

             vacacion.proximaNomina_AplicarDeduccionPorAnticipo_CantDias = cantidadDiasDescontarProxNomina;

             if (cantidadDiasDescontarProxNomina > 0)
                 vacacion.proximaNomina_AplicarDeduccionPorAnticipo = true;
         };


         // --------------------------------------------------------------------------------------------------
         // determinamos la cantidad de días pendientes en años anteriores; nótese como buscamos la
         // vacación más reciente que exista *antes* de anoVacacionesHasta
         vacacion.cantDiasVacPendAnosAnteriores = 0;
         let vacacionMasRecienteAnosAnteriores = {};

         if (vacacion.anoVacacionesHasta)
             vacacionMasRecienteAnosAnteriores = Vacaciones.findOne({
                                                     salida: { $lte: vacacion.anoVacacionesHasta },
                                                     empleado: vacacion.empleado,
                                                 },
                                                 { sort: { salida: -1 }
             });


         if (vacacionMasRecienteAnosAnteriores != null)
             vacacion.cantDiasVacPendAnosAnteriores = vacacionMasRecienteAnosAnteriores.cantDiasVacPendientes;

         // --------------------------------------------------------------------------------------------------
         // determinamos la cantidad de días pendientes este mismo año; nótese que las vacaciones que puedan
         // existir para este mismo año ocurren a partir de anoVacacionesHasta y hasta Salida ...

         vacacion.cantDiasVacDisfrutadosAntes = 0;

         if (vacacion.anoVacacionesHasta) {
             query = Vacaciones.find({ $and: [
                                                { salida: { $gt: vacacion.anoVacacionesHasta }},
                                                { salida: { $lt: vacacion.salida }},
                                             ],
                                       _id: { $ne: vacacion._id },
                                       empleado: { $eq: vacacion.empleado },
                                     }).fetch();

             query.forEach((v) => {
                 vacacion.cantDiasVacDisfrutadosAntes +=
                    lodash.isNumber(v.cantDiasVacDisfrutadosAhora) ? v.cantDiasVacDisfrutadosAhora : 0;
             });
         };

        //  vacacion.cantDiasVacDisfrutadosAhora = vacacion.cantDiasDisfrute_Habiles;

         vacacion.fechaNomina = vacacion.salida;

         vacacion.obviarEnLaNominaFlag = true;
         vacacion.desactivarNominaDesde = vacacion.salida;
         vacacion.desactivarNominaHasta = vacacion.regreso;

        return JSON.stringify(
            {
                message: `Ok, la vacación ha sido calculada.`,
                vacacion: vacacion,
                empleado: empleado.dataValues
            });
    },


    // --------------------------------------------------------------------------------------------------
    'nomina.vacaciones.grabarRegistroNomina': function (vacacion) {
        let response = {};

        // ----------------------------------------------------------------------------------------
        // el empleado debe existir en el grupo de nómina indicado para el mismo ...
        response = Async.runSync(function(done) {
            GruposEmpleados_sql.findAndCountAll(
                {
                    where: {
                        cia: vacacion.cia,
                        grupoNominaFlag: true,
                    },
                    include: [
                        { model: GruposEmpleados_Empleados_sql,
                          as: 'empleados',
                          where: {
                              empleado: vacacion.empleado,
                              suspendidoFlag: false,
                          },
                        },
                    ],
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.count === 0) {
            throw new Meteor.Error("error-validacion",
                                   `Error: aparentemente, el empleado no existe en el <em>grupo de nómina</em>
                                    que se ha indicado para el mismo. Por favor revise y corrija esta situación.`);

        };


        // ----------------------------------------------------------------------------------------
        // la vacación no debe tener ahora un registro de nómina
        response = Async.runSync(function(done) {
            NominaHeaders_sql.count(
                {
                    where: {
                        provieneDe: "Vacaciones",
                        provieneDe_ID: vacacion.claveUnicaContab,
                    },
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result > 0) {
            throw new Meteor.Error("error-validacion",
                                   `Error: ya existe un registro de nómina para esta vacación.<br />
                                    Si Ud. desea agregarlo nuevamente, debe eliminar el que ahora existe.`);

        };

        // ----------------------------------------------------------------------------------------
        // Ok, el registro no existe; lo agregamos
        let nominaHeader = {
            // id:
            fechaNomina: vacacion.fechaNomina,
            fechaEjecucion: new Date(),
            grupoNomina: vacacion.grupoNomina,
            desde: vacacion.periodoPagoDesde,
            hasta: vacacion.periodoPagoHasta,
            cantidadDias: vacacion.cantDiasPago_Total,
            tipo: "V",
            agregarSueldo: true,
            agregarDeduccionesObligatorias: vacacion.aplicarDeduccionesFlag ? true : false,
            provieneDe: "Vacaciones",
            provieneDe_ID: vacacion.claveUnicaContab,
        };

        response = Async.runSync(function(done) {
            NominaHeaders_sql.create(nominaHeader, { raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });


        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        return {
                message: `Ok, se ha agregado un registro de nómina al proceso de nómina, para esta vacación.
                          <br />
                          Ud. puede ahora ejecutar el proceso de nómina de pago, justamente, para este
                          registro, para ejecutar el proceso de nómina para esta vacación.
                          `
            };

    },
});
