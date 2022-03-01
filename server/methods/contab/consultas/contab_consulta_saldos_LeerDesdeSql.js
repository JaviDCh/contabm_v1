
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import numeral from 'numeral';
import lodash from 'lodash';

Meteor.methods(
{
    contab_consulta_saldos_LeerDesdeSql: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);

        let where = "";

        if (filtro2.cuentaContable) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.cuentaContable.indexOf('*') > -1) {
                filtro2.cuentaContable = filtro2.cuentaContable.replace(new RegExp("\\*", 'g'), "%");
                where += `(c.Cuenta Like '${filtro2.cuentaContable}')`;
            } else {
                where += `(c.Cuenta = '${filtro2.cuentaContable}')`;
            };
        };

        if (filtro2.cuentaContableDescripcion) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.cuentaContableDescripcion.indexOf('*') > -1) {
                filtro2.cuentaContableDescripcion = filtro2.cuentaContableDescripcion.replace(new RegExp("\\*", 'g'), "%");
                where += `(c.Descripcion Like '${filtro2.cuentaContableDescripcion}')`;
            } else {
                where += `(c.Descripcion = '${filtro2.cuentaContableDescripcion}')`;
            };
        };

        if (filtro2.ano) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            where += `(s.ano = ${filtro2.ano.toString()})`;
        };

        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(s.Cia = ${ciaContab.toString()})`;


        if (_.isArray(filtro2.monedas) && filtro2.monedas.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.monedas.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";
            where += `(s.Moneda In ${lista})`;
        };

        if (_.isArray(filtro2.monedasOriginales) && filtro2.monedasOriginales.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.monedasOriginales.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";
            where += `(s.MonedaOriginal In ${lista})`;
        };

        if (_.isArray(filtro2.anos) && filtro2.anos.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.anos.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";
            where += `(s.Ano In ${lista})`;
        };

        if (!where) {
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...

        };

        // --------------------------------------------------------------------------------------------------
        // leemos un probable filtro guardado para el usuario en la tabla que sigue; si existe, lo aplicamos
        // notese que ésto es un simple mecanismo para restringir las consultas contables para usuarios
        // específicos a ciertas cuentas contables ...
        let filtroDefinidoUsuario = FiltrosConsultasContab.findOne({ cia: ciaContab, usuario: Meteor.userId() });
        if (!filtroDefinidoUsuario) {
            filtroDefinidoUsuario = "(1 = 1)";
        } else {
            filtroDefinidoUsuario = filtroDefinidoUsuario.filtro;
        };
        // --------------------------------------------------------------------------------------------------


        // ---------------------------------------------------------------------------------------------------
        // leemos los saldos contables (desde sql server)

        let query = `Select s.CuentaContableID as cuentaContableID,
                    c.Cuenta as cuentaContable, c.Descripcion as nombreCuentaContable,
                    s.Ano as ano, s.Moneda as moneda, s.MonedaOriginal as monedaOriginal,
                    s.Inicial as inicial, s.Mes01 as mes01, s.Mes02 as mes02, s.Mes03 as mes03, s.Mes04 as mes04,
                    s.Mes05 as mes05, s.Mes06 as mes06, s.Mes07 as mes07, s.Mes08 as mes08, s.Mes09 as mes09,
                    s.Mes10 as mes10, s.Mes11 as mes11, s.Mes12 as mes12, s.Anual as anual,
                    m.Simbolo as simboloMoneda, m.Descripcion As descripcionMoneda,
                    mo.Simbolo as simboloMonedaOriginal, mo.Descripcion as descripcionMonedaOriginal,
                    s.Cia as cia
                    From SaldosContables s Inner Join CuentasContables c On s.CuentaContableID = c.ID
                    Inner Join Monedas m On s.Moneda = m.Moneda
                    Inner Join Monedas mo On s.MonedaOriginal = mo.Moneda
                    Where c.TotDet = 'D' And ${where} And ${filtroDefinidoUsuario}
                    `;

        if (filtro2.excluirCuentasContables_saldosMesesEnCero) {
            // el usuario puede indicar que solo desea cuentas con, al menos un saldo, diferente a cero
            let where_noCero = `s.Inicial <> 0 Or s.Mes01 <> 0 Or s.Mes02 <> 0 Or s.Mes03 <> 0 Or s.Mes04 <> 0 Or
            s.Mes05 <> 0 Or s.Mes06 <> 0 Or s.Mes07 <> 0 Or s.Mes08 <> 0 Or s.Mes09 <> 0 Or
            s.Mes10 <> 0 Or s.Mes11 <> 0 Or s.Mes12 <> 0 Or s.Anual <> 0`;
            query += ` And (${where_noCero})`
        }

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
        Temp_Consulta_SaldosContables.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "0";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('contab_leerSaldosContablesDesdeSqlServer_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'leerSaldosContablesDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields adicionales que existen en mongo ...
            let saldoContable = lodash.clone(item);

            saldoContable._id = new Mongo.ObjectID()._str;
            saldoContable.user = Meteor.userId();

            Temp_Consulta_SaldosContables.insert(saldoContable);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_leerSaldosContablesDesdeSqlServer_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'leerSaldosContablesDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_leerSaldosContablesDesdeSqlServer_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'leerSaldosContablesDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return cantidadRecs.toString();
    }
});
