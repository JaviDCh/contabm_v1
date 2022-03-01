
import numeral from 'numeral';
import { Companias } from '/imports/collections/companias';
import { GruposEmpleados } from '/models/nomina/catalogos'; 
import { GruposEmpleados_empleados } from '/models/nomina/catalogos'; 
import { Empleados } from '/models/nomina/empleados'; 
import { Departamentos_sql } from '/server/imports/sqlModels/nomina/catalogos/departamentos'; 
import { Bancos_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Compania_sql } from '/server/imports/sqlModels/companias'; 
import { Bancos } from '/imports/collections/bancos/bancos';

Meteor.methods(
{
    nomina_CopiarCatalogos: function () {

        let response = null;

        // ---------------------------------------------------------------------------------------------------
        // Compañías (empresas usuarias) - copiamos a mongo desde contab
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Compania_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.count;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 10;
        let currentProcess = 1;

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "nomina_copiarCatalogos_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'nomina', process: 'copiarCatalogos' };
        let eventData = {
                          current: currentProcess, max: numberOfProcess, progress: '0 %',
                          message: `compañías ... `
                        };

        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe;
            // de ser así, usamos el _id del doc que existe ...

            let companiaID = Companias.findOne({ numero: item.numero }, { fields: { _id: true }});

            let compania = {
                _id: companiaID ? companiaID._id : new Mongo.ObjectID()._str,
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

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (companiaID && companiaID._id)
                Companias.update({ _id: compania._id }, { $set: compania });
            else
                Companias.insert(compania);

                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 25) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `compañías ... `
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = {
                                      current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `compañías ... `
                                    };
                        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    };
                };
                // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Bancos - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Bancos_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `bancos ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Bancos.findOne({ banco: item.banco }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                banco: item.banco,
                nombre: item.nombre,
                nombreCorto: item.nombreCorto,
                abreviatura: item.abreviatura,
                codigo: item.codigo,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Bancos.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Bancos.insert(document);

                // -------------------------------------------------------------------------------------------------------
                // vamos a reportar progreso al cliente; solo 20 veces ...
                cantidadRecs++;
                if (numberOfItems <= 25) {
                    // hay menos de 20 registros; reportamos siempre ...
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `bancos ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                }
                else {
                    reportar++;
                    if (reportar === reportarCada) {
                        eventData = {
                                      current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `bancos ...`
                                    };
                        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                        reportar = 0;
                    };
                };
                // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Cargos - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Cargos_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `cargos ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Cargos.findOne({ cargo: item.cargo }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                cargo: item.cargo,
                descripcion: item.descripcion ? item.descripcion : 'Indefinido',
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Cargos.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Cargos.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `cargos ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `cargos ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Departamentos - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Departamentos_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `departamentos ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Departamentos.findOne({ departamento: item.departamento }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                departamento: item.departamento,
                descripcion: item.descripcion ? item.descripcion : 'Indefinido',
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Departamentos.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Departamentos.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `departamentos ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `departamentos ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Paises - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Paises_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `países ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Paises.findOne({ pais: item.pais }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                pais: item.pais,
                descripcion: item.descripcion,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Paises.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Paises.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `países ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `países ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Ciudades - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Ciudades_sql.findAndCountAll({ where: { ciudad: { $ne: '' }}, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `ciudades ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Ciudades.findOne({ ciudad: item.ciudad }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                ciudad: item.ciudad,
                pais: item.pais,
                descripcion: item.descripcion,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Ciudades.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Ciudades.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `ciudades ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `ciudades ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });




        // ---------------------------------------------------------------------------------------------------
        // Parentescos - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Parentescos_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `parentescos ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Parentescos.findOne({ parentesco: item.parentesco }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                parentesco: item.parentesco,
                descripcion: item.descripcion ? item.descripcion : 'Indefinido',
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Parentescos.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Parentescos.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `parentescos ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `parentescos ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Tipos de cuenta bancaria - copiamos a mongo desde sql
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            TiposDeCuentaBancaria_sql.findAndCountAll({ raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `tipos de cuenta bancaria ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // nótese que Bancos se copia con sus agencias y cuentas bancarias si este proceso se hace desde Bancos;
        // en Nómina, solo necesitamos los bancos y solo copiamos éstos ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = TiposDeCuentaBancaria.findOne({ tipoCuenta: item.tipoCuenta }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                tipoCuenta: item.tipoCuenta,
                descripcion: item.descripcion ? item.descripcion : 'Indefinido',
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                TiposDeCuentaBancaria.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                TiposDeCuentaBancaria.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `tipos de cuenta bancaria ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `tipos de cuenta bancaria ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // ---------------------------------------------------------------------------------------------------
        // Empleados - solo para mantener una lista de empleados que podamos monstrar en dropDownLists en las
        // formas
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            Empleados_sql.findAndCountAll(
                {
                    attributes:
                    [ 'empleado', 'nombre', 'cedula', 'alias', 'tipoNomina', 'status', 'edoCivil', 'sexo',
                      'nacionalidad', 'fechaNacimiento', 'situacionActual', 'departamentoID', 'cargoID',
                      'fechaIngreso', 'cia',
                    ],
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `empleados ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // aunque no mantenemos los empleados en mongo, aún lo hacemos directamente desde sql server, si mantenemos
        // una lista en mongo, para dropdownlists en las formas ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = Empleados.findOne({ empleado: item.empleado }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                empleado: item.empleado,
                cedula: item.cedula,
                alias: item.alias,
                tipoNomina: item.tipoNomina,
                status: item.status,
                nombre: item.nombre,
                edoCivil: item.edoCivil,
                sexo: item.sexo,
                nacionalidad: item.nacionalidad,
                fechaNacimiento: item.fechaNacimiento,
                situacionActual: item.situacionActual,
                departamentoID: item.departamentoID,
                cargoID: item.cargoID,
                fechaIngreso: item.fechaIngreso,
                fechaRetiro: item.fechaRetiro,
                cia: item.cia,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                Empleados.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                Empleados.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `empleados ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `empleados ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // -----------------------
        // Grupos de empleados 
        // -----------------------
        response = Async.runSync(function(done) {
            tGruposEmpleados_sql.findAndCountAll()
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `grupos de empleados ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // aunque no mantenemos los empleados en mongo, aún lo hacemos directamente desde sql server, si mantenemos
        // una lista en mongo, para dropdownlists en las formas ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = GruposEmpleados.findOne({ grupo: item.grupoID }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                grupo: item.grupo,
                nombre: item.nombre,
                descripcion: item.descripcion,
                grupoNominaFlag: item.grupoNominaFlag,
                cia: item.cia,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id) { 
                GruposEmpleados.update({ _id: itemExiste_ID._id }, { $set: document });
            }  
            else { 
                GruposEmpleados.insert(document);
            }
                
            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `grupos de empleados ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `grupos de empleados ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        })



        // -----------------------
        // tdGrupposEmpleados
        // -----------------------
        response = Async.runSync(function(done) {
            tdGruposEmpleados_sql.findAndCountAll()
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `empleados en grupos de empleados ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        // aunque no mantenemos los empleados en mongo, aún lo hacemos directamente desde sql server, si mantenemos
        // una lista en mongo, para dropdownlists en las formas ...

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = GruposEmpleados_empleados.findOne({ claveUnica: item.claveUnica }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                claveUnica: item.claveUnica,
                empleado: item.empleado,
                grupo: item.grupo,
                suspendidoFlag: item.suspendidoFlag,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id) { 
                GruposEmpleados_empleados.update({ _id: itemExiste_ID._id }, { $set: document });
            }  
            else { 
                GruposEmpleados_empleados.insert(document);
            }
                
            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `empleados en grupos de empleados ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `empleados en grupos de empleados ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        })



        // ---------------------------------------------------------------------------------------------------
        // Maestra de rubros
        // ---------------------------------------------------------------------------------------------------
        response = Async.runSync(function(done) {
            MaestraRubros_sql.findAndCountAll({})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = response.result.count;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess++;

        eventData = {
                      current: currentProcess, max: numberOfProcess, progress: '0 %',
                      message: `maestra de rubros ...`
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {
            // para cada catálogos, hacemos un 'upsert'; primero leemos a ver si existe; de ser así, usamos el _id
            // del doc que existe ...

            let itemExiste_ID = MaestraRubros.findOne({ rubro: item.rubro }, { fields: { _id: true }});

            let document = {
                _id: itemExiste_ID ? itemExiste_ID._id : new Mongo.ObjectID()._str,

                rubro: item.rubro,
                nombreCortoRubro: item.nombreCortoRubro,
                descripcion: item.descripcion,
                tipo: item.tipo,
                sueldoFlag: item.sueldoFlag,
                salarioFlag: item.salarioFlag,
                tipoRubro: item.tipoRubro,
            };

            // aquí intentamos usar un upsert, pero sin éxito; recurrimos a un insert o update, de acuerdo a si
            // el doc fue encontrado arriba
            if (itemExiste_ID && itemExiste_ID._id)
                MaestraRubros.update({ _id: itemExiste_ID._id }, { $set: document });
            else
                MaestraRubros.insert(document);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 25) {
                // hay menos de 20 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcess,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: `maestra de rubros ...`
                            };
                let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcess,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: `maestra de rubros ...`
                                };
                    let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los catálogos han sido cargados desde <em>Contab</em> en forma satisfactoria.";
    }
});
