



import SimpleSchema from 'simpl-schema';
import lodash from 'lodash';     
import numeral from 'numeral';    
import moment from 'moment'; 
import { TimeOffset } from '/globals/globals';    

Meteor.methods(
{
    'asientosContables.mas2decimales.corregir': function (asientosContablesSeleccionados) {

        new SimpleSchema({
            asientosContablesSeleccionados: { type: Array, optional: false, minCount: 1, },
            'asientosContablesSeleccionados.$': { type: SimpleSchema.Integer },

        }).validate({ asientosContablesSeleccionados });

        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        let numberOfItems = 1;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcesses = 2;
        let currentProcess = 1;
        let message = "Leyendo los asientos contables seleccionados ..."

        // nótese que eventName y eventSelector no cambiarán a lo largo de la ejecución de este procedimiento
        let eventName = "contab_asientos.lista.corregirAsientosMas2Decimales_reportProgress";
        let eventSelector = { myuserId: this.userId, app: 'contab', process: 'asientos.lista.corregirAsientosMas2Decimales' };
        let eventData = {
                            current: currentProcess, max: numberOfProcesses, progress: '0 %',
                            message: message
                        };

        // sync call
        let methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        let filtroAsientos = { numeroAutomatico: { $in: asientosContablesSeleccionados } }; 

        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({
                where: filtroAsientos,
                include: [ { model: dAsientosContables_sql, as: 'partidas' } ],
                // raw: true,           // ya sabemos que raw no funciona cuando usamos 'include'
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let asientosContables = [];

        response.result.forEach((asientoContable) => {
            asientosContables.push(asientoContable);
        })


        // separamos los asientos contables para intentar corregir solo los no cerrados y los efectivamente incorrectos ... 
        let asientosContablesMesCerradoEnContab = []; 
        let asientosContablesMontosCorrectos = []; 
        let asientosContablesMontosIncorrectos = []; 


        // -------------------------------------------------------------------------------------------------------------
        // valores para reportar el progreso
        numberOfItems = asientosContables.length;
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        message = "corrigiendo los asientos leídos ..."
        eventData = {
                        current: currentProcess, max: numberOfProcesses, progress: '0 %',
                        message: message
                    };

        // sync call
        methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
        // -------------------------------------------------------------------------------------------------------------


        for (let a of asientosContables) { 

            let asientoContable = a.dataValues; 

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; cada cant recs / 10 registros .
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 30 registros; reportamos siempre ...
                eventData = {
                              current: currentProcess, max: numberOfProcesses,
                              progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                              message: message
                            };
                methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    eventData = {
                                  current: currentProcess, max: numberOfProcesses,
                                  progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                  message: message
                                };
                    methodResult = Meteor.call('eventDDP_matchEmit', eventName, eventSelector, eventData);
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------

            // la fecha del asiento debe ser 'localizada' para que la comparación contra sql server sea correcta; 
            // lamentablemente, en sql nuestros asientos (y otros registros) tiene su fecha localizada 
            asientoContable.fecha = moment(asientoContable.fecha).add(TimeOffset, 'hours').toDate();

            let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(asientoContable.fecha,
                asientoContable.cia,
                asientoContable.asientoTipoCierreAnualFlag ?  asientoContable.asientoTipoCierreAnualFlag : false);

            if (validarMesCerradoEnContab.error) { 
                asientosContablesMesCerradoEnContab.push(asientoContable); 
                continue; 
            }

            let montosIncorrectos = false; 

            for (let p of asientoContable.partidas) { 
                let partida = p.dataValues; 
                if (countDecimals(partida.haber) > 2 || countDecimals(partida.debe) > 2) { 
                    // el asiento es correcto; no tiene montos con más de 2 decimales;  
                    montosIncorrectos = true; 
                    break; 
                }
            }

            if (!montosIncorrectos) { 
                asientosContablesMontosCorrectos.push(asientoContable); 
                continue; 
            }
            
            // Ok, el asiento es incorrecto; lo corregimos ... 
            asientosContablesMontosIncorrectos.push(asientoContable); 
        }


        // convertimos el array de asientos a corregir, para que sea mucho más simple y fácil de tratar 
        let asientosContables2 = []; 
        for (let asiento of asientosContablesMontosIncorrectos) { 

            let asientoContable = { numeroAutomatico: asiento.numeroAutomatico, partidas: [] }; 
            for (let p of asiento.partidas) { 
                let partida = p.dataValues; 
                asientoContable.partidas.push({ 
                    numeroAutomatico: partida.numeroAutomatico, 
                    partida: partida.partida, 
                    debe: partida.debe, 
                    haber: partida.haber
                }); 
            }
            
            asientosContables2.push(asientoContable); 
        }

        
        // recorremos las partidas para redondear sus montos a solo 2 decimales 
        for (let asiento of asientosContables2) { 
            for (let partida of asiento.partidas) { 
                if (countDecimals(partida.haber) > 2 || countDecimals(partida.debe) > 2) { 
                    // la partida es incorrecta; la corregimos 
                    partida.debe = lodash.round(partida.debe, 2); 
                    partida.haber = lodash.round(partida.haber, 2); 
                }
            }
        }


        // recorremos los asientos a corregir para 'cuadrar' sus partidas a cero ... 
        for (let asientoContable of asientosContables2) { 

            // para 'cuadrar' el asiento, calculamos su diferencia y la sumamos al debe o haber en la 1ra. partida 
            let diferencia = 0; 
            asientoContable.partidas.forEach((p) => { 
                diferencia += p.debe - p.haber; 
            })

            diferencia = lodash.round(diferencia, 2); 
            
            if (diferencia >= 0) { 
                asientoContable.partidas[0].haber += diferencia; 
            } else { 
                asientoContable.partidas[0].debe += Math.abs(diferencia); 
            }
        }

        // finalmente, recorremos los asientos corregidos para actualizar sus partidas en la base de datos 
        for (let asientoContable of asientosContables2) { 
            for (let partida of asientoContable.partidas) { 
                
                response = null;
                response = Async.runSync(function(done) {
                    dAsientosContables_sql.update({ debe: partida.debe, haber: partida.haber }, 
                        { where: { numeroAutomatico: asientoContable.numeroAutomatico, partida: partida.partida }})
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });
    
                if (response.error) { 
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            }
        }


        
        return { 
            error: false, 
            message: `Ok, los datos han sido actualizados en la base de datos.<br /><br />
            En total, hemos leído <b>${asientosContables.length.toString()}</b> asientos contables, de los cuales: <br />
            <b>${asientosContablesMesCerradoEnContab.length.toString()}</b> han sido <b>obviados</b> por corresponder a <b>meses cerrados</b>, <br />
            <b>${asientosContablesMontosCorrectos.length.toString()}</b> han sido obviados por <b>no tener</b> montos con más de dos decimales, <br />
            <b>${asientosContablesMontosIncorrectos.length.toString()}</b> han sido <b>modificados</b> para corregir montos con más de dos decimales.
            `
        } 
    }
})


var countDecimals = function (value) { 

    if (!(typeof value === 'number')) { 
        return 0; 
    }

    if ((value % 1) != 0) { 
        return value.toString().split(".")[1].length;  
    }
        
    return 0;
};
