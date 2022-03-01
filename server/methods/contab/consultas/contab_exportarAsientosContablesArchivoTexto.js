
import moment from 'moment';
import numeral from 'numeral';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    exportarAsientosContablesAArchivoTexto: function () {

        let filtro = {};

        let asientosContablesSeleccionados = Temp_Consulta_AsientosContables.find({ user: this.userId },
                                                                                  { fields: { numeroAutomatico: 1, }}).
                                                                             fetch();

        let lista = [];

        if (_.isArray(asientosContablesSeleccionados) && asientosContablesSeleccionados.length > 0) {
            asientosContablesSeleccionados.forEach((a) => {
                lista.push(a.numeroAutomatico);
            });

            filtro.NumeroAutomatico = { $in: lista };
        };

        // ---------------------------------------------------------------------------------------------------
        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({
                where: filtro,
                raw: true,
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_AsientosContables2.remove({ user: this.userId });

        if (!response.result.length) {
            return "Cero registros han sido leídos desde la base de datos en el servidor.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_exportarArchivoTexto_reportProgress',
                            { myuserId: this.userId, app: 'contab',
                              process: 'leerAsientosDesdeSqlServer_exportarArchivoTexto' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((asientoContable) => {

            asientoContable._id = new Mongo.ObjectID()._str;
            asientoContable.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:30, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();
            asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
            asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

            asientoContable.partidas = [];

            response = null;
            response = Async.runSync(function(done) {
                dAsientosContables_sql.findAll({
                    where: { numeroAutomatico: { $eq: asientoContable.numeroAutomatico }},
                    order: [ 'partida' ],
                    include: [
                        { model: CuentasContables_sql,
                        as: 'cuentaContable',
                        attributes: [ 'cuenta' ] }
                    ],
                    raw: true,
                })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            response.result.forEach((p) => {
                delete p.NumeroAutomatico;
                delete p.numeroAutomatico;
                delete p.CuentaContableID;

                // renombramos la propiedad cuentaContable
                p.cuentaContable = p[ 'cuentaContable.cuenta' ];
                delete p[ 'cuentaContable.cuenta' ];

                asientoContable.partidas.push(p);
            })

            Temp_Consulta_AsientosContables2.insert(asientoContable, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            });

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_exportarArchivoTexto_reportProgress',
                                    { myuserId: this.userId, app: 'contab',
                                      process: 'leerAsientosDesdeSqlServer_exportarArchivoTexto' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_exportarArchivoTexto_reportProgress',
                                        { myuserId: this.userId, app: 'contab',
                                          process: 'leerAsientosDesdeSqlServer_exportarArchivoTexto' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los asientos contables han sido leídos desde sql server.";
    }
});
