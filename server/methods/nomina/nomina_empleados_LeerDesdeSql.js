
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash';
import moment from 'moment';
import numeral from 'numeral'; 
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    nomina_empleados_LeerDesdeSql: function (filtro, ciaContab) {

        // debugger;
        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);

        // if (!asientoContable || !asientoContable.docState) {
        //     throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        // };

        let where = "";

        if (filtro2.fechaIngreso1) {
            if (filtro2.fechaIngreso2) {
                where = `(e.FechaIngreso Between '${moment(filtro2.fechaIngreso1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaIngreso2).format('YYYY-MM-DD')}')`;
            }
            else
                where = `(e.FechaIngreso = '${moment(filtro2.fechaIngreso1).format('YYYY-MM-DD')}')`;
        };

        if (filtro2.fechaRetiro1) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.fechaRetiro2) {
                where += `(e.FechaRetiro Between '${moment(filtro2.fechaRetiro1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaRetiro2).format('YYYY-MM-DD')}')`;
            }
            else
                where += `(e.FechaRetiro = '${moment(filtro2.fechaRetiro1).format('YYYY-MM-DD')}')`;
        };

        if (filtro2.nombre) {
            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*' que el usuario haya agregado
            let criteria = filtro2.nombre.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            // if (filtro2.nombre.indexOf('*') > -1) {
            //     filtro2.nombre = filtro2.nombre.replace(new RegExp("\\*", 'g'), "%");
            //     where += ` (e.Nombre Like '${criteria}')`;
            // } else {
            //     where += ` (e.Nombre = '${filtro2.nombre}')`;
            // };

            where += `(e.Nombre Like '${criteria}')`;
        };

        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(Cia = ${ciaContab.toString()})`;


        if (_.isArray(filtro2.cargos) && filtro2.cargos.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let cargosLista = "";

            filtro2.cargos.forEach((m) => {
                if (!cargosLista)
                    cargosLista = "(" + m.toString();
                else
                    cargosLista += ", " + m.toString();
            });

            cargosLista += ")";
            where += ` (e.Cargo In ${cargosLista})`;
        };


        if (_.isArray(filtro2.departamentos) && filtro2.departamentos.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let departamentosLista = "";

            filtro2.departamentos.forEach((p) => {
                if (!departamentosLista)
                    departamentosLista = `('${p}'`;
                else
                    departamentosLista += `, '${p}'`;
            });

            departamentosLista += ")";
            where += ` (e.Departamento In ${departamentosLista})`;
        };



        if (_.isArray(filtro2.tiposNomina) && filtro2.tiposNomina.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.tiposNomina.forEach((p) => {
                if (!lista)
                    lista = `(${p}`;
                else
                    lista += `, ${p}`;
            });

            lista += ")";
            where += ` (e.TipoNomina In ${lista})`;
        };


        if (_.isArray(filtro2.situacionActual) && filtro2.situacionActual.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.situacionActual.forEach((p) => {
                if (!lista)
                    lista = `('${p}'`;
                else
                    lista += `, '${p}'`;
            });

            lista += ")";
            where += ` (e.SituacionActual In ${lista})`;
        };


        if (_.isArray(filtro2.estados) && filtro2.estados.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.estados.forEach((p) => {
                if (!lista)
                    lista = `('${p}'`;
                else
                    lista += `, '${p}'`;
            });

            lista += ")";
            where += ` (e.Status In ${lista})`;
        };


        if (!where)
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...


        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)

        let query = `Select e.Empleado as empleado, e.Nombre as nombre, e.Cedula as cedula,
                    e.FechaIngreso as fechaIngreso, e.FechaRetiro as fechaRetiro,
                    d.Descripcion as departamento, c.Descripcion as cargo,
                    e.TipoNomina as tipoNomina,
                    e.SituacionActual as situacionActual, e.email as email, e.status,
                    e.Cia as cia
                    From tEmpleados e Inner Join tCargos c On e.Cargo = c.Cargo
                    Inner Join tDepartamentos d On e.Departamento = d.Departamento
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
        Temp_Consulta_Empleados.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('nomina_leerNominaEmpleadosDesdeSqlServer_reportProgress',
                            { myuserId: this.userId, app: 'nomina', process: 'leerNominaEmpleadosDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields adicionales que existen en mongo ...

            let empleado = lodash.clone(item);

            empleado._id = new Mongo.ObjectID()._str;
            empleado.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:30, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...

            empleado.fechaIngreso = empleado.fechaIngreso ? moment(empleado.fechaIngreso).add(TimeOffset, 'hours').toDate() : null;
            empleado.fechaRetiro = empleado.fechaRetiro ? moment(empleado.fechaRetiro).add(TimeOffset, 'hours').toDate() : null;

            switch(empleado.situacionActual) {
                case 'NO':
                    empleado.situacionActual = 'Normal';
                    break;
                case 'VA':
                    empleado.situacionActual = 'Vacaciones';
                    break;
                case 'RE':
                    empleado.situacionActual = 'Retirado';
                    break;
                case 'LI':
                    empleado.situacionActual = 'Liquidado';
                    break;
                default:
                    empleado.situacionActual = 'Indefinido';
            };

            switch(empleado.status) {
                case 'A':
                    empleado.status = 'Activo';
                    break;
                case 'S':
                    empleado.status = 'Suspendido';
                    break;
                default:
                    empleado.status = 'Indefinido';
            };

            switch(empleado.tipoNomina) {
                case 1:
                    empleado.tipoNomina = 'Quincenal';
                    break;
                case 2:
                    empleado.tipoNomina = 'Mensual';
                    break;
                case 3:
                    empleado.tipoNomina = 'Otra';
                    break;
                default:
                    empleado.tipoNomina = 'Indefinido';
            };

            Temp_Consulta_Empleados.insert(empleado);

            // Temp_Consulta_Empleados.insert(empleado, function (error, result) {
            //     if (error)
            //         throw new Meteor.Error("validationErrors", error.invalidKeys.toString());
            // });

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('nomina_leerNominaEmpleadosDesdeSqlServer_reportProgress',
                                    { myuserId: this.userId, app: 'nomina', process: 'leerNominaEmpleadosDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('nomina_leerNominaEmpleadosDesdeSqlServer_reportProgress',
                                        { myuserId: this.userId, app: 'nomina', process: 'leerNominaEmpleadosDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, los empleados han sido leídos desde sql server.";
    }
});
