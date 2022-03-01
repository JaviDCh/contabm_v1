

import moment from 'moment'; 
import numeral from 'numeral'; 

import { Monedas } from '/imports/collections/monedas';
import { TimeOffset } from '/globals/globals'; 
import { Companias } from '/imports/collections/companias';
import { Bancos } from '/imports/collections/bancos/bancos';
import { ParametrosBancos } from '/imports/collections/bancos/parametrosBancos'; 
import { Chequeras } from '/imports/collections/bancos/chequeras'; 
import { AsientosContables } from '/imports/collections/contab/asientosContables'; 
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 

Meteor.methods(
{
    bancos_itf_generarAsientoContable: function (ciaContab) {

        let currentUser = Meteor.user();
        let movimientosTipoITF_count = MovimientosBancarios.find({ docState: 1, user: currentUser._id }).count();

        if (movimientosTipoITF_count == 0) {
            throw new Meteor.Error("no-existen-registros",
                `Error: aparentemente, no se han agregado movimientos del tipo ITF, para los cuales construir un asiento contable. `);
        }
        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos parametrosGlobalBancos (pero en mongo) ...
        let parametrosGlobalBancos = ParametrosGlobalBancos.findOne();

        if (!parametrosGlobalBancos)
            throw new Meteor.Error("parametrosGlobalBancos",
                `Error: no existe un registro, o sus datos no se han definido, en la tabla <em>parámetros global bancos</em>.`);

        if (!parametrosGlobalBancos.agregarAsientosContables)
            throw new Meteor.Error("parametrosGlobalBancos",
                `Error: en la tabla <em>parámetros global bancos</em> se debe indicar que se desea agregar asientos en <em>Contab</em>.`);

        if (!parametrosGlobalBancos.tipoAsientoDefault)
            throw new Meteor.Error("parametrosGlobalBancos",
                `Error: en la tabla <em>parámetros global bancos</em> se debe indicar un tipo de asientos a usar <em>por defecto</em>.`);

        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos la compañía contab seleccionada
        let companiaContab = Companias.findOne(ciaContab);

        if (!companiaContab)
            throw new Meteor.Error("companiaContab-indefinida",
                `Error: no hemos podido leer la compañía <em>Contab</em> que se ha seleccionado.`);


        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos parametrosBancos (pero en mongo) ...
        let parametrosBancos = ParametrosBancos.findOne({ cia: companiaContab.numero }, { fields : { cuentaContableITF: 1 }});

        if (!parametrosBancos)
            throw new Meteor.Error("parametrosGlobalBancos",
                `Error: no existe un registro, o sus datos no se han definido, en la tabla
                <em>parámetros bancos</em>, para la <em>cia Contab</em> seleccionada.`);

        if (!parametrosBancos.cuentaContableITF)
            throw new Meteor.Error("parametrosGlobalBancos",
                `Error: en la tabla <em>parámetros bancos</em> se debe indicar la cuenta contable que se debe usar para
                        contabilizar el <em>impuesto ITF</em>.`);

        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios del tipo ITF, generados por el proceso para el usuario
        let movimientosITF = MovimientosBancarios.find({ docState: 1, user: currentUser._id }).fetch();

        // nótese como determinamos el último día del mes (wow javascript!!) ...
        let fechaAsiento = movimientosITF[0].fecha;
        fechaAsiento = new Date(fechaAsiento.getFullYear(), fechaAsiento.getMonth() + 1, 0);

        let mesFiscal = ContabFunctions.determinarMesFiscal(fechaAsiento, companiaContab.numero);

        if (mesFiscal.error) {
            throw new Meteor.Error("Contab-DeterminarMesFiscal",
                mesFiscal.errorMessage ? mesFiscal.errorMessage : "Error: mensaje de error indefinido.");
        };

        let factorCambio = ContabFunctions.leerCambioMonedaMasReciente(fechaAsiento);

        if (factorCambio.error) {
            throw new Meteor.Error("Contab-DeterminarMesFiscal",
                factorCambio.errorMessage ? factorCambio.errorMessage : "Error: mensaje de error indefinido.");
        };

        let numeroLote = moment(new Date()).format('YYYY-MM-DD hh:mm') + " " + currentUser.emails[0].address;
        if (numeroLote.length > 50)
            numeroLote = numeroLote.substring(0, 50);

        // debugger;
        // mongo: eliminamos los asientos que puedan existir para el usuario
        AsientosContables.remove({ user: this.userId });

        // a cada movimiento itf, asociamos su cuenta bancaria; la buscamos en chequeras ...
        movimientosITF.forEach((movimientoITF) => {
            // leemos la chequera (mongo) para obtener el número de cuenta bancaria ...
            let chequera = Chequeras.findOne({ numeroChequera: movimientoITF.claveUnicaChequera });
            if (!chequera) {
                throw new Meteor.Error("Chequera-no-encontrada",
                    `Error: no hemos podido encontrar una chequera para el movimiento bancario
                    '${movimientoITF.transaccion}'.<br />
                    Debe existir una chequera aunque sea 'genérica'. Nota: probablemente Ud. deba ejecutar la opción
                    <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
                );
            };
            movimientoITF.cuentaBancariaID = chequera.numeroCuenta;
        });

        // Ok, ahora que tenemos la cuenta bancaria en cada movimiento, agrupamos por cuenta bancaria y ejecutamos la
        // función que sigue para cada una (los movimientos de cada cuenta bancaria son pasados como un array)...
        movimientosITF_groupByCuentaBancaria = _.groupBy(movimientosITF, (x) => { return x.cuentaBancariaID; });

        let cantidadAsientosAgregados = 0;

        for (let cuentaBancariaID in movimientosITF_groupByCuentaBancaria) {

            bancos_itf_generarAsientoContable_movimientosCuentaBancaria (
                parametrosGlobalBancos.tipoAsientoDefault, parseInt(cuentaBancariaID),
                parametrosBancos.cuentaContableITF,
                fechaAsiento, mesFiscal.mesFiscal, mesFiscal.anoFiscal, factorCambio.factorCambio,
                numeroLote, currentUser, companiaContab, movimientosITF_groupByCuentaBancaria[cuentaBancariaID]
            );

            cantidadAsientosAgregados++;
        };


        return {
            cantidadAsientosAgregados: cantidadAsientosAgregados,
            cantidadMovimientosBancariosTipoITFLeidos: movimientosITF.length.toString(),
            numeroLote: numeroLote
        };
    }
});


function bancos_itf_generarAsientoContable_movimientosCuentaBancaria (
    tipoAsientoDefault, cuentaBancariaID, cuentaContableITF, fechaAsiento, mesFiscal, anoFiscal, factorCambio,
    numeroLote, currentUser, ciaContab, movimientosBancarios_ITF_cuentaBancaria
) {

    // debugger;
    let numeroNegativoAsiento = ContabFunctions.determinarNumeroNegativoAsiento(fechaAsiento, ciaContab.numero);

    if (numeroNegativoAsiento.error) {
        throw new Meteor.Error("Contab-ConstruirNumeroNegativo",
            numeroNegativoAsiento.errorMessage ? numeroNegativoAsiento.errorMessage : "Error: mensaje de error indefinido.");
    };

    // leemos cuenta bancaria, en mongo, para obtener cuenta contable y moneda; también banco para mostrar nombre en asiento
    let banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaInterna': cuentaBancariaID });

    if (!banco) {
        throw new Meteor.Error("Banco-no-encontrado",
            `Error: no hemos podido encontrar un banco para la cuenta bancaria
            '${cuentaBancariaID}'.<br />
            Debe existir una banco para esta cuenta bancaria en <em>Catálogos</em>. Nota: probablemente Ud. deba
            ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
        );
    };

    let cuentaBancaria = {};

    _.forEach(banco.agencias, (agencia) => {
        // la cuenta bancaria está en alguna de las agencias del banco ...
        cuentaBancaria = _.find(agencia.cuentasBancarias, (x) => { return x.cuentaInterna == cuentaBancariaID; });
        if (cuentaBancaria)
            return false;           // logramos un 'break' en el (lodash) forEach ..
    });

    let moneda = Monedas.findOne({ moneda: cuentaBancaria.moneda });

    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    let asientoContable = {
        // numeroAutomatico: ,
        numero: numeroNegativoAsiento.numeroNegativoAsiento,
        mes: mesCalendario,
        ano: anoCalendario,
        tipo: tipoAsientoDefault,
        fecha: fechaAsiento,
        descripcion: `Contabilización del ITF - ${banco.nombre} - ${moneda.simbolo} - ${cuentaBancaria.cuentaBancaria} `,
        moneda: moneda.moneda,
        monedaOriginal:moneda.moneda,
        convertirFlag:  true,
        factorDeCambio: factorCambio,
        provieneDe: "Bancos",
        // provieneDe_id:  ,
        ingreso: new Date(),
        ultAct:  new Date(),
        copiablaFlag: true,
        asientoTipoCierreAnualFlag: false,
        mesFiscal: mesFiscal,
        anoFiscal: anoFiscal,
        usuario: currentUser.emails[0].address,
        lote: numeroLote,
        cia: ciaContab.numero,
        };


    // ----------------------------------------------------------------------------------------------------------------
    // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
    let asientoContable_sql = _.cloneDeep(asientoContable);
    asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

    response = Async.runSync(function(done) {
        AsientosContables_sql.create(asientoContable_sql)
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let asientoAgregado = response.result.dataValues;

    // -----------------------------------------------------------------------------------------------------------
    // mongo: preparamos el objecto para agregar el asiento para el usuario (en mongo)
    let asientoContable_mongo = {
        _id: new Mongo.ObjectID()._str,
        numeroAutomatico: asientoAgregado.numeroAutomatico,
        numero: asientoContable.numero,
        mes: asientoContable.mes,
        ano: asientoContable.ano,
        tipo: asientoContable.tipo,
        fecha: asientoContable.fecha,
        descripcion: asientoContable.descripcion,
        moneda: asientoContable.moneda,
        monedaOriginal: asientoContable.monedaOriginal,
        convertirFlag: asientoContable.convertirFlag,
        factorDeCambio: asientoContable.factorDeCambio,
        partidas: [],
        provieneDe: asientoContable.provieneDe,
        // provieneDe_id: asientoContable.provieneDe_id,
        ingreso: asientoContable.ingreso,
        ultAct: asientoContable.ultAct,
        copiablaFlag: asientoContable.copiablaFlag,
        asientoTipoCierreAnualFlag: asientoContable.asientoTipoCierreAnualFlag,
        mesFiscal: asientoContable.mesFiscal,
        anoFiscal: asientoContable.anoFiscal,
        usuario: asientoContable.usuario,
        lote: asientoContable.lote,
        cia: asientoContable.cia,
        user: currentUser._id,
    };


    // ahora que agregamos el asiento, agrgamos sus partidas ...
    // TODO: revisar: nótese como agregamos solo los movimientos para la cuenta bancaria seleccionada;
    // esta cuenta bancaria es pasada a esta función, y sus movimientos también (como un array). Para tener los
    // movimientos, agregamos afuera la cuenta bancaria a los movimientos; agrupamos (lodash) por cuenta bancaria
    // y ejecutamos esta función para cada cuenta bancaria (y su array de movimientos) ...

    let numeroPartida = 10;

    movimientosBancarios_ITF_cuentaBancaria.forEach((movimientoITF) => {

        // primero agregamos el gasto a la cuenta contable definida para el itf
        let partidaAsiento = {
            numeroAutomatico: asientoAgregado.numeroAutomatico,
            partida: numeroPartida,
            cuentaContableID: cuentaContableITF,
            descripcion: `ITF: ${cuentaBancaria.cuentaBancaria} | ${moment(movimientoITF.fecha).format('DD-MM-YY')} | ${numeral(movimientoITF.monto).format('0,0.00')}`,
            referencia: movimientoITF.transaccion,
            debe: Math.abs((Math.round(movimientoITF.monto*100)/100)),     // redondeamos a 2 decimales y quitamos el '-'
            haber: 0,
        };

        response = Async.runSync(function(done) {
            dAsientosContables_sql.create(partidaAsiento)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // mongo: agregamos la partida al objeto que será grabado en mongo
        asientoContable_mongo.partidas.push({
            _id: new Mongo.ObjectID()._str,
            partida: partidaAsiento.partida,
            cuentaContableID: partidaAsiento.cuentaContableID,
            descripcion: partidaAsiento.descripcion,
            referencia: partidaAsiento.referencia,
            debe: partidaAsiento.debe,
            haber: partidaAsiento.haber,
        });

        numeroPartida = numeroPartida + 10;

        // ----------------------------------------------------------------------------------------------
        // ahora agregamos el crédito a la cuenta bancaria
        partidaAsiento = {
            numeroAutomatico: asientoAgregado.numeroAutomatico,
            partida: numeroPartida,
            cuentaContableID: cuentaBancaria.cuentaContable,
            descripcion: `ITF: ${cuentaBancaria.cuentaBancaria} | ${moment(movimientoITF.fecha).format('DD-MM-YY')} | ${numeral(movimientoITF.monto).format('0,0.00')}`,
            referencia: movimientoITF.transaccion,
            debe: 0,
            haber: Math.abs((Math.round(movimientoITF.monto*100)/100)),     // redondeamos a 2 decimales y quitamos el '-'
        };

        response = Async.runSync(function(done) {
            dAsientosContables_sql.create(partidaAsiento)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        // mongo: agregamos la partida al objeto que será grabado en mongo
        asientoContable_mongo.partidas.push({
            _id: new Mongo.ObjectID()._str,
            partida: partidaAsiento.partida,
            cuentaContableID: partidaAsiento.cuentaContableID,
            descripcion: partidaAsiento.descripcion,
            referencia: partidaAsiento.referencia,
            debe: partidaAsiento.debe,
            haber: partidaAsiento.haber,
        });

        numeroPartida = numeroPartida + 10;
    });

    // finalmente, cuando ya el asiento ha sido grabado en sql server, lo grabamos en mongo ...
    AsientosContables.insert(asientoContable_mongo);

    return { error: false };
};
