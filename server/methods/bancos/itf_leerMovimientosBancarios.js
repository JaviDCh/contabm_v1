

import moment from 'moment'; 
import numeral from 'numeral'; 

import { Companias } from '/imports/collections/companias';
import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Bancos } from '/imports/collections/bancos/bancos';
import { Chequeras } from '/imports/collections/bancos/chequeras'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    bancos_itf_leerMovimientosBancarios: function (parametros, ciaContab) {

        // debugger;
        check(parametros, Object);
        check(parametros.desde, Date);
        check(parametros.hasta, Date);
        check(ciaContab, String);

        // leemos la compañía en mongo; nótese como usamos el _id (mongo) y no el número (sql). Siempre nos aseguramos que este _id
        // (mongo) sea el mismo, aunque los 'catálogos' se vuelvan a copiar, n veces, desde Contab (sql) ...
        let compania = Companias.findOne({ _id: ciaContab });

        if (!compania)
            throw new Meteor.Error("CiaContab-no-encontrada", "Error: la cia contab seleccionada no pudo ser leída en la base de datos (mongo).");


        // antes de intentar leer los movimientos bancarios, debemos validar que el mes no esté cerrado ni en bancos ni en contab ...
        let validar = ContabFunctions.validarMesCerradoEnContab(parametros.desde, compania.numero);

        if (validar && validar.error)
            if (validar.errMessage)
                throw new Meteor.Error("error-validacion", validar.errMessage);
            else
                throw new Meteor.Error("error-validacion", "Error: mensaje de error indefinido (?!?).");


        validar = BancosFunctions.validarMesCerradoEnBancos(parametros.desde, compania.numero);

        if (validar && validar.error)
            if (validar.errMessage)
                throw new Meteor.Error("error-validacion", validar.errMessage);
            else
                throw new Meteor.Error("error-validacion", "Error: mensaje de error indefinido (?!?).");

        let response = null;

        let filter = {};

        filter = {
            Monto: { $lt: 0 },
            $and: [
                { Fecha: { $gte: parametros.desde } },
                { Fecha: { $lte: parametros.hasta } },
            ],
        };

        let filterCuentasBancarias = { Cia: compania.numero };

        if (_.isArray(parametros.cuentasBancarias) && parametros.cuentasBancarias.length)
            filterCuentasBancarias.cuentaInterna = { $in: parametros.cuentasBancarias };


        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)
        response = Async.runSync(function(done) {
            MovimientosBancarios_sql.findAndCountAll({
                where: filter,
                include: [{
                    model: Chequeras_sql,
                    as: 'chequera',
                    include: [ {
                        model: CuentasBancarias_sql,
                        as: 'cuentaBancaria',
                        where: filterCuentasBancarias }] },
                ],
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // nótese que el proceso agrega movimientos para el usuario. Antes eliminamos los que puedan exisitr ...
        MovimientosBancarios.remove({ user: this.userId });


        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.count;
        let reportarCada = Math.floor(numberOfItems / 20);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_agregarMovimientos_ITF_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'agregarMovimientos_ITF' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.rows.forEach((item) => {

            let movimientoBancario = {
                _id: new Mongo.ObjectID()._str,
                transaccion: item.dataValues.transaccion,
                tipo: item.dataValues.tipo,
                // sequelize 'localiza' el time; para revertir, agregamos 4:30 horas ...
                fecha: moment(item.dataValues.fecha).add({ 'hours': 4, 'minutes': 30 }).toDate(),
                provClte: item.dataValues.provClte,
                beneficiario: item.dataValues.beneficiario,
                concepto: item.dataValues.concepto,

                signo: item.dataValues.signo,
                montoBase: item.dataValues.montoBase,
                comision: item.dataValues.comision,
                impuestos: item.dataValues.impuestos,

                monto: item.dataValues.monto,

                ingreso: moment(item.dataValues.ingreso).add({ 'hours': 4, 'minutes': 30 }).toDate(),
                ultMod: moment(item.dataValues.ultMod).add({ 'hours': 4, 'minutes': 30 }).toDate(),

                usuario: item.dataValues.usuario,

                claveUnica: item.dataValues.claveUnica,
                claveUnicaChequera: item.dataValues.claveUnicaChequera,
                fechaEntregado: item.dataValues.fechaEntregado,
                user: this.userId,
            };

            MovimientosBancarios.insert(movimientoBancario);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_agregarMovimientos_ITF_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'agregarMovimientos_ITF' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_agregarMovimientos_ITF_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'agregarMovimientos_ITF' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });


        // -------------------------------------------------------------------------------------------------------
        // TODO: recorrer el collection; marcar los que no contengan ya un itf ...
        // aprovechamos para agregar el banco y la cuenta bancaria; no es necesario, solo para que estén allí y mostrarlos al usuario ...
        let movimientosBancarios = MovimientosBancarios.find({ user: this.userId }).forEach((movimiento) => {

            let cuentaBancaria = {};
            let banco = {};

            let chequera = Chequeras.findOne({ numeroChequera: movimiento.claveUnicaChequera });

            if (chequera) {
                // ahora, leemos el banco, usando el número de cuenta en la chequera
                banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaInterna': chequera.numeroCuenta });
                // el banco tiene un arregla de agencias; cada agencia tiene un arregla de cuentas bancarias
                if (banco) {
                    _.forEach(banco.agencias, (agencia) => {

                        cuentaBancaria = _.find(agencia.cuentasBancarias, (x) => { return x.cuentaInterna === chequera.numeroCuenta; });

                        if (cuentaBancaria)
                            return false;           // para salir del forEach ... (solo en lodash)
                    });
                };
            };

            let agregarITF = false;

            // solo si el movimiento NO ES itf, buscamos a ver si ya tiene un itf; solo intentamos agregar itf para movimientos
            // que no lo tienen ya ...
            if (movimiento.tipo != 'IT') {

                let movimientoITF = MovimientosBancarios.findOne({
                    user: this.userId,
                    tipo: { $eq: 'IT' },
                    transaccion: movimiento.transaccion });

                if (!movimientoITF)
                    agregarITF = true
            };

            MovimientosBancarios.update({ _id: movimiento._id }, { $set: {
                agregarITF: agregarITF,
                banco: banco && !_.isEmpty(banco) ? banco.abreviatura : null,
                cuentaBancaria: cuentaBancaria && !_.isEmpty(cuentaBancaria) ? cuentaBancaria.cuentaBancaria : null
            }});

        });


        return "Ok, los movimientos bancarios han sido seleccionados.";
    }
});
