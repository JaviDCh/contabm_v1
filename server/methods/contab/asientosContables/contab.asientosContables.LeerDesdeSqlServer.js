
import moment from 'moment';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'contab.asientosContables.LeerDesdeSqlServer': function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);

        let where = "";

        if (filtro2.fecha1) {
            if (filtro2.fecha2) {
                where = `(Fecha Between '${moment(filtro2.fecha1).format('YYYY-MM-DD')}' And '${moment(filtro2.fecha2).format('YYYY-MM-DD')}')`;
            }
            else { 
                where = `(Fecha = '${moment(filtro2.fecha1).format('YYYY-MM-DD')}')`;
            }
        }

        if (filtro2.ingreso1) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }
                
            if (filtro2.ingreso2) {
                where += `(Ingreso Between '${moment(filtro2.ingreso1).format('YYYY-MM-DD')}' And '${moment(filtro2.ingreso2).format('YYYY-MM-DD')}')`;
            }
            else
                where += `(Ingreso = '${moment(filtro2.fecha1).format('YYYY-MM-DD')}')`;
        }

        if (filtro2.ultAct1) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            if (filtro2.ultAct2) {
                where += `(UltAct Between '${moment(filtro2.ultAct1).format('YYYY-MM-DD')}' And '${moment(filtro2.ultAct2).format('YYYY-MM-DD')}')`;
            }
            else
                where += `(UltAct = '${moment(filtro2.ultAct1).format('YYYY-MM-DD')}')`;
        }

        if (filtro2.numero1) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            if (filtro2.numero2) {
                where += `(Numero Between ${filtro2.numero1.toString()} And ${filtro2.numero2.toString()})`;
            }
            else
                where += `(Numero = ${filtro2.numero1.toString()})`;
        }

        if (filtro2.lote) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            if (filtro2.lote.indexOf('*') > -1) {
                filtro2.lote = filtro2.lote.replace(new RegExp("\\*", 'g'), "%");
                where += ` (a.Lote Like '${filtro2.lote}')`;
            } else {
                where += ` (a.Lote = '${filtro2.lote}')`;
            };
        }

        if (filtro2.centroCosto) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            if (filtro2.centroCosto.indexOf('*') > -1) {
                filtro2.centroCosto = filtro2.centroCosto.replace(new RegExp("\\*", 'g'), "%");
                where += ` (cc.Descripcion Like '${filtro2.centroCosto}')`;
            } else {
                where += ` (cc.Descripcion = '${filtro2.centroCosto}')`;
            };
        }

        if (where) { 
            where += " And ";
        } 
        else { 
            where = "(1 = 1) And ";
        }
            
        where += `(Cia = ${ciaContab.toString()})`;

        if (filtro2.soloAsientosNumeroNegativo) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(a.Numero < 0)`;
        }

        if (filtro2.soloAsientosTipoCierreAnual) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(a.AsientoTipoCierreAnualFlag = 1)`;
        }


        if (filtro2.sinAsientosTipoCierreAnual) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(a.AsientoTipoCierreAnualFlag Is Null Or a.AsientoTipoCierreAnualFlag = 0)`;
        }

        if (filtro2.cuentasContables.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            let cuentasContablesLista = "";

            filtro2.cuentasContables.forEach((c) => {
                if (!cuentasContablesLista)
                    cuentasContablesLista = "(" + c.toString();
                else
                    cuentasContablesLista += ", " + c.toString();
            })

            cuentasContablesLista += ")";
            where += ` (d.CuentaContableID In ${cuentasContablesLista})`;
        }

        if (filtro2.soloConCentrosCostoAsignado) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(d.CentroCosto Is Not Null)`;
        }

        
        if (_.isArray(filtro2.tiposAsiento) && filtro2.tiposAsiento.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            let tiposAsientoLista = "";

            filtro2.tiposAsiento.forEach((t) => {
                if (!tiposAsientoLista)
                    tiposAsientoLista = `('${t}'`;
                else
                    tiposAsientoLista += `, '${t}'`;
            });

            tiposAsientoLista += ")";
            where += ` (a.Tipo In ${tiposAsientoLista})`;
        };

        if (_.isArray(filtro2.monedas) && filtro2.monedas.length > 0) {

           if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            let monedasLista = "";

            filtro2.monedas.forEach((m) => {
                if (!monedasLista)
                    monedasLista = "(" + m.toString();
                else
                    monedasLista += ", " + m.toString();
            });

            monedasLista += ")";
            where += ` (a.Moneda In ${monedasLista})`;
        };

        if (_.isArray(filtro2.provieneDe) && filtro2.provieneDe.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            let provieneDeLista = "";

            filtro2.provieneDe.forEach((p) => {
                if (!provieneDeLista)
                    provieneDeLista = `('${p}'`;
                else
                    provieneDeLista += `, '${p}'`;
            });

            provieneDeLista += ")";
            where += ` (a.ProvieneDe In ${provieneDeLista})`;
        }


        // el usuario puede seleccionar solo asientos con debe o haber con más de dos decimales
        let whereMontosConMasDeDosDecimales = `(1 = 1)`;
        if (filtro2.soloConMontosConMasDeDosDecimales) {
            whereMontosConMasDeDosDecimales = `
            (
                (((abs(d.debe)*100) - CONVERT(bigint,(abs(d.debe)*100))) <> 0) Or
                (((abs(d.haber)*100) - CONVERT(bigint,(abs(d.haber)*100))) <> 0)
            )
            `;
        }

        if (!where) {
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...
        }

        let centrosCosto_sqlJoin = ''; 

        if (filtro2.centroCosto) { 
            centrosCosto_sqlJoin = ` Left Outer Join CentrosCosto cc On d.CentroCosto = cc.CentroCosto`
        }

        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)
        // accedemos a CentrosCosto solo si el usuario indicó en el filtro ... 
        let query = `Select a.NumeroAutomatico as numeroAutomatico, a.Numero as numero, a.Fecha as fecha, a.Tipo as tipo,
                    a.Descripcion as descripcion, a.Moneda as moneda, a.MonedaOriginal as monedaOriginal,
                    a.ProvieneDe as provieneDe, a.Ingreso as ingreso, a.UltAct as ultAct, a.Cia as cia,
                    a.asientoTipoCierreAnualFlag, a.FactorDeCambio as factorDeCambio,
                    COUNT(d.NumeroAutomatico) As cantidadPartidas, SUM(d.debe) As totalDebe, SUM(d.Haber) As totalHaber
                    From Asientos a Left Outer Join dAsientos d On a.NumeroAutomatico = d.NumeroAutomatico 
                    ${centrosCosto_sqlJoin}
                    Where ${where} And ${whereMontosConMasDeDosDecimales}
                    Group by a.NumeroAutomatico, a.Numero, a.Fecha, a.Tipo, a.Descripcion,
                    a.Moneda, a.MonedaOriginal, a.ProvieneDe, a.Ingreso, a.UltAct, a.Cia,
                    a.asientoTipoCierreAnualFlag, a.FactorDeCambio`;

        if (filtro2.soloAsientosDescuadrados) {
            query += ` Having SUM(d.debe) <> SUM(d.Haber)`;
        }

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_AsientosContables.remove({ user: this.userId });

        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'leerAsientosDesdeSqlServer' },
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
            asientoContable.ingreso = moment(asientoContable.ingreso).add(TimeOffset, 'hours').toDate();
            asientoContable.ultAct = moment(asientoContable.ultAct).add(TimeOffset, 'hours').toDate();

            Temp_Consulta_AsientosContables.insert(asientoContable, function (error, result) {
                if (error) { 
                    throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
                }
            })

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'leerAsientosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_leerAsientosDesdeSqlServer_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'leerAsientosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, los asientos contables han sido leídos desde sql server.";
    }
})

function customizer(value) {
    return true;
}
