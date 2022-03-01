
import numeral from 'numeral';
import { Monedas } from '/imports/collections/monedas';
import { Monedas_sql } from '/server/imports/sqlModels/monedas';
import { Companias } from '/imports/collections/companias';
import { TiposAsientoContable } from '/imports/collections/contab/tiposAsientoContable'; 
import { Compania_sql } from '/server/imports/sqlModels/companias'; 
import { GruposContables } from '/imports/collections/contab/gruposContables'; 
import { MesesDelAnoFiscal } from '/imports/collections/contab/mesesAnoFiscal'; 

Meteor.methods(
{
    'contab.CopiarCatalogos': function () {

        let response = null;

        // ---------------------------------------------------------------------------------------------------
        // Compañías (empresas usuarias) - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Compania_sql.findAndCountAll( { raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.count;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 10;
        let currentProcess = 1;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Companias.findOne({ numero: item.numero }, { fields: { _id: true }});

            let compania = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                numero: item.numero,
                nombre: item.nombre,
                nombreCorto: item.nombreCorto,
                abreviatura: item.abreviatura,
                rif: item.rif,
                direccion: item.direccion,
                entidadFederal: item.entidadFederal,
                zonaPostal: item.zonaPostal,
                telefono1: item.telefono1,
                telefono2: item.telefono2,
                fax: item.fax,

                emailServerName: item.emailServerName,
                emailServerPort: item.emailServerPort, 
                emailServerSSLFlag: item.emailServerSSLFlag,
                emailServerCredentialsUserName: item.emailServerCredentialsUserName,
                emailServerCredentialsPassword: item.emailServerCredentialsPassword,

                monedaDefecto: item.monedaDefecto,
                suspendidoFlag: item.suspendidoFlag, 
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                Companias.update({ _id: itemExisteID._id }, { $set: compania });
            else
                Companias.insert(compania);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });



        // ---------------------------------------------------------------------------------------------------
        // Monedas - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        // debugger;
        response = Async.runSync(function(done) {
            Monedas_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = Monedas.findOne({ moneda: item.moneda }, { fields: { _id: true }});

            let moneda = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                moneda: item.moneda,
                descripcion: item.descripcion,
                simbolo: item.simbolo,
                nacionalFlag: item.nacionalFlag,
                defaultFlag: item.defaultFlag,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id) {
                Monedas.update({ _id: itemExisteID._id }, { $set: moneda });
            }
            else {
                Monedas.insert(moneda);
            }

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // ---------------------------------------------------------------------------------------------------
        // Cuentas contables - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            CuentasContables_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        // si el usuario eliminó items en sql server, la idea es que se eliminen también aquí; usamos el field existeEnOrigen
        // para saber cuales items no existen y eliminarlos en mongo ...
        CuentasContables.update({ }, { $set: { existeEnOrigen: false }}, { multi: true, });


        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = CuentasContables.findOne({ id: item.id }, { fields: { _id: true }});

            let cuentaContable = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                id: item.id,
                cuenta: item.cuenta,
                descripcion: item.descripcion,

                totDet: item.totDet,
                nivel1: item.nivel1,
                nivel2: item.nivel2,
                nivel3: item.nivel3,
                nivel4: item.nivel4,
                nivel5: item.nivel5,
                nivel6: item.nivel6,
                nivel7: item.nivel7,

                numNiveles: item.numNiveles,

                totDet: item.totDet,
                actSusp: item.actSusp,
                cuentaEditada: item.cuentaEditada,
                grupo: item.grupo,
                cia: item.cia,
                existeEnOrigen: true,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id) {
                // solo para 'dumb collections' (como cuentas contables); no podemos hacer update; solo remove/insert ...
                CuentasContables.remove({ _id: itemExisteID._id });
                CuentasContables.insert(cuentaContable);
            }
            else
                CuentasContables.insert(cuentaContable);


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        // al final, los registros que no existen en sql server son eliminados en mongo ...
        CuentasContables.remove({ existeEnOrigen: false });


        // ---------------------------------------------------------------------------------------------------
        // Grupos contables - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            GruposContables_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = GruposContables.findOne({ grupo: item.grupo }, { fields: { _id: true }});

            let grupoContable = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                grupo: item.grupo,
                descripcion: item.descripcion,
                ordenBalanceGeneral: item.ordenBalanceGeneral,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                GruposContables.update({ _id: itemExisteID._id }, { $set: grupoContable });
            else
                GruposContables.insert(grupoContable);


            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Tipos de asiento - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            TiposAsiento_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = TiposAsientoContable.findOne({ tipo: item.tipo }, { fields: { _id: true }});

            let tipoAsiento = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                grupo: item.grupo,
                tipo: item.tipo,
                descripcion: item.descripcion,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                TiposAsientoContable.update({ _id: itemExisteID._id }, { $set: tipoAsiento });
            else
                TiposAsientoContable.insert(tipoAsiento);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Meses del año fiscal - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            MesesDelAnoFiscal_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 20);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;
        EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id del doc que existe ...

            let itemExisteID = MesesDelAnoFiscal.findOne({ id: item.id }, { fields: { _id: true }});

            let document = {
                _id: itemExisteID ? itemExisteID._id : new Mongo.ObjectID()._str,
                id: item.id,
                mesFiscal: item.mesFiscal,
                mesCalendario: item.mesCalendario,
                nombreMes: item.nombreMes,
                ano: item.ano,
                cia: item.cia,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si el doc fue encontrado arriba
            if (itemExisteID && itemExisteID._id)
                MesesDelAnoFiscal.update({ _id: itemExisteID._id }, { $set: document });
            else
                MesesDelAnoFiscal.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_copiarCatalogos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'copiarCatalogos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los catálogos han sido cargados desde <em>Contab</em> en forma satisfactoria.";
    }
});
