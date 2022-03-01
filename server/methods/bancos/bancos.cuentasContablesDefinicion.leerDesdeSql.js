
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import numeral from 'numeral';
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    bancos_cuentasContablesDefinicion_leerDesdeSql: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });

        let where = "";

        if (filtro2.nombreRubro) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreRubro.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(t.Descripcion Like '${criteria}')`;
        };

        if (filtro2.nombreProveedor) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreProveedor.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(p.Nombre Like '${criteria}')`;
        };

        if (filtro2.concepto) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(d.Concepto = ${filtro2.concepto})`;
        };

        if (filtro2.cuentaContable) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.cuentaContable.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(c.Cuenta Like '${criteria}')`;
        };

        if (filtro2.cuentaContableDescripcion) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.cuentaContableDescripcion.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(c.Descripcion Like '${criteria}')`;
        };

        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(c.Cia = ${ciaContab.toString()})`;

        if (!where)
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...


        // ---------------------------------------------------------------------------------------------------
        // leemos los registros desde sql server, que cumplan el criterio indicado
        let query = `Select d.ClaveUnica as claveUnica, d.Rubro as rubro, d.Compania as compania,
            	     d.Moneda as moneda, d.Concepto as concepto, d.Concepto2 as concepto2,
            	     d.CuentaContableID as cuentaContableID
                     From DefinicionCuentasContables d
                     Left Outer Join TiposProveedor t On d.Rubro = t.Tipo
                     Left Outer Join Proveedores p On d.Compania = p.Proveedor
                     Left Outer Join CuentasContables c On d.CuentaContableID = c.ID
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

        // eliminamos los registros que el usuario pueda haber registrado antes (en mongo) ...
        Temp_Consulta_Bancos_CuentasContables_Definicion.remove({ user: this.userId });

        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_leerCuentasContablesDefinicionDesdeSqlServer_reportProgressDesdeSqlServer',
                            {
                                myuserId: this.userId,
                                app: 'bancos',
                                process: 'leerCuentasContablesDefinicionDesdeSqlServer'
                            },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let cuentaContableDefinicion = lodash.clone(item);

            cuentaContableDefinicion._id = new Mongo.ObjectID()._str;
            cuentaContableDefinicion.user = Meteor.userId();

            Temp_Consulta_Bancos_CuentasContables_Definicion.insert(cuentaContableDefinicion);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_leerCuentasContablesDefinicionDesdeSqlServer_reportProgressDesdeSqlServer',
                                    {
                                        myuserId: this.userId,
                                        app: 'bancos',
                                        process: 'leerCuentasContablesDefinicionDesdeSqlServer'
                                    },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_leerCuentasContablesDefinicionDesdeSqlServer_reportProgressDesdeSqlServer',
                                        {
                                            myuserId: this.userId,
                                            app: 'bancos',
                                            process: 'leerCuentasContablesDefinicionDesdeSqlServer'
                                        },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los rubros asignados han sido leídos desde sql server.";
    }
});
