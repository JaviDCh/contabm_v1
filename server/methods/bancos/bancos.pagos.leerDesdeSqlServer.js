

import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';

import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

Meteor.methods(
{
    'bancos.pagos.leerDesdeSqlServer': function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });

        let where = "";

        if (filtro2.fecha1) {
            if (filtro2.fecha2) {
                where = `(p.fecha Between '${moment(filtro2.fecha1).format('YYYY-MM-DD')}' And '${moment(filtro2.fecha2).format('YYYY-MM-DD')}')`;
            }
            else { 
                where = `(p.fecha = '${moment(filtro2.fecha1).format('YYYY-MM-DD')}')`;
            }
        }

        if (lodash.isFinite(filtro2.monto1)) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }
                
            if (lodash.isFinite(filtro2.monto2)) {
                where += `(p.Monto Between ${filtro2.monto1} And ${filtro2.monto2})`;
            }
            else { 
                where += `(p.Monto = ${filtro2.monto1})`;
            }   
        }

        // el numero del pago es de tipo String
        if (filtro2.numeroPago) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.numeroPago.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(p.NumeroPago Like '${criteria}')`;
        }

        if (filtro2.concepto) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.concepto.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(p.Concepto Like '${criteria}')`;
        }

        if (filtro2.nombreCompania) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreCompania.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(prov.Nombre Like '${criteria}')`;
        }

        if (filtro2.anticipoFlag) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(p.AnticipoFlag = 1)`;
        }

        if (filtro2.miSuFlag) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            where += `(p.MiSuFlag = ${filtro2.miSuFlag})`;
        }

        if (where) { 
            where += " And ";
        }
        else { 
            where += "(1 = 1) And ";
        }

        where += `(p.Cia = ${ciaContab.toString()})`;

        // monedas
        if (_.isArray(filtro2.monedas) && filtro2.monedas.length > 0) {

            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            let lista = "";

            filtro2.monedas.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            })

            lista += ")";
            where += `(p.Moneda In ${lista})`;
        }

        if (!where) { 
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...
        }

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select p.ClaveUnica as claveUnica, p.NumeroPago as numeroPago,
                    p.Fecha as fecha,
            	    prov.Abreviatura as nombreCompania, m.Simbolo as simboloMoneda,
                    p.Concepto as concepto,
                    Case p.MiSuFlag When 1 Then 'Mi' When 2 Then 'Su' Else 'Indef' End As miSuFlag,
                    Case p.AnticipoFlag When 1 Then 'Ok' Else ' ' End As anticipoFlag, 
                    p.Monto as monto  
                    From Pagos p Inner Join Proveedores prov on p.Proveedor = prov.Proveedor
                    Inner Join Monedas m on p.Moneda = m.Moneda
                    Where ${where}
                    `;

        if (filtro2.sinFacturasAsociadas) {
          // para leer solo pagos *sin* facturas asociadas, agregamos un subquery al Select ...
          query += ` And p.ClaveUnica Not In (Select ClaveUnicaPago From dPagos) `;
        }

        if (filtro2.conFacturasAsociadas) {
          // para leer solo pagos *con* facturas asociadas, agregamos un subquery al Select ...
          query += ` And p.ClaveUnica In (Select ClaveUnicaPago From dPagos) `;
        }

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_Bancos_Pagos.remove({ user: this.userId });

        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_leerBancosPagos_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosPagosDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let pago = lodash.clone(item);

            pago._id = new Mongo.ObjectID()._str;
            pago.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            pago.fecha = pago.fecha ? moment(pago.fecha).add(TimeOffset, 'hours').toDate() : null;

            Temp_Consulta_Bancos_Pagos.insert(pago);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_leerBancosPagos_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosPagosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_leerBancosPagos_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosPagosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, los pagos han sido leídos desde sql server.";
    }
})