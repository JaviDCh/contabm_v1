
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment';
import numeral from 'numeral';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    nomina_rubrosAsignados_LeerDesdeSql: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });

        // if (!asientoContable || !asientoContable.docState) {
        //     throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        // };

        let where = "";

        if (lodash.isFinite(filtro2.monto1)) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (lodash.isFinite(filtro2.monto2)) {
                where += `(r.MontoAAplicar Between ${filtro2.monto1} And ${filtro2.monto2})`;
            }
            else
                where += `(r.MontoAAplicar = ${filtro2.monto1})`;
        };

        // el numero del pago es de tipo String (Q/M/U/E/V)
        if (filtro2.tipoNomina) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.tipoNomina.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(r.tipoNomina Like '${criteria}')`;
        };

        // el numero del pago es de tipo String (A/D)
        if (filtro2.tipo) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.tipo.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(r.tipo Like '${criteria}')`;
        };

        // el numero del pago es de tipo String (A/D)
        if (filtro2.periodicidad) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.periodicidad.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(r.periodicidad Like '${criteria}')`;
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

        if (filtro2.rubroAbreviatura) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.rubroAbreviatura.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(m.NombreCortoRubro Like '${criteria}')`;
        };

        if (filtro2.rubroDescripcion) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.rubroDescripcion.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(r.Descripcion Like '${criteria}')`;
        };


        if (filtro2.suspendido) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(r.SuspendidoFlag = 1)`;
        };

        if (filtro2.salario) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(r.SalarioFlag = 1)`;
        };

        if (filtro2.siempre) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(r.Siempre = 1)`;
        };

        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(e.Cia = ${ciaContab.toString()})`;

        if (!where)
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...


        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select r.RubroAsignado as rubroAsignado, r.Empleado as empleado, r.Rubro as rubro,
            	     r.Descripcion as descripcion, r.SuspendidoFlag as suspendidoFlag, r.Tipo as tipo,
            	     r.SalarioFlag as salarioFlag, r.TipoNomina as tipoNomina, r.Periodicidad as periodicidad,
            	     r.Desde as desde, r.Hasta as hasta, r.Siempre as siempre, r.MontoAAplicar as montoAAplicar
                     From tRubrosAsignados r
                     Inner Join tEmpleados e On r.Empleado = e.Empleado
                     Inner Join tMaestraRubros m On m.Rubro = r.Rubro
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
        Temp_Consulta_Nomina_RubrosAsignados.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('nomina_leerRubrosAsignados_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'nomina', process: 'leerNominaRubrosAsignadosDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let rubroAsignado = lodash.clone(item);

            rubroAsignado._id = new Mongo.ObjectID()._str;
            rubroAsignado.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            rubroAsignado.desde = rubroAsignado.desde ? moment(rubroAsignado.desde).add(TimeOffset, 'hours').toDate() : null;
            rubroAsignado.hasta = rubroAsignado.hasta ? moment(rubroAsignado.hasta).add(TimeOffset, 'hours').toDate() : null;

            Temp_Consulta_Nomina_RubrosAsignados.insert(rubroAsignado);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_leerRubrosAsignados_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'nomina', process: 'leerNominaRubrosAsignadosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_leerRubrosAsignados_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'nomina', process: 'leerNominaRubrosAsignadosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los rubros asignados han sido leídos desde sql server.";
    }
});
