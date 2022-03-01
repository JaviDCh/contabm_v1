

import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as numeral from 'numeral';
import * as lodash from 'lodash';
import * as moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { TimeOffset } from '../../../../globals/globals';
import '../../../../imports/globals/tsDeclares';

import { Temp_Consulta_Bancos_CajaChica } from '../../../../imports/collections/bancos/temp.bancos.consulta.cajaChica'; 

Meteor.methods(
{
    'bancos.cajaChica.LeerDesdeSql': function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });


        let where = "";

        if (filtro2.fecha1) {
            if (filtro2.fecha2) {
                where = `(r.Fecha Between '${moment(filtro2.fecha1).format('YYYY-MM-DD')}' And '${moment(filtro2.fecha2).format('YYYY-MM-DD')}')`;
            }
            else { 
                where = `(r.Fecha = '${moment(filtro2.fecha1).format('YYYY-MM-DD')}')`;
            }  
        }


        if (lodash.isFinite(filtro2.reposicion1)) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }
               
            if (lodash.isFinite(filtro2.reposicion2)) {
                where += `(r.Reposicion Between ${filtro2.reposicion1} And ${filtro2.reposicion2})`;
            }
            else
                where += `(r.Reposicion = ${filtro2.reposicion1})`;
        }

        // estados (pendiente, pagado, ...)
        if (lodash.isArray(filtro2.estados) && filtro2.estados.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }
               
            let lista = "";

            filtro2.estados.forEach((x) => {
                if (!lista) { 
                    lista = `('${x.toString()}'`;
                }
                else { 
                    lista += `, '${x.toString()}'`;
                } 
            })

            lista += ")";
            where += `(r.EstadoActual In ${lista})`;
        }

        // cajas chicas
        if (lodash.isArray(filtro2.cajasChicas) && filtro2.cajasChicas.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }
               
            let lista = "";

            filtro2.cajasChicas.forEach((x) => {
                if (!lista) { 
                    lista = `(${x.toString()}`;
                }
                else { 
                    lista += `, ${x.toString()}`;
                } 
            })

            lista += ")";
            where += `(r.CajaChica In ${lista})`;
        }

        // observaciones 
        if (filtro2.observaciones) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.observaciones.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(r.Observaciones Like '${criteria}')`;
        }

        if (where) { 
            where += " And ";
        }  
        else { 
            where = "(1 = 1) And ";
        }
            
        where += `(cc.CiaContab = ${ciaContab.toString()})`;

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select cc.Descripcion as cajaChica, r.Reposicion as reposicion, r.Fecha as fecha, 
                     r.EstadoActual as estadoActual, r.Observaciones as observaciones, 
                     Sum(g.Monto) as montoImponible, Sum(g.MontoNoImponible) as montoNoImponible, Sum(g.Iva) as iva, Sum(g.Total) as total, 
                     Count(g.reposicion) as lineas 
                     From CajaChica_Reposiciones r Left Outer Join CajaChica_Reposiciones_Gastos g On r.Reposicion = g.Reposicion 
                     Inner Join CajaChica_CajasChicas cc On r.CajaChica = cc.CajaChica  
                     Where ${where} 
                     Group By cc.Descripcion, r.Reposicion, r.Fecha, r.EstadoActual, r.Observaciones   
                    `;

        query = query.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

        let response: any = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // eliminamos los registros que el usuario pueda haber registrado antes (en mongo) ...
        Temp_Consulta_Bancos_CajaChica.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde la base de datos (sql server).";
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;
        EventDDP.matchEmit('bancos_cajaChica_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosCajaChicaDesdeSqlServer' },
                            { current: 1, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let reposicionCajaChica = lodash.clone(item);

            reposicionCajaChica._id = new Mongo.ObjectID()._str;
            reposicionCajaChica.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            reposicionCajaChica.fecha = reposicionCajaChica.fecha ? moment(reposicionCajaChica.fecha).add(TimeOffset, 'hours').toDate() : null;
            
            Temp_Consulta_Bancos_CajaChica.insert(reposicionCajaChica);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_cajaChica_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosCajaChicaDesdeSqlServer' },
                                    { current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_cajaChica_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosCajaChicaDesdeSqlServer' },
                                        { current: currentProcess, max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, los proveedores y clientes han sido leídos desde sql server.";
    }
})
