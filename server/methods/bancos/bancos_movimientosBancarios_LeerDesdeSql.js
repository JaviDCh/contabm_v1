
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    bancos_movimientosBancarios_LeerDesdeSql: function (filtro, ciaContab) {

        // debugger;
        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);

        // if (!asientoContable || !asientoContable.docState) {
        //     throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        // };

        let where = "";

        if (filtro2.fecha1) {
            if (filtro2.fecha2) {
                where = `(mb.Fecha Between '${moment(filtro2.fecha1).format('YYYY-MM-DD')}' And '${moment(filtro2.fecha2).format('YYYY-MM-DD')}')`;
            }
            else
                where = `(mb.Fecha = '${moment(filtro2.fecha1).format('YYYY-MM-DD')}')`;
        };

        if (filtro2.fechaEntregado1) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.fechaEntregado2) {
                where += `(mb.FechaEntregado Between '${moment(filtro2.fechaEntregado1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaEntregado2).format('YYYY-MM-DD')}')`;
            }
            else
                where += `(mb.FechaEntregado = '${moment(filtro2.fechaEntregado1).format('YYYY-MM-DD')}')`;
        };

        if (lodash.isFinite(filtro2.monto1)) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (lodash.isFinite(filtro2.monto2)) {
                where += `(mb.Monto Between ${filtro2.monto1} And ${filtro2.monto2})`;
            }
            else
                where += `(mb.Monto = ${filtro2.monto1})`;
        };

        if (filtro2.transaccion1) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.transaccion2) {
                where += `(mb.transaccion Between '${filtro2.transaccion1}' And '${filtro2.transaccion2}')`;
            }
            else
                where += `(mb.transaccion = '${filtro2.transaccion1}')`;
        };



        if (filtro2.concepto) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*' que el usuario haya agregado
            let criteria = filtro2.concepto.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            // if (filtro2.nombre.indexOf('*') > -1) {
            //     filtro2.nombre = filtro2.nombre.replace(new RegExp("\\*", 'g'), "%");
            //     where += ` (e.Nombre Like '${criteria}')`;
            // } else {
            //     where += ` (e.Nombre = '${filtro2.nombre}')`;
            // };

            where += `(mb.Concepto Like '${criteria}')`;
        };

        if (filtro2.beneficiario) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*' que el usuario haya agregado
            let criteria = filtro2.beneficiario.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            // if (filtro2.nombre.indexOf('*') > -1) {
            //     filtro2.nombre = filtro2.nombre.replace(new RegExp("\\*", 'g'), "%");
            //     where += ` (e.Nombre Like '${criteria}')`;
            // } else {
            //     where += ` (e.Nombre = '${filtro2.nombre}')`;
            // };

            where += `(mb.Beneficiario Like '${criteria}')`;
        };



        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(cb.Cia = ${ciaContab.toString()})`;

        // bancos
        if (lodash.isArray(filtro2.bancos) && filtro2.bancos.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.bancos.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            });

            lista += ")";
            where += `(b.Banco In ${lista})`;
        };

        // monedas
        if (lodash.isArray(filtro2.monedas) && filtro2.monedas.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.monedas.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            });

            lista += ")";
            where += `(cb.Moneda In ${lista})`;
        };

        // tipos
        if (lodash.isArray(filtro2.tipos) && filtro2.tipos.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.tipos.forEach((x) => {
                if (!lista)
                    lista = `('${x.toString()}'`;
                else
                    lista += `, '${x.toString()}'`;
            });

            lista += ")";
            where += `(mb.Tipo In ${lista})`;
        };


        // usuarios
        if (lodash.isArray(filtro2.usuarios) && filtro2.usuarios.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.usuarios.forEach((x) => {
                if (!lista)
                    lista = `('${x.toString().trim()}'`;
                else
                    lista += `, '${x.toString().trim()}'`;
            });

            lista += ")";
            where += `(mb.Usuario In ${lista})`;
        };

        // cuentasBancarias
        if (lodash.isArray(filtro2.cuentasBancarias) && filtro2.cuentasBancarias.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.cuentasBancarias.forEach((x) => {
                if (!lista)
                    lista = `(${x.toString()}`;
                else
                    lista += `, ${x.toString()}`;
            });

            lista += ")";
            where += `(cb.CuentaInterna In ${lista})`;
        };

        // chequeras
        if (lodash.isArray(filtro2.chequeras) && filtro2.chequeras.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.chequeras.forEach((x) => {
                if (!lista)
                    lista = `(${x.toString()}`;
                else
                    lista += `, ${x.toString()}`;
            });

            lista += ")";
            where += `(mb.ClaveUnicaChequera In ${lista})`;
        };




        if (!where)
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...


        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)

        let query = `Select mb.Transaccion as transaccion, mb.Tipo as tipo, mb.Fecha as fecha,
                    b.Abreviatura as banco, cb.CuentaBancaria as cuentaBancaria, mo.Simbolo as moneda,
                    mb.Beneficiario as beneficiario, mb.Concepto as concepto, mb.Monto as monto,
                    mb.FechaEntregado as fechaEntregado, mb.ClaveUnica as claveUnica,
                    cb.Cia as cia, mb.Usuario as usuario
                    From MovimientosBancarios mb Inner Join Chequeras ch On mb.ClaveUnicaChequera = ch.NumeroChequera
                    Inner Join CuentasBancarias cb On ch.NumeroCuenta = cb.CuentaInterna
                    Inner Join Agencias a On cb.Agencia = a.Agencia
                    Inner Join Bancos b On a.Banco = b.Banco
                    Inner Join Monedas mo On cb.Moneda = mo.Moneda
                    Where ${where}
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_Bancos_MovimientosBancarios.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_leerBancosMovimientosBancariosDesdeSqlServer_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosMovimientosBancariosDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields adicionales que existen en mongo ...

            let movimientoBancario = lodash.clone(item);

            movimientoBancario._id = new Mongo.ObjectID()._str;
            movimientoBancario.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:30, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...

            movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
            movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;

            Temp_Consulta_Bancos_MovimientosBancarios.insert(movimientoBancario);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_leerBancosMovimientosBancariosDesdeSqlServer_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosMovimientosBancariosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_leerBancosMovimientosBancariosDesdeSqlServer_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosMovimientosBancariosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los movimientos bancarios han sido leídos desde sql server.";
    }
});
