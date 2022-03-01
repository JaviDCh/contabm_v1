
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash';
import { Monedas } from '/imports/collections/monedas';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    contab_consulta_cuentasYSusMovimientos_LeerDesdeSql: function (filtro, ciaContab)
    {
        let filtro2 = JSON.parse(filtro);

        check(filtro2, Object);
        check(ciaContab, Number);
        check(moment(filtro2.desde).toDate(), Date);
        check(moment(filtro2.hasta).toDate(), Date);

        let desde = moment(filtro2.desde).toDate();
        let hasta = moment(filtro2.hasta).toDate();

        if (desde.getDate() != 1)
            throw new Meteor.Error(`Error: la fecha <em>inicial</em> del período de selección debe <b>siempre</b>
                                    corresponder a un <b>1ro. de mes</b>.
                                    Ejemplo: 1ro de Mayo, 1ro de Marzo, etc.
                                   `);

        // al final, este proceso lee saldos de cuentas contables sin asientos en el período; por eso construímos
        // también filtros para saldos y asientos (pues hacemos un subquery con asientos)

        let where = "";
        let whereAsientos = "";
        let whereSaldos = "";

        // desde y hasta siempre vienen, pues indican el período es requerido
        where = `(a.Fecha Between '${moment(desde).format('YYYY-MM-DD')}' And '${moment(hasta).format('YYYY-MM-DD')}')`;
        whereAsientos = `(a.Fecha Between '${moment(desde).format('YYYY-MM-DD')}' And '${moment(hasta).format('YYYY-MM-DD')}')`;

        if (filtro2.excluir_movimientosTipoCierreAnual) {
            where += ` And (a.AsientoTipoCierreAnualFlag Is Null Or a.AsientoTipoCierreAnualFlag = 0)`;
        };




        if (filtro2.cuentaContable) {
            if (where) where += " And "; else where = "(1 = 1) And ";
            if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
            if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";

            if (filtro2.cuentaContable.indexOf('*') > -1) {
                filtro2.cuentaContable = filtro2.cuentaContable.replace(new RegExp("\\*", 'g'), "%");
                where += `(c.Cuenta Like '${filtro2.cuentaContable}')`;
                whereAsientos += `(c.Cuenta Like '${filtro2.cuentaContable}')`;
                whereSaldos += `(c.Cuenta Like '${filtro2.cuentaContable}')`;
            } else {
                where += `(c.Cuenta = '${filtro2.cuentaContable}')`;
                whereAsientos += `(c.Cuenta = '${filtro2.cuentaContable}')`;
                whereSaldos += `(c.Cuenta = '${filtro2.cuentaContable}')`;
            };
        };

        if (filtro2.cuentaContableDescripcion) {
            if (where) where += " And "; else where = "(1 = 1) And ";
            if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
            if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";


            if (filtro2.cuentaContableDescripcion.indexOf('*') > -1) {
                filtro2.cuentaContableDescripcion = filtro2.cuentaContableDescripcion.replace(new RegExp("\\*", 'g'), "%");
                where += `(c.Descripcion Like '${filtro2.cuentaContableDescripcion}')`;
                whereAsientos += `(c.Descripcion Like '${filtro2.cuentaContableDescripcion}')`;
                whereSaldos += `(c.Descripcion Like '${filtro2.cuentaContableDescripcion}')`;
            } else {
                where += `(c.Descripcion = '${filtro2.cuentaContableDescripcion}')`;
                whereAsientos += `(c.Descripcion = '${filtro2.cuentaContableDescripcion}')`;
                whereSaldos += `(c.Descripcion = '${filtro2.cuentaContableDescripcion}')`;
            };
        };



        if (where) where += " And "; else where = "(1 = 1) And ";
        if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
        if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";

        where += `(a.Cia = ${ciaContab.toString()})`;
        whereAsientos += `(a.Cia = ${ciaContab.toString()})`;
        whereSaldos += `(s.Cia = ${ciaContab.toString()})`;


        if (_.isArray(filtro2.monedas) && filtro2.monedas.length > 0) {

            if (where) where += " And "; else where = "(1 = 1) And ";
            if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
            if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";

            let lista = "";

            filtro2.monedas.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";

            where += `(a.Moneda In ${lista})`;
            whereAsientos += `(a.Moneda In ${lista})`;
            whereSaldos += `(s.Moneda In ${lista})`;
        };

        if (_.isArray(filtro2.monedasOriginales) && filtro2.monedasOriginales.length > 0) {

            if (where) where += " And "; else where = "(1 = 1) And ";
            if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
            if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";

            let lista = "";

            filtro2.monedasOriginales.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";

            where += `(a.MonedaOriginal In ${lista})`;
            whereAsientos += `(a.MonedaOriginal In ${lista})`;
            whereSaldos += `(s.MonedaOriginal In ${lista})`;
        };

        if (_.isArray(filtro2.gruposContables) && filtro2.gruposContables.length > 0) {

            if (where) where += " And "; else where = "(1 = 1) And ";
            if (whereAsientos) whereAsientos += " And "; else whereAsientos = "(1 = 1) And ";
            if (whereSaldos) whereSaldos += " And "; else whereSaldos = "(1 = 1) And ";

            let lista = "";

            filtro2.gruposContables.forEach((m) => {
                if (!lista)
                    lista = "(" + m.toString();
                else
                    lista += ", " + m.toString();
            });

            lista += ")";

            where += `(c.Grupo In ${lista})`;
            whereAsientos += `(c.Grupo In ${lista})`;
            whereSaldos += `(c.Grupo In ${lista})`;
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


        // lo primero que hacemos es leer los asientos contables; agrupamos por cuenta y moneda y agregamos
        // al collection; para cada combinación cuenta-moneda, leemos y agregamos el saldo contable
        // debugger;
        let query = `Select d.CuentaContableID as cuentaContableID, d.Partida as partida,
                    d.Descripcion as descripcionPartida,
                    d.Referencia as referencia, d.Debe as debe, d.Haber as haber,
                    a.Numero as numeroAsiento, a.Tipo as tipoAsiento, a.Fecha as fecha,
                    a.Moneda as moneda, a.MonedaOriginal as monedaOriginal,
                    a.AsientoTipoCierreAnualFlag as asientoTipoCierreAnualFlag,
                    c.Cuenta as cuentaContable, c.Descripcion as nombreCuentaContable,
                    a.Cia as cia
                    From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                    Inner Join CuentasContables c On d.CuentaContableID = c.ID
                    Where ${where} And ${filtroDefinidoUsuario}
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
        Temp_Consulta_Contab_CuentasYSusMovimientos.remove({ user: this.userId });
        Temp_Consulta_Contab_CuentasYSusMovimientos2.remove({ user: this.userId });

        // agrupamos todos los movimientos leídos por cuenta contable (ID)
        let movimientosArray_groupByCuentaContable = lodash.groupBy(response.result, "cuentaContableID");

        // creamos un array con las monedas, para agregarlas al mongo collection (sin tener que leer cada vez)
        let monedas = Monedas.find().fetch();

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = lodash.size(movimientosArray_groupByCuentaContable);
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;

        let numberOfProcess = 4;
        let currentProcess = 1;
        EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                            message: `leyendo los movimientos que corresponden al período ... ` });
        // -------------------------------------------------------------------------------------------------------------
        for(cuentaContableID in movimientosArray_groupByCuentaContable) {

            let itemsPorCuentaContable = movimientosArray_groupByCuentaContable[cuentaContableID];

            // los movimientos de cada cuenta contable, son agrupados, a su vez, por moneda
            let movimientosArray_groupByMoneda = lodash.groupBy(itemsPorCuentaContable, "moneda");

            for(monedaID in movimientosArray_groupByMoneda) {

                // grupo de asientos para una cuenta contable y moneda en particular
                let itemsPorCuentaContableYMoneda = movimientosArray_groupByMoneda[monedaID];

                // obtenemos el 1er. item del grupo, para que resulte más fácil construir el registro ...
                let firstItemInGroup = itemsPorCuentaContableYMoneda[0];

                let cuentaContable_moneda = {};

                cuentaContable_moneda._id = new Mongo.ObjectID()._str;

                cuentaContable_moneda.cuentaContableID = firstItemInGroup.cuentaContableID;
                cuentaContable_moneda.cuentaContable = firstItemInGroup.cuentaContable;
                cuentaContable_moneda.nombreCuentaContable = firstItemInGroup.nombreCuentaContable;
                cuentaContable_moneda.monedaID = firstItemInGroup.moneda;
                cuentaContable_moneda.simboloMoneda =
                    lodash.find(monedas, (m) => { return m.moneda === firstItemInGroup.moneda; }).simbolo;
                cuentaContable_moneda.cantidadMovimientos = 0;
                cuentaContable_moneda.saldoInicial = 0;
                cuentaContable_moneda.debe = 0;
                cuentaContable_moneda.haber = 0;
                cuentaContable_moneda.saldoFinal = 0;
                cuentaContable_moneda.cia = firstItemInGroup.cia;
                cuentaContable_moneda.user = Meteor.userId();

                // -------------------------------------------------------------------------------------
                // agregamos el item para la cuenta contable y moneda
                let itemCuentaContableID = Temp_Consulta_Contab_CuentasYSusMovimientos.insert(cuentaContable_moneda);

                itemsPorCuentaContableYMoneda.forEach((partida) => {

                    let movimiento = {};

                    movimiento._id = new Mongo.ObjectID()._str;

                    movimiento.registroCuentaContableID = itemCuentaContableID;
                    // revertimos la 'localización' en sequelize ...
                    movimiento.fecha = moment(partida.fecha).add(TimeOffset, 'hours').toDate();
                    movimiento.numeroAsiento = partida.numeroAsiento;
                    movimiento.tipoAsiento = partida.tipoAsiento;
                    movimiento.monedaOriginalID = partida.monedaOriginal;
                    movimiento.simboloMonedaOriginal =
                        lodash.find(monedas, (m) => { return m.moneda === partida.monedaOriginal; }).simbolo;
                    movimiento.descripcion = partida.descripcionPartida;
                    movimiento.referencia = partida.referencia;
                    movimiento.debe = partida.debe;
                    movimiento.haber = partida.haber;
                    movimiento.monto = partida.debe - partida.haber;
                    movimiento.asientoTipoCierreAnualFlag = partida.asientoTipoCierreAnualFlag;
                    movimiento.user = Meteor.userId();

                    Temp_Consulta_Contab_CuentasYSusMovimientos2.insert(movimiento);
                });
            };

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                    message: `leyendo los movimientos que corresonden al período ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                        message: `leyendo los movimientos que corresonden al período ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        };



        // -------------------------------------------------------------------------------------------------------------
        // paso 2: ahora debemos leer el saldo que corresponde al mes fiscal 'anterior' a la fecha de inicio del período
        // antes, determinamos el mes y año fiscal y luego el 'nombre' de la columna en la tabla de saldos ...
        let mesFiscal = ContabFunctions.determinarMesFiscal(desde, ciaContab);
        let nombreColumnaMesFiscalAnterior_TablaSaldos = ContabFunctions.nombreMesFiscalTablaSaldos(mesFiscal.mesFiscal);

        query = `Select Sum(${nombreColumnaMesFiscalAnterior_TablaSaldos.nombreMesFiscalAnterior}) as montoSaldoAnterior
                From SaldosContables
                Where CuentaContableID = ? And Moneda = ? And Ano = ?
                `;

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).count();
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 2;
        EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                            message: `leyendo los saldos anteriores para cada cuenta y moneda ... ` });
        // -------------------------------------------------------------------------------------------------------------

        Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).forEach((cuentaMonedaItem) => {

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ cuentaMonedaItem.cuentaContableID, cuentaMonedaItem.monedaID, mesFiscal.anoFiscal ],
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            let saldoAnterior = response.result[0].montoSaldoAnterior;

            Temp_Consulta_Contab_CuentasYSusMovimientos.update(
                { _id: cuentaMonedaItem._id },
                { $set: { saldoInicial: saldoAnterior ? saldoAnterior : 0 }}
            );

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                    message: `leyendo los saldos anteriores para cada cuenta y moneda ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                        message: `leyendo los saldos anteriores para cada cuenta y moneda ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // leer y agregar al collection saldos de cuentas contables sin movimientos en el período indicado;
        // nótese que, en cierta forma, la idea es leer saldos de cuentas que no se leyeron en el paso
        // anterior, pues no tuvieron asientos en Asientos/dAsientos ...
        if (!filtro2.excluir_sinMovimientosEnElPeriodo) {
            query = `Select s.CuentaContableID as cuentaContableID, s.Moneda as moneda,
                    Sum(${nombreColumnaMesFiscalAnterior_TablaSaldos.nombreMesFiscalAnterior}) as montoSaldoAnterior,
                    c.Cuenta as cuentaContable, c.Descripcion as nombreCuentaContable,
                    s.Cia as cia
                    From SaldosContables s Inner Join CuentasContables c On s.CuentaContableID = c.ID
                    Where ${whereSaldos} And ${filtroDefinidoUsuario} And c.TotDet = 'D'
                    And s.Ano = ?
                    And s.CuentaContableID Not In
                    ( Select d.CuentaContableID
                      From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                      Inner Join CuentasContables c On d.CuentaContableID = c.ID
                      Where ${whereAsientos} And ${filtroDefinidoUsuario}
                      Group by d.CuentaContableID
                    )
                    Group By s.CuentaContableID, s.Moneda, c.Cuenta, c.Descripcion, s.Cia
                    `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ mesFiscal.anoFiscal ],
                        type: sequelize.QueryTypes.SELECT
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        }
        else {
            response.result = [];
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        numberOfItems = response.result.length;
        reportarCada = Math.floor(numberOfItems / 30);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 3;

        EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                            message: `agregando saldos de cuentas sin movimientos en el período ... ` });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((saldoItem) => {

            let saldoContableSinAsientos = {};

            saldoContableSinAsientos._id = new Mongo.ObjectID()._str;

            saldoContableSinAsientos.cuentaContableID = saldoItem.cuentaContableID;
            saldoContableSinAsientos.cuentaContable = saldoItem.cuentaContable;
            saldoContableSinAsientos.nombreCuentaContable = saldoItem.nombreCuentaContable;
            saldoContableSinAsientos.monedaID = saldoItem.moneda;
            saldoContableSinAsientos.simboloMoneda =
                lodash.find(monedas, (m) => { return m.moneda === saldoItem.moneda; }).simbolo;
            saldoContableSinAsientos.cantidadMovimientos = 0;
            saldoContableSinAsientos.saldoInicial = saldoItem.montoSaldoAnterior;
            saldoContableSinAsientos.debe = 0;
            saldoContableSinAsientos.haber = 0;
            saldoContableSinAsientos.saldoFinal = 0;
            saldoContableSinAsientos.cia = saldoItem.cia;
            saldoContableSinAsientos.user = Meteor.userId();

            // ahora este array, que aquí se graba vacío, es grabado en una tabla separada ...
            // saldoContableSinAsientos.movimientos = [];

            // agregamos el item al collection en mongo
            Temp_Consulta_Contab_CuentasYSusMovimientos.insert(saldoContableSinAsientos);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                    message: `agregando saldos de cuentas sin movimientos en el período ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                        message: `agregando saldos de cuentas sin movimientos en el período ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });




        // -------------------------------------------------------------------------------------------------------------
        numberOfItems = Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).count();
        reportarCada = Math.floor(numberOfItems / 25);
        reportar = 0;
        cantidadRecs = 0;
        currentProcess = 4;
        EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                            { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                            message: `determinando el saldo actual ... ` });
        // -------------------------------------------------------------------------------------------------------------

        // finalmente, recorremos el collection y calculamos: cant movtos, debe, haber y saldo actual ...
        Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).forEach((cuentaMonedaItem) => {

            // leemos los movimientos para la cuenta en una tabla separada ...
            let movimientosCuentaContable = Temp_Consulta_Contab_CuentasYSusMovimientos2.find({
                user: this.userId,
                registroCuentaContableID: cuentaMonedaItem._id,
            }).fetch();

            cuentaMonedaItem.cantidadMovimientos = movimientosCuentaContable.length;
            cuentaMonedaItem.debe = lodash.sumBy(movimientosCuentaContable, 'debe');
            cuentaMonedaItem.haber = lodash.sumBy(movimientosCuentaContable, 'haber');
            cuentaMonedaItem.saldoFinal = cuentaMonedaItem.saldoInicial + cuentaMonedaItem.debe - cuentaMonedaItem.haber;

            Temp_Consulta_Contab_CuentasYSusMovimientos.update(
                { _id: cuentaMonedaItem._id },
                { $set: {
                    cantidadMovimientos: cuentaMonedaItem.cantidadMovimientos,
                    debe: cuentaMonedaItem.debe,
                    haber: cuentaMonedaItem.haber,
                    saldoFinal: cuentaMonedaItem.saldoFinal,
                }}
            );

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                    { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                    { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                    message: `determinando el saldo actual ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_consulta_cuentasYSusMovimientos_reportProgress',
                                        { myuserId: this.userId, app: 'contab', process: 'consulta_cuentasYSusMovimientos' },
                                        { current: currentProcess, max: numberOfProcess, progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                        message: `determinando el saldo actual ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------

        });


        // eliminamos cuentas con saldo inicial en cero y sin movimientos
        if (filtro2.excluir_conSaldoCeroYSinMovimientos) {
            Temp_Consulta_Contab_CuentasYSusMovimientos.remove(
                {
                    saldoInicial: 0,
                    cantidadMovimientos: { $eq: 0 },
                    user: this.userId,
                }
            );
        };

        // eliminamos cuentas con saldo inicial y final en cero
        if (filtro2.excluir_conSaldoInicialYFinalEnCero) {
            Temp_Consulta_Contab_CuentasYSusMovimientos.remove(
                {
                    saldoInicial: 0,
                    saldoFinal: 0,
                    user: this.userId,
                }
            );
        };

        // eliminamos cuentas con saldo final en cero
        if (filtro2.excluir_conSaldoFinalEnCero) {
            Temp_Consulta_Contab_CuentasYSusMovimientos.remove(
                {
                    saldoFinal: 0,
                    user: this.userId,
                }
            );
        };

        return Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).count().toString();
    }
});
