
import lodash from 'lodash';
import moment from 'moment';
import { Monedas } from '/imports/collections/monedas';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'contab.asientos.convertir': function (asientoContableID) {

        check(asientoContableID, Number);

        // lo primero que hacemos es leer el asiento contable
        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({ where: { numeroAutomatico: asientoContableID },
                include: [{ model: dAsientosContables_sql, as: 'partidas' }],
                // raw: true            nótese que, al menos por ahora, no funciona cuando hay un 'include' (???!!)
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) {
            return {
                error: true,
                message: `Error inesperado: no hemos podido leer el asiento contable en la base de datos. `
            };
        }

        let asientoContable = response.result[0].dataValues;

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();
        asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
        asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

        let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(asientoContable.fecha,
                                                                                  asientoContable.cia,
                                                                                  asientoContable.asientoTipoCierreAnualFlag ?
                                                                                  asientoContable.asientoTipoCierreAnualFlag :
                                                                                  false);

        if (validarMesCerradoEnContab.error) {
            throw new Meteor.Error("meses-cerrado-en-Contab", validarMesCerradoEnContab.errMessage);
        }

        // el asiento contable debe tener partidas
        if (!asientoContable.partidas || !_.isArray(asientoContable.partidas) || !asientoContable.partidas.length) {
            return {
                error: true,
                message: `Error: el asiento contable no tiene partidas registradas. No hay montos que convertir.`
            };
        }

        // la compañía debe estar definida como 'multimoneda' en Contab ...
        response = null;
        response = Async.runSync(function(done) {
            ParametrosContab_sql.findAll({ where: { cia: asientoContable.cia }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) {
            return {
                error: true,
                message: `Error inesperado: no hemos podido leer la tabla de <em>parámetros Contab</em>,
                          para la compañía del asiento contable, en la base de datos. `
            };
        }

        let parametrosContab = response.result[0];

        if (!parametrosContab.multiMoneda) {
            return {
                error: true,
                message: `Error: la compañía no está definida como <em>multimoneda</em>,
                          en la tabla <em>Parámetros Contab</em>; debe estarlo de esa manera,
                          para que sus asientos puedan ser convertidos a otra moneda. `
            };
        }


        let monedaNacional = Monedas.findOne({ nacionalFlag: { $eq: true }});
        let monedaExtranjera = Monedas.findOne({ nacionalFlag: { $ne: true }});

        if (!monedaNacional || !monedaExtranjera) {
            return {
                error: true,
                message: `Error: no hemos podido leer, en la tabla <em>Monedas</em>, una moneda <em>nacional</em> y
                          una moneda <em>extranjera</em> (no nacional). <br />
                          Por favor revise las monedas en la tabla <em>Monedas</em> y corrija esta situación.`
            };
        }


        // ----------------------------------------------------------------------------------------
        // antes de eliminar el asiento ya convertido, averiguamos si existe (para informar al usuario)
        let asientoConvertidoExiste = false;

        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.count({ where: {
                numero: asientoContable.numero,
                mes: asientoContable.mes,
                ano: asientoContable.ano,
                cia: asientoContable.cia,
                moneda: { $ne: sequelize.col('monedaOriginal') }
            }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (response.result > 0) {
            asientoConvertidoExiste = true;
        }

        // ----------------------------------------------------------------------------------------
        // eliminamos el asiento convertido, si existe
        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.destroy({ where: {
                numero: asientoContable.numero,
                mes: asientoContable.mes,
                ano: asientoContable.ano,
                cia: asientoContable.cia,
                moneda: { $ne: sequelize.col('monedaOriginal') }
            }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // -------------------------------------------------------------------------------------------
        // para efectuar la conversión, debemos determinar si el asiento se ha registrado en moneda
        // nacional o extranjera ...
        let asientoOriginalMonedaNacional = false;

        if (asientoContable.moneda == monedaNacional.moneda) {
            asientoOriginalMonedaNacional = true;
        }

        let asientoConvertido = lodash.clone(asientoContable);
        delete asientoConvertido.numeroAutomatico;      // pk en sql server ...

        // nótese como asignamos la moneda del asiento convertido (la moneda original se mantiene)
        if (asientoOriginalMonedaNacional) {
            asientoConvertido.moneda = monedaExtranjera.moneda;
        } else {
            asientoConvertido.moneda = monedaNacional.moneda;
        }

        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        asientoConvertido.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'hours').toDate();
        asientoConvertido.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'hours').toDate();
        asientoConvertido.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'hours').toDate();

        asientoConvertido.ingreso = moment().subtract(TimeOffset, 'hours').toDate();
        asientoConvertido.ultAct = moment().subtract(TimeOffset, 'hours').toDate();
        asientoConvertido.usuario = Meteor.user().emails[0].address;

        let diferenciaDebeHaber = 0;

        asientoContable.partidas.forEach((partida) => {
            // nótese como hacemos la conversión justo en las partidas
            if (asientoOriginalMonedaNacional) {
                // el asiento a convertir es en moneda extranjera; dividimos por el factor de cambio
                if (asientoContable.factorDeCambio != 0) {
                    partida.debe = partida.debe / asientoContable.factorDeCambio;
                    partida.haber = partida.haber / asientoContable.factorDeCambio;
                } else {
                    partida.debe = 0;
                    partida.haber = 0;
                }
            } else {
                // el asiento contable a convertir es en moneda nacional; multiplicamos por el factor de cambio
                partida.debe = partida.debe * asientoContable.factorDeCambio;
                partida.haber = partida.haber * asientoContable.factorDeCambio;
            };

            // nos aseguramos que los montos no tengan más de dos decimales
            partida.debe = lodash.round(partida.debe, 2);
            partida.haber = lodash.round(partida.haber, 2);

            diferenciaDebeHaber += partida.debe - partida.haber;
        });


        if (diferenciaDebeHaber != 0) {
            let primeraPartida = asientoConvertido.partidas[0];

            if (diferenciaDebeHaber > 0) {
                // la diferencia es mayor que cero: restamos al debe o sumamos al haber
                if (primeraPartida.debe != 0) {
                    primeraPartida.debe -= diferenciaDebeHaber;
                }
                else {
                    primeraPartida.haber += diferenciaDebeHaber;
                }
            }
            else
            {
                // la diferencia es menor que cero: sumamos al debe o restamos al haber
                if (primeraPartida.debe != 0) {
                    primeraPartida.debe += diferenciaDebeHaber * -1;
                }
                else {
                    primeraPartida.haber -= diferenciaDebeHaber * -1;
                }
            }
        }


        // nótese como grabamos el asiento y sus partidas (Asientos/dAsientos)
        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.create(asientoConvertido, {
                include: [{ model: dAsientosContables_sql, as: 'partidas' }],
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let resultMessage = `Ok, la conversión del asiento contable se ha efectuado en forma satisfactoria. `;

        if (asientoConvertidoExiste) {
            resultMessage += `<br />
                              (Nota: el asiento convertido <b>ya existía</b>.
                               Fue sustituído por el resultado de esta operación)`;
        }

        return {
            error: false,
            message: resultMessage
        };

    }
});
