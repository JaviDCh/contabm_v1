
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import numeral from 'numeral'; 
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    nomina_cuentasContablesEmpleadoRubro_leerDesdeSql: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });

        // if (!asientoContable || !asientoContable.docState) {
        //     throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        // };

        let where = "";

        if (filtro2.rubroAbreviatura) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.rubroAbreviatura.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(mr.NombreCortoRubro Like '${criteria}')`;
        };

        if (filtro2.nombreEmpleado) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreEmpleado.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(e.Alias Like '${criteria}')`;
        };

        if (filtro2.nombreDepartamento) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreDepartamento.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(d.Descripcion Like '${criteria}')`;
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

            where += `(cc.Cuenta Like '${criteria}')`;
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

            where += `(cc.Descripcion Like '${criteria}')`;
        };


        if (filtro2.sumarizar) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(c.SumarizarEnUnaPartidaFlag = 1)`;
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
        let query = `Select c.ClaveUnica as claveUnica, c.Rubro as rubro, c.Empleado as empleado,
                     c.Departamento as departamento,
                     c.CuentaContable as cuentaContable,
                     c.SumarizarEnUnaPartidaFlag as sumarizarEnUnaPartidaFlag,
                     c.Cia as cia
                     From tCuentasContablesPorEmpleadoYRubro c
                     Inner Join tMaestraRubros mr On c.Rubro = mr.Rubro
                     Left Outer Join tEmpleados e On c.Empleado = e.Empleado
                     Left Outer Join tDepartamentos d On c.Departamento = d.Departamento
                     Inner Join CuentasContables cc On c.CuentaContable = cc.ID
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
        Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.remove({ user: this.userId });

        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('nomina_leerCuentasContablesEmpleadoRubro_reportProgressDesdeSqlServer',
                            {
                                myuserId: this.userId,
                                app: 'nomina',
                                process: 'leerCuentasContablesEmpleadoRubroDesdeSqlServer'
                            },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let cuentaContableEmpleadoRubro = lodash.clone(item);

            cuentaContableEmpleadoRubro._id = new Mongo.ObjectID()._str;
            cuentaContableEmpleadoRubro.user = Meteor.userId();

            // por alguna razón, sumarizarEnUnaPartidaFlag s small en sql server y no es convertido en forma
            // automática a boolean por sequelize (debería ser bit). Por eso, lo hacemos nosotros ...
            if (item.sumarizarEnUnaPartidaFlag) {
                cuentaContableEmpleadoRubro.sumarizarEnUnaPartidaFlag = true;
            } else {
                cuentaContableEmpleadoRubro.sumarizarEnUnaPartidaFlag = false;
            }

            Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.insert(cuentaContableEmpleadoRubro);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_leerCuentasContablesEmpleadoRubro_reportProgressDesdeSqlServer',
                                    {
                                        myuserId: this.userId,
                                        app: 'nomina',
                                        process: 'leerCuentasContablesEmpleadoRubroDesdeSqlServer'
                                    },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_leerCuentasContablesEmpleadoRubro_reportProgressDesdeSqlServer',
                                        {
                                            myuserId: this.userId,
                                            app: 'nomina',
                                            process: 'leerCuentasContablesEmpleadoRubroDesdeSqlServer'
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
