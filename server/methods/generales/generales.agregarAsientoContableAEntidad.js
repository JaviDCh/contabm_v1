
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment';
import lodash from 'lodash';
import SimpleSchema from 'simpl-schema';

import { Monedas } from '/imports/collections/monedas';
import { Companias } from '/imports/collections/companias';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 

import { TimeOffset } from '/globals/globals'; 
import { CajaChica_Reposiciones_sql, 
         CajaChica_Parametros_sql, 
         CajaChica_CajasChicas_sql, 
         CajaChica_Reposiciones_Gastos_sql, 
         CajaChica_RubrosCuentasContables } from '../../imports/sqlModels/bancos/cajasChicas';

import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 

import { Monedas_sql } from '../../imports/sqlModels/monedas'; 
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Bancos } from '/imports/collections/bancos/bancos';

Meteor.methods({
   'generales.agregarAsientoContableAEntidad': function (provieneDe, provieneDe_ID, ciaContabSeleccionada_ID) {

       // agregamos el asiento que corresponde al registro de una entidad, por ejemplo: factura, pago, nómina,
       // movimiento bancario, etc.

       // cuando el parámetro proviene2 es 'facturas_retencion_impuestos', este proceso genera el asiento contable para 
       // una factura, pero, en particular, el que corresponde a las retenciones de impuesto ... 

        new SimpleSchema({
           provieneDe: { type: String, optional: false, },
           provieneDe_ID: { type: SimpleSchema.Integer, optional: false, },
           ciaContabSeleccionada_ID: { type: SimpleSchema.Integer, optional: false, },
       }).validate({ provieneDe, provieneDe_ID, ciaContabSeleccionada_ID, });

       let currentUser = Meteor.user();
       let entidadOriginal = {};

       // leemos la 'entidad' (mov banc, factura, pago, etc.) usando el pk que recibimos en este método
       switch (provieneDe) {
           case "Bancos": { 
                let leerMovimientoBancario = leerMovimientoBancarioDesdeSqlServer(provieneDe_ID);
                if (leerMovimientoBancario.error)
                    return {
                        error: true,
                        message: leerMovimientoBancario.message
                    };
                entidadOriginal = leerMovimientoBancario.movimientoBancario;
                break;
           }
            case "Facturas": { 
                let leerFactura = leerFacturaDesdeSqlServer(provieneDe_ID);
                if (leerFactura.error)
                     return {
                         error: true,
                         message: leerFactura.message
                     };
                 entidadOriginal = leerFactura.factura;
                 break;
            }
            case "Caja chica": { 
                let leerCajaChicaReposicion = leerCajaChica_Reposicion_DesdeSqlServer(provieneDe_ID);
                if (leerCajaChicaReposicion.error)
                     return {
                         error: true,
                         message: leerCajaChicaReposicion.message
                     };
                 entidadOriginal = leerCajaChicaReposicion.reposicion;
                 break;
            }
            case "Facturas - Retenciones de impuesto": { 
                // primero  leemos el id de la factura que corresponde a la retención 
                let facturaID = leerFacturaID(provieneDe_ID); 

                // ahora podemos leer la factura pues tenemos su id 
                let leerFactura = leerFacturaDesdeSqlServer(facturaID);
                if (leerFactura.error)
                     return {
                         error: true,
                         message: leerFactura.message
                     };

                 entidadOriginal = leerFactura.factura;

                 break;
            }
           default: { 
            return {
                error: true,
                message: `Error: el valor pasado a esta función para 'provieneDe' (${provieneDe}) no es válido.
                          Por favor revise.`
            };
           } 
       }


       // ----------------------------------------------------------------------------------------------------------------------------
       // leemos parametrosGlobalBancos (pero en mongo) ...
       let parametrosGlobalBancos = ParametrosGlobalBancos.findOne();

       if (!parametrosGlobalBancos) {
           return {
               error: true,
               message: `Error: no existe un registro, o sus datos no se han definido,
                         en la tabla <em>parámetros global bancos</em>.`
           };
       }

       if (!parametrosGlobalBancos.agregarAsientosContables) {
           return {
               error: true,
               message: `Error: en la tabla <em>parámetros global bancos</em> se debe indicar que se
                         desea agregar asientos en <em>Contab</em>.`
           };
       }

       if (!parametrosGlobalBancos.tipoAsientoDefault) {
           return {
               error: true,
               message: `Error: en la tabla <em>parámetros global bancos</em> se debe indicar un
                         tipo de asientos a usar <em>por defecto</em>.`
           };
       }

       let tipoAsientoDefault = parametrosGlobalBancos.tipoAsientoDefault;

       // ----------------------------------------------------------------------------------------------------------------------------
       // leemos la compañía contab seleccionada
       let companiaContab = Companias.findOne({ numero: ciaContabSeleccionada_ID });

       if (!companiaContab) {
           return {
               error: true,
               message: `Error inesperado: no hemos podido leer la compañía <em>Contab</em> que se ha seleccionado`
           };
       }


       let fechaAsiento = null;

       switch (provieneDe) {
           case 'Bancos':
               fechaAsiento = entidadOriginal.fecha;
               break;
           case 'Facturas':
                if (entidadOriginal.cxCCxPFlag === 1) {
                    fechaAsiento = entidadOriginal.fechaRecepcion;      // cxp
                } else {
                    fechaAsiento = entidadOriginal.fechaEmision;        // cxc
                }

               break;
            case 'Caja chica':
               fechaAsiento = entidadOriginal.fecha;
               break;

            case 'Facturas - Retenciones de impuesto': { 
                // para asientos de retenciones de impuesto, la fecha siempre es la fecha de recepción de la planilla 
                let retencion = entidadOriginal.impuestosRetenciones.find(x => x.id === provieneDe_ID); 

                fechaAsiento = retencion.fechaRecepcionPlanilla ? retencion.fechaRecepcionPlanilla : null;

                break;
            }

           default:
       }


       // ----------------------------------------------------------------------------------------------
       // nótese como determinamos el último día del mes (wow javascript!!) ...
       // fechaAsiento = new Date(fechaAsiento.getFullYear(), fechaAsiento.getMonth() + 1, 0);
       let mesFiscal = ContabFunctions.determinarMesFiscal(fechaAsiento, companiaContab.numero);

       if (mesFiscal.error) {
           return {
               error: true,
               message: mesFiscal.errorMessage ? mesFiscal.errorMessage : "Error: mensaje de error indefinido."
           };
       }

       let factorCambio = ContabFunctions.leerCambioMonedaMasReciente(fechaAsiento);

       if (factorCambio.error) {
           return {
               error: true,
               message: factorCambio.errorMessage ? factorCambio.errorMessage : "Error: mensaje de error indefinido."
           };
       }

       // validamos el mes cerrado en Contab
       let validarMesCerradoContab = ContabFunctions.validarMesCerradoEnContab(fechaAsiento, companiaContab.numero);

       if (validarMesCerradoContab && validarMesCerradoContab.error) {
           if (validarMesCerradoContab.errMessage) {
               return {
                   error: true,
                   message: validarMesCerradoContab.errMessage
               };
           } else {
               throw new Meteor.Error("error-validacion", "Error: mensaje de error indefinido (?!?).");
           }
       }


       // --------------------------------------------------------------------------------------
       // agregamos el asiento contable ...
       let numeroNegativoAsiento = ContabFunctions.determinarNumeroNegativoAsiento(fechaAsiento, companiaContab.numero);

       if (numeroNegativoAsiento.error) {
           return {
               error: true,
               message: numeroNegativoAsiento.errorMessage ? numeroNegativoAsiento.errorMessage : "Error: mensaje de error indefinido."
           };
       }


       let agregarAsientoContable = null;

       switch (provieneDe) {
           case "Bancos": { 
                agregarAsientoContable = agregarAsientoContable_MovimientoBancario(entidadOriginal,
                    tipoAsientoDefault,
                    companiaContab,
                    fechaAsiento,
                    mesFiscal,
                    factorCambio,
                    numeroNegativoAsiento,
                    provieneDe_ID,
                    currentUser);
                break;
           }
           case "Facturas": { 
                agregarAsientoContable = agregarAsientoContable_Factura(entidadOriginal,
                    tipoAsientoDefault,
                    companiaContab,
                    fechaAsiento,
                    mesFiscal,
                    factorCambio,
                    numeroNegativoAsiento,
                    provieneDe_ID,
                    currentUser);
                break;  
           }
           case "Caja chica": { 
                agregarAsientoContable = agregarAsientoContable_CajaChica_Reposicion(entidadOriginal,
                    companiaContab,
                    fechaAsiento,
                    mesFiscal,
                    factorCambio,
                    numeroNegativoAsiento,
                    provieneDe_ID,
                    currentUser);
                break;
            }
            case "Facturas - Retenciones de impuesto": { 
                agregarAsientoContable = agregarAsientoContable_RetencionImpuestos(entidadOriginal,     // esta no es la retención sino la factura           
                    tipoAsientoDefault,
                    companiaContab,
                    fechaAsiento,
                    mesFiscal,
                    factorCambio,
                    numeroNegativoAsiento,
                    provieneDe_ID,              // este es el id de la retención de impuestos 
                    currentUser);
                break;  
           }
       }

       // regresamos un un objeto que contiene un probable error, o el pk del asiento contable recién agregado
       return agregarAsientoContable;  
   }
})


// ----------------------------------------------------------------------------
// para leer el id de la factura que corresponde a la retención de impuestos 
function leerFacturaID(retencionID) { 
    // leemos la factura a la cual corresponde la retención 
    let query = `Select Top 1 FacturaID as facturaID 
                From Facturas_Impuestos Where ID = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
            replacements: [
                retencionID,
            ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return response.result[0].facturaID; 
}


// --------------------------------------------------------------------------
// para leer el movimiento bancario desde sql server
function leerMovimientoBancarioDesdeSqlServer(pk) {

    // leemos el movimiento bancario desde sql server
    let response = null;
    response = Async.runSync(function(done) {
       MovimientosBancarios_sql.findAll({ where: { claveUnica: pk }, raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }


    // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
    if (!response.result.length) {
        return {
            error: true,
            message: `Error inesperado: no pudimos leer el <em>movimiento bancario</em> original
                      (pk: ${provieneDe_ID.toString()}) desde la base de datos.`
        }
    }
           

    let movimientoBancario = response.result[0];
    // -------------------------------------------------------------------------------------------------
    // nótese que 'transaccion' es bigInt en sql server; por esta razón, regresa como un String
    // convertimos de nuevo a un integer

    // primero nos aseguramos que el valor no es un número, pero es un string que contiene un número ...
    if (!lodash.isFinite(movimientoBancario.transaccion) && !isNaN(movimientoBancario.transaccion)) {
        // ahora convertimos el valor a numérico, y luego nos aseguramos que sea un entero ...
        let transaccion = +movimientoBancario.transaccion;             // convierte el string a Number
        if (lodash.isInteger(transaccion)) {
            movimientoBancario.transaccion = transaccion;
        }
    }
    // -------------------------------------------------------------------------------------------------


    // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
    movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.ingreso = movimientoBancario.ingreso ? moment(movimientoBancario.ingreso).add(TimeOffset, 'hours').toDate() : null;
    movimientoBancario.ultMod = movimientoBancario.ultMod ? moment(movimientoBancario.ultMod).add(TimeOffset, 'hours').toDate() : null;

    // pareciera que al leer desde sql server, sequelize agrega la propiedad ClaveUnicaChequera, que
    // corresponde a la chequera; hay una relación entre el movimiento bancario y su chequera que se llama,
    // justamente, ClaveUnicaChequera. Aunque aquí no intentamos leer la chequera del movimiento,
    // sequelize agrega esta propiedad con el valor del id de la chequera; la eliminamos ...
    delete movimientoBancario.ClaveUnicaChequera;

    return { movimientoBancario: movimientoBancario };
}


// --------------------------------------------------------------------------
// para leer la factura desde sql server
function leerFacturaDesdeSqlServer(pk) {

    let response = null;
    response = Async.runSync(function(done) {
       Facturas_sql.findAll({ where: { claveUnica: pk }, raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }


   // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
   if (!response.result.length) {
       return {
           error: true,
           message: `Error inesperado: no pudimos leer la <em>factura</em> original (pk: ${provieneDe_ID.toString()}) desde la base de datos.`
       };
   }

    let factura = response.result[0];

    // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
    factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
    factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;
    factura.ingreso = factura.ingreso ? moment(factura.ingreso).add(TimeOffset, 'hours').toDate() : null;
    factura.ultAct = factura.ultAct ? moment(factura.ultAct).add(TimeOffset, 'hours').toDate() : null;

    // -------------------------------------------------------------------------------------------------
    // ahora leemos los impuestos y las retenciones registradas para la factura en Facturas_Impuestos
    response = null;
    response = Async.runSync(function(done) {
        Facturas_Impuestos_sql.findAndCountAll(
            {
                where: { facturaID: pk },
                raw: true,
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    factura.impuestosRetenciones = [];

    if (response.result.count) {
        response.result.rows.forEach((i) => {

            // leemos el registro en la tabla ImpuestosRetenidosDefinicion, que corresponde a cada registro de Impuesto/Retención; estos items nos
            // permitirán saber luego el tipo de impuesto, retención, etc.
            query = `Select Predefinido as predefinido, impuestoRetencion as impuestoRetencion From
                     ImpuestosRetencionesDefinicion Where ID = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ i.impRetID ], type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            if (response.result.length == 0) {
                errMessage = `Error inesperado: no hemos podido leer un registro en la tabla <em>ImpuestosRetencionesDefinicion</em> que corresponda
                              al registro de impuestos-retenciones (FacturasImpuestos) cuyo ID es ${i.id} y
                              monto es ${numeral(i.monto).format('0,0.00')}.`;

                return { error: true, message: errMessage };
            };

            // agregamos dos fields desde la tabla ImpuestosRetencionesDefinición, que nos ayudarán a identificar el impuesto o retención ...
            i.predefinido = response.result[0].predefinido;
            i.impuestoRetencion = response.result[0].impuestoRetencion;

            i.fechaRecepcionPlanilla = i.fechaRecepcionPlanilla ? moment(i.fechaRecepcionPlanilla).add(TimeOffset, 'hours').toDate() : null;
            factura.impuestosRetenciones.push(i);
        })
    }

    return { factura: factura };
}

// --------------------------------------------------------------------------
// para leer la reposición de caja chica desde sql server
function leerCajaChica_Reposicion_DesdeSqlServer(pk) {

    let response = null;
    response = Async.runSync(function(done) {
        CajaChica_Reposiciones_sql.findAll({ where: { reposicion: pk }, raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }


   // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
   if (!response.result.length) {
       return {
           error: true,
           message: `Error inesperado: no pudimos leer la <em>reposición de caja chica</em> original (pk: ${provieneDe_ID.toString()}) desde la base de datos.`
       };
   }


    let reposicion = response.result[0];

    // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
    reposicion.fecha = reposicion.fecha ? moment(reposicion.fecha).add(TimeOffset, 'hours').toDate() : null;
   
   
    return { reposicion: reposicion };
}


function leerChequera(pk) {
    response = Async.runSync(function(done) {
        Chequeras_sql.findAll({ where: { id: pk }, raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (!response.result.length) {
        let message = `Error: no hemos encontrado un registro en la tabla <em>Chequeras</em> (en <em>Bancos</em>)
            que corresponda al movimiento bancario.`;

        return { error: true, errMessage: message };
    };

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


    let chequera = response.result[0];
    return { chequera: chequera };
}



// -----------------------------------------------------------------------------------
// construimos y agregamos el asiento contable para el movimiento bancario
function agregarAsientoContable_MovimientoBancario(entidadOriginal, tipoAsientoDefault, companiaContab,
                                                   fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                                   provieneDe_ID, currentUser) {

    // leemos la chequera del movimiento bancario, para obtener la cuenta bancaria del movimiento
    // nótese que las chequeras exiten en mongo ...
    let leerChequeraDesdeSqlServer = leerChequera(entidadOriginal.claveUnicaChequera);

    if (leerChequeraDesdeSqlServer.error) {
        return {
            error: true,
            message: leerChequeraDesdeSqlServer.message
        };
    }

    let chequera = leerChequeraDesdeSqlServer.chequera;


    // leemos cuenta bancaria, en mongo, para obtener cuenta contable y moneda;
    // también banco para mostrar nombre en asiento
    let banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaInterna': chequera.numeroCuenta });

    if (!banco) {
        return {
            error: true,
            message: `Error inesperado: no hemos podido encontrar un banco para la cuenta bancaria
            '${chequera.numeroCuenta.toString()}'.<br />
            Debe existir una banco para esta cuenta bancaria en <em>Catálogos</em>. Nota: probablemente Ud. deba
            ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
        };
    };
    let cuentaBancaria = {};

    lodash.forEach(banco.agencias, (agencia) => {
        // la cuenta bancaria está en alguna de las agencias del banco ...
        cuentaBancaria = lodash.find(agencia.cuentasBancarias, (x) => { return x.cuentaInterna == chequera.numeroCuenta; });
        if (cuentaBancaria) { 
            return false;           // logramos un 'break' en el (lodash) forEach ..
        } 
    })

    if (!cuentaBancaria || lodash.isEmpty(cuentaBancaria)) {
        return {
            error: true,
            message: `Error inesperado: no hemos podido leer la cuenta bancaria a la cual está asociada
            el movimiento bancario.<br />
            Debe existir una cuenta bancaria para el movimiento en <em>Catálogos</em>. Nota: probablemente Ud. deba
            ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Generales</em>.`
        };
    }

    if (!cuentaBancaria.cuentaContable) {
        return {
            error: true,
            message: `Error: aparentemente, la cuenta bancaria no tiene una cuenta contable
            definida en el <em>catálogo de cuentas contables</em>.<br />
            Por favor, revise la cuenta bancaria y defina una cuenta contable para la misma.`
        };
    }

    let moneda = Monedas.findOne({ moneda: cuentaBancaria.moneda });

    // ------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para la compañía (proveedor/cliente)
    let cuentaContableCompaniaID = null;
    let leerCuentaContableDefinida = null;

    if (entidadOriginal.provClte) {
        if (entidadOriginal.monto <= 0) {
            // cuentas de proveedores (CxP) ...
            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
                1,
                entidadOriginal.provClte,
                0,
                cuentaBancaria.moneda,
                companiaContab.numero,
                null);
            } else {
            // cuentas de clientes (CxC) ...
            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
                7,
                entidadOriginal.provClte,
                0,
                cuentaBancaria.moneda,
                companiaContab.numero,
                null);
        }

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para la compañía
                indicada para el movimiento bancario.
                Las cuentas contables de compañías deben estar definidas en el catálogo
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina una cuenta contable para la compañía asociada al movimiento bancario.`
            };
        }

        cuentaContableCompaniaID = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------

    let cuentaContable_movBancos_impuestos = null;
    let cuentaContable_movBancos_comision = null;

    // ---------------------------------------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para contabilizar la comisión que cobra el banco (si existe una)
    leerCuentaContableDefinida = null;

    if (entidadOriginal.comision) {

        // cuenta contable para la comisión del movimiento bancario 
        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
            15,
            entidadOriginal.provClte,
            0,
            cuentaBancaria.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para contabilizar el monto de comisión
                indicado para el movimiento bancario.
                La cuenta contable definida para contabilizar las comisiones que cobra el banco, debe estar definida en
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina esta cuenta contable como se indica y luego regrese e intente completar, nuevamente, este proceso.`
            };
        }

        cuentaContable_movBancos_comision = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------

    // ---------------------------------------------------------------------------------------------------------------
    // intentamos obtener una cuenta contable para contabilizar la comisión que cobra el banco (si existe una)
    leerCuentaContableDefinida = null;

    if (entidadOriginal.impuestos) {

        // cuenta contable para el impuesto en el movimiento bancario 
        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
            16,
            entidadOriginal.provClte,
            0,
            cuentaBancaria.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable para contabilizar el monto de impuesto
                indicado para el movimiento bancario.
                La cuenta contable definida para contabilizar el impuesto que cobra el banco, debe estar definida en
                <em>Definición de cuentas contables</em> (<em>Bancos / Catálogos</em>).<br />
                Por favor, defina esta cuenta contable como se indica y luego regrese e intente completar, nuevamente, este proceso.`
            };
        }

        cuentaContable_movBancos_impuestos = leerCuentaContableDefinida.cuentaContableID;
    }
    // ------------------------------------------------------------------------------


    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    let asientoContable = {
        // numeroAutomatico: ,
        numero: numeroNegativoAsiento.numeroNegativoAsiento,
        mes: mesCalendario,
        ano: anoCalendario,
        tipo: tipoAsientoDefault,
        fecha: fechaAsiento,
        descripcion: entidadOriginal.concepto,
        moneda: moneda.moneda,
        monedaOriginal:moneda.moneda,
        convertirFlag:  true,
        factorDeCambio: factorCambio.factorCambio,
        provieneDe: "Bancos",
        provieneDe_id: provieneDe_ID,
        ingreso: new Date(),
        ultAct:  new Date(),
        copiablaFlag: true,
        asientoTipoCierreAnualFlag: false,
        mesFiscal: mesFiscal.mesFiscal,
        anoFiscal: mesFiscal.anoFiscal,
        usuario: currentUser.emails[0].address,
        lote: null,
        cia: companiaContab.numero,
        };


    // ----------------------------------------------------------------------------------------------------------------
    // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
    let asientoContable_sql = lodash.cloneDeep(asientoContable);
    asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

    let response = null;
    response = Async.runSync(function(done) {
        AsientosContables_sql.create(asientoContable_sql)
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let asientoAgregado = response.result.dataValues;

    let partidasAsientoContable = [];


    // ya grabamos el asiento; ahora vamos a grabar las partidas ...
    // --------------------------------------------------------------------------------------
    // ahora agregamos la partida para la cuenta bancaria
      let numeroPartida = 10;

      let partidaAsiento = {
          numeroAutomatico: asientoAgregado.numeroAutomatico,
          partida: numeroPartida,
          cuentaContableID: cuentaBancaria.cuentaContable,
          descripcion: entidadOriginal.concepto.length > 75 ?
                       entidadOriginal.concepto.substr(0, 75) :
                       entidadOriginal.concepto,
          referencia: entidadOriginal.transaccion,
          debe: entidadOriginal.montoBase >= 0 ? entidadOriginal.montoBase : 0,
          haber: entidadOriginal.montoBase < 0 ? Math.abs(entidadOriginal.montoBase) : 0,
      };

      // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
      partidasAsientoContable.push(partidaAsiento);


      // agregamos un monto de comisión, si existe
      if (entidadOriginal.comision) {

          numeroPartida += 10;

          partidaAsiento = {};

          let partidaAsiento = {
              numeroAutomatico: asientoAgregado.numeroAutomatico,
              partida: numeroPartida,
              cuentaContableID: cuentaBancaria.cuentaContable,
              descripcion: entidadOriginal.concepto.length > 75 ?
                           entidadOriginal.concepto.substr(0, 75) :
                           entidadOriginal.concepto,
              referencia: entidadOriginal.transaccion,
              debe: entidadOriginal.comision >= 0 ? entidadOriginal.comision : 0,
              haber: entidadOriginal.comision < 0 ? Math.abs(entidadOriginal.comision) : 0,
          };

          // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
          partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos un monto de impuestos, si existe
      if (entidadOriginal.impuestos) {

          numeroPartida += 10;

          partidaAsiento = {};

          let partidaAsiento = {
              numeroAutomatico: asientoAgregado.numeroAutomatico,
              partida: numeroPartida,
              cuentaContableID: cuentaBancaria.cuentaContable,
              descripcion: entidadOriginal.concepto.length > 75 ?
                           entidadOriginal.concepto.substr(0, 75) :
                           entidadOriginal.concepto,
              referencia: entidadOriginal.transaccion,
              debe: entidadOriginal.impuestos >= 0 ? entidadOriginal.impuestos : 0,
              haber: entidadOriginal.impuestos < 0 ? Math.abs(entidadOriginal.impuestos) : 0,
          };

          // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
          partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos la partida que corresponde al monto de comisión (si existe una)
      if (entidadOriginal.comision) {
          numeroPartida += 10;

            partidaAsiento = {};

            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
                cuentaContableID: cuentaContable_movBancos_comision,
                descripcion: entidadOriginal.concepto.length > 75 ?
                             entidadOriginal.concepto.substr(0, 75) :
                             entidadOriginal.concepto,
                referencia: entidadOriginal.transaccion,
                debe: entidadOriginal.comision < 0 ? Math.abs(entidadOriginal.comision) : 0,
                haber: entidadOriginal.comision >= 0 ? entidadOriginal.comision : 0,
            };

            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      }


      // agregamos la partida que corresponde al monto de impuestos (si existe uno)
      if (entidadOriginal.impuestos) {
          numeroPartida += 10;

            partidaAsiento = {};

            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
                cuentaContableID: cuentaContable_movBancos_impuestos,
                descripcion: entidadOriginal.concepto.length > 75 ?
                             entidadOriginal.concepto.substr(0, 75) :
                             entidadOriginal.concepto,
                referencia: entidadOriginal.transaccion,
                debe: entidadOriginal.impuestos < 0 ? Math.abs(entidadOriginal.impuestos) : 0,
                haber: entidadOriginal.impuestos >= 0 ? entidadOriginal.impuestos : 0,
            };

            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      }


      // la función que sigue lee las facturas asociadas al pago asociado al movimiento bancario; luego intenta leer registros de
      // impuestos/retenciones (en Facturas_Impuestos) que deban ser contabilizados al pagar. La función regresa estos registros
      // si existen, para contabilizarlos ahora ...
      let facturas_impuestos = leerImpuestosRetenciones_contabilizarAlPagar(entidadOriginal.pagoID);

      if (facturas_impuestos.error) {
          return {
              error: true,
              message: `Error al intentar leer impuestos o retenciones que deban ser contabilizados con el pago.<br /><br />
              el mensaje específico de error es: ${facturas_impuestos.message}`
          };
      }

      // ahora, en facturas_impuestos viene el array con los impuestos / retenciones (si existen) que se deben contabilizar con el pago

      // nótese como ajustamos el monto que corresponde a la cuenta contable cxp/cxc con el monto de las retenciones que se contabilizan
      // con el pago
      let montoCxCCxP = entidadOriginal.montoBase;

      facturas_impuestos.facturas_impuestos.forEach((impuestoRetencion) => {
            numeroPartida += 10;
            partidaAsiento = {
                numeroAutomatico: asientoAgregado.numeroAutomatico,
                partida: numeroPartida,
            };


            // TODO: preparamos la partida en base al tipo de imp/ret
            switch (impuestoRetencion.predefinido) {
                case 1: {
                    // imp iva
                    let conceptoDefinicionCuentaContable = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1)
                        conceptoDefinicionCuentaContable = 4;
                    else
                        conceptoDefinicionCuentaContable = 9;

                    leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                            impuestoRetencion.proveedor,
                                                                                            impuestoRetencion.tipoProveedor,
                                                                                            impuestoRetencion.moneda,
                                                                                            impuestoRetencion.numeroCiaContab,
                                                                                            null);

                    if (leerCuentaContableDefinida.error) {
                        if (impuestoRetencion.cxCCxPFlag == 1) {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva).
                                          Por favor defina una cuenta contable para contabilizar el Iva.`
                            }
                        } else {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva por pagar).
                                    Por favor defina una cuenta contable para contabilizar el Iva.`
                            }
                        }
                    }

                    partidaAsiento.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

                    let descripcion = `Impuesto Iva - Factura ${impuestoRetencion.numeroFactura.toString()} - Compañía ${impuestoRetencion.nombreProveedor}`;
                    partidaAsiento.descripcion = descripcion.length > 75 ?
                                                 descripcion.substring(0, 75) :
                                                 descripcion;

                    partidaAsiento.referencia = impuestoRetencion.numeroFactura.toString();

                    let montoAsiento = impuestoRetencion.monto;

                    partidaAsiento.debe = 0;
                    partidaAsiento.haber = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        if (montoAsiento >= 0)
                            partidaAsiento.debe = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.haber = montoAsiento * -1;
                    } else {
                        // CxC
                        if (montoAsiento >= 0)
                            partidaAsiento.haber = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.debe = montoAsiento * -1;
                    }

                    // ajustamos el monto que va a la cuenta cxc/cxp con el monto de impuestos y retenciones que se contabilicen con el pago
                    // restamos algún monto de impuestos que pueda existir y diferido, por el usuario, para contabilizar con el pago

                    // el monto base viene negativo para pagos (ej: un cheque o una transferencia hacia afuera); por ese motivo sumamos el
                    // impuesto en vez de restarlo; el monto base viene positivo para cobros
                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        montoCxCCxP += montoAsiento;
                    } else {
                        montoCxCCxP -= montoAsiento;
                    }

                    break;
                }
                case 2:  {
                    // ret iva
                    let conceptoDefinicionCuentaContable = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1)
                        conceptoDefinicionCuentaContable = 5;
                    else
                        conceptoDefinicionCuentaContable = 5;

                        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                                impuestoRetencion.proveedor,
                                                                                                impuestoRetencion.tipoProveedor,
                                                                                                impuestoRetencion.moneda,
                                                                                                impuestoRetencion.numeroCiaContab,
                                                                                                null);

                    if (leerCuentaContableDefinida.error) {
                        if (impuestoRetencion.cxCCxPFlag == 1) {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para
                                          contabilizar la retención sobre el IVA (Retención sobre iva).
                                          Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                            }
                        } else {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para
                                          contabilizar la retención sobre el IVA (Retención sobre iva).
                                          Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                            }
                        }
                    }

                    partidaAsiento.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

                    let descripcion = `Retención Iva - Factura ${impuestoRetencion.numeroFactura.toString()} - Compañía ${impuestoRetencion.nombreProveedor}`;
                    partidaAsiento.descripcion = descripcion.length > 75 ?
                                                 descripcion.substring(0, 75) :
                                                 descripcion;

                    partidaAsiento.referencia = impuestoRetencion.numeroFactura.toString();

                    montoAsiento = impuestoRetencion.monto;

                    partidaAsiento.debe = 0;
                    partidaAsiento.haber = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        if (montoAsiento >= 0)
                            partidaAsiento.haber = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.debe = montoAsiento * -1;
                    } else {
                        // CxC
                        if (montoAsiento >= 0)
                            partidaAsiento.debe = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.haber = montoAsiento * -1;
                    }

                    // ajustamos el monto que va a la cuenta cxc/cxp con el monto de impuestos y retenciones que se contabilicen con el pago
                    // sumamos algún monto de retenciones que pueda existir y diferido, por el usuario, para contabilizar con el pago

                    // el monto base viene negativo para pagos (ej: un cheque o una transferencia hacia afuera); por ese motivo sumamos el
                    // impuesto en vez de restarlo

                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        montoCxCCxP -= montoAsiento;
                    } else {
                        montoCxCCxP += montoAsiento;
                    }

                    break;
                }
                case 3: {
                    // ret islr
                    let conceptoDefinicionCuentaContable = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1)
                        conceptoDefinicionCuentaContable = 3;
                    else
                        conceptoDefinicionCuentaContable = 3;

                        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                                impuestoRetencion.proveedor,
                                                                                                impuestoRetencion.tipoProveedor,
                                                                                                impuestoRetencion.moneda,
                                                                                                impuestoRetencion.numeroCiaContab,
                                                                                                null);

                    if (leerCuentaContableDefinida.error) {
                        if (impuestoRetencion.cxCCxPFlag == 1) {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para
                                          contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                          Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                            }
                        } else {
                            return {
                                error: true,
                                message: `Error: no se ha encontrado una cuenta contable definida para
                                          contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                          Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                            }
                        }
                    }

                    partidaAsiento.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

                    let descripcion = `Retención Islr - Factura ${impuestoRetencion.numeroFactura.toString()} - Compañía ${impuestoRetencion.nombreProveedor}`;
                    partidaAsiento.descripcion = descripcion.length > 75 ?
                                                 descripcion.substring(0, 75) :
                                                 descripcion;

                    partidaAsiento.referencia = impuestoRetencion.numeroFactura.toString();


                    montoAsiento = impuestoRetencion.monto;

                    partidaAsiento.debe = 0;
                    partidaAsiento.haber = 0;

                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        if (montoAsiento >= 0)
                            partidaAsiento.haber = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.debe = montoAsiento * -1;
                    } else {
                        // CxC
                        if (montoAsiento >= 0)
                            partidaAsiento.debe = montoAsiento;
                        else
                            // nótese que las NC trane su monto negativo ...
                            partidaAsiento.haber = montoAsiento * -1;
                    }

                    // ajustamos el monto que va a la cuenta cxc/cxp con el monto de impuestos y retenciones que se contabilicen con el pago
                    // sumamos algún monto de retenciones que pueda existir y diferido, por el usuario, para contabilizar con el pago

                    // el monto base viene negativo para pagos (ej: un cheque o una transferencia hacia afuera); por ese motivo sumamos el
                    // impuesto en vez de restarlo
                    if (impuestoRetencion.cxCCxPFlag == 1) {
                        // CxP
                        montoCxCCxP -= montoAsiento;
                    } else {
                        montoCxCCxP += montoAsiento;
                    }
                    break;
                }
            }


            // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
            partidasAsientoContable.push(partidaAsiento);
      })

    // agregamos la partida que corresponde a la compañía (proveedor o cliente - cxp o cxc)
    // agregamos esta partida (cxp o cxc) al final, pues antes debemos ajustar su monto con retenciones que deban ser contabilizadas
    // en el momento del pago (en vez del momento de la factura) ...

    let pagoAnticipo = false; 
    let cuentaContableAnticipoEncontrada = true; 
    let cuentaContableAnticipos = null; 

    if (entidadOriginal.provClte) {

        // si el movimiento bancario proviene de un pago (el usuario registra un pago y luego asocia un mov bancario), su ID viene 
        // en pagoID. Leemos el pago para determinar si el pago corresponde a un anticipo. De ser así, intentamos leer una cuenta 
        // contable del tipo anticipo ... 
        if (entidadOriginal.pagoID) { 
            // Ok, el movimiento corresponde a un pago; determinamos si el pago corresponde a un anticipo. Debemos leer el pago 
            // y ver si es así ... 

            // esta funcion lee el pago y regresa true solo si el pago corresponde a un anticipo 
            if (determinarPagoAnticipo(entidadOriginal.pagoID)) { 

                pagoAnticipo = true; 

                // intentamos leer una cuenta contable de anticipo 
                let leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(
                    12,
                    entidadOriginal.provClte,
                    0,
                    cuentaBancaria.moneda,
                    companiaContab.numero,
                    null);

                if (leerCuentaContableDefinida.error) {
                    cuentaContableAnticipoEncontrada = false; 
                } else { 
                    cuentaContableAnticipos = leerCuentaContableDefinida.cuentaContableID;   
                }
            }
        }


        numeroPartida += 10;

        partidaAsiento = {};

        partidaAsiento = {
            numeroAutomatico: asientoAgregado.numeroAutomatico,
            partida: numeroPartida,
            cuentaContableID: (pagoAnticipo && cuentaContableAnticipoEncontrada) ? cuentaContableAnticipos : cuentaContableCompaniaID,
            descripcion: entidadOriginal.concepto.length > 75 ?
                entidadOriginal.concepto.substr(0, 75) :
                entidadOriginal.concepto,
            referencia: entidadOriginal.transaccion,
            debe: montoCxCCxP < 0 ? Math.abs(montoCxCCxP) : 0,
            haber: montoCxCCxP >= 0 ? montoCxCCxP : 0,
        };

        // agregamos la partida a un array; cada item en el array será luego agregado a dAsientos en sql server
        partidasAsientoContable.push(partidaAsiento);
    }

    // ahora recorremos el array de partidas y agregamos cada una a dAsientos en sql server; nótese que la idea es
    // que las de mayor monto vayan primero
    numeroPartida = 0;
    lodash(partidasAsientoContable).orderBy(['debe', 'haber'], ['desc', 'desc']).forEach((partida) => {

        // renumeramos la partida ...
        numeroPartida += 10;
        partida.partida = numeroPartida;

        response = Async.runSync(function (done) {
            dAsientosContables_sql.create(partida)
                .then(function (result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })

    let message = "";

    if (pagoAnticipo && !cuentaContableAnticipoEncontrada) {
        message = "El movimiento bancario <em>corresponde a un pago de anticipos</em>. Sin embargo, no pudimos leer una cuenta contable " +
            "de este tipo (anticipos), para la compañía indicada para el movimiento bancario. <br /><br />" +
            "Aunque el asiento contable ha sido generado en forma adecuada, " +
            "hemos usado la cuenta contable de compañía (CxP/CxC) en vez de una de anticipos. "

        return {
            error: true,
            message: message,
            asientoContableAgregadoID: asientoAgregado.numeroAutomatico
        };
    }

    return {
        error: false,
        message: message,
        asientoContableAgregadoID: asientoAgregado.numeroAutomatico
    };
}

function determinarPagoAnticipo(pagoID) { 

    let query = `Select Top 1 AnticipoFlag as anticipoFlag From Pagos Where ClaveUnica = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, {
            replacements: [ pagoID, ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) { 
        // esto no debe ocurrir; es como si no leyeramos el pago (???) 
        return false; 
    }

    return response.result[0].anticipoFlag ? true : false; 
}


// -------------------------------------------------------------------------------------------------------------------------------
// esta función intenta leer los registros de impuestos/retenciones (en facturas_impuestos) asociados al pago al cual se asoció
// el movimiento bancario. Algunos de estos impuestos/retenciones pueden estar marcados para ser contabilizados al pagar. En realidad,
// al registrar el movimiento bancario que corresponde al pago (el pago se contabiliza al registrar su movimiento bancario)
function leerImpuestosRetenciones_contabilizarAlPagar(pagoID) {

    let error = false;
    let message = '';
    let facturas_impuestos = [];

    if (!pagoID) {
        // el movimiento bancario no está asociado ni siquiera a un pago
        return {
            error: false,
            facturas_impuestos: facturas_impuestos,
        }
    }

    // primero intentamos leer las pk de las facturas asociadas
    let query = '';
    query = `Select Distinct cf.ClaveUnicaFactura as facturaID
             From Pagos pg Inner Join dPagos dp on pg.ClaveUnica = dp.ClaveUnicaPago
             Inner Join CuotasFactura cf on dp.ClaveUnicaCuotaFactura = cf.ClaveUnica
             Where pg.ClaveUnica = ?`;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ pagoID ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }


    if (response.result.length == 0) {
        // no existen ni siquiera facturas asociadas; regresamos con un array vacío ...
        return {
            error: false,
            facturas_impuestos: facturas_impuestos,
        }
    }

    // hay una o varias facturas asociadas al pago; intentamos leer sus impuestos/retenciones si se han 'marcado' para contabilizar con el pago

    // construimos un filtro para leer los registros en Facturas_Impuestos ...
    let where = '';
    let lista = '';

    if (lodash.isArray(response.result) && response.result.length > 0) {

        if (where)
            where += " And ";
        else
            where += "(1 = 1) And ";

        let lista = "";

        response.result.forEach((x) => {
            if (!lista)
                lista = "(" + x.facturaID.toString();
            else
                lista += ", " + x.facturaID.toString();
        });

        lista += ")";
        where += `(fi.FacturaID In ${lista})`;
    }


    query = `Select fi.Monto as monto, ird.Predefinido as predefinido, ird.ImpuestoRetencion as impuestoRetencion,
             fa.NumeroFactura as numeroFactura, fa.Proveedor as proveedor, pr.Abreviatura as nombreProveedor,
             pr.Tipo as tipoProveedor, fa.Moneda as moneda, fa.CxCCxPFlag as cxCCxPFlag, fa.Cia as numeroCiaContab
             From Facturas_Impuestos fi Inner Join ImpuestosRetencionesDefinicion ird On fi.ImpRetID = ird.ID
             Inner Join Facturas fa on fi.FacturaID = fa.ClaveUnica
             Inner Join Proveedores pr on fa.Proveedor = pr.Proveedor
             Where (fi.contabilizarAlPagar_flag Is Not Null And fi.contabilizarAlPagar_flag = 1) And ${where}
            `;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    response.result.forEach((factura_impuesto) => {
        facturas_impuestos.push(factura_impuesto);
    })

    return {
        error: false,
        facturas_impuestos: facturas_impuestos,
    }
}


function agregarAsientoContable_Factura(entidadOriginal, tipoAsientoDefault, companiaContab,
                                        fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                        provieneDe_ID, currentUser) {

        let mesCalendario = fechaAsiento.getMonth() + 1;
        let anoCalendario = fechaAsiento.getFullYear();

        let asientoContable = {
            // numeroAutomatico: ,
            numero: numeroNegativoAsiento.numeroNegativoAsiento,
            mes: mesCalendario,
            ano: anoCalendario,
            tipo: tipoAsientoDefault,
            fecha: fechaAsiento,
            descripcion: entidadOriginal.concepto.length <= 250 ?
                         entidadOriginal.concepto :
                         entidadOriginal.concepto.toString().substring(0, 250),
            moneda: entidadOriginal.moneda,
            monedaOriginal: entidadOriginal.moneda,
            convertirFlag:  true,
            factorDeCambio: factorCambio.factorCambio,
            provieneDe: "Facturas",
            provieneDe_id: provieneDe_ID,
            ingreso: new Date(),
            ultAct:  new Date(),
            copiablaFlag: true,
            asientoTipoCierreAnualFlag: false,
            mesFiscal: mesFiscal.mesFiscal,
            anoFiscal: mesFiscal.anoFiscal,
            usuario: currentUser.emails[0].address,
            lote: null,
            cia: companiaContab.numero,
        };

        // leemos cuenta bancaria (está en mongo) pues luego lo usamos para obtener las cuentas contables
        let proveedor = Proveedores.findOne({ proveedor: entidadOriginal.proveedor });

        if (!proveedor) {
            return {
                error: true,
                message: `Error inesperado: no pudimos leer los datos de la compañía indicada en la factura.<br />
                Debe existir una compañía para esta factura en <em>Catálogos</em>. Nota: probablemente Ud. deba
                ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Bancos / Generales</em>.`
            };
        };


        // creamos un array con las partidas del asiento, para grabarlas a sql al final; la idea de crear 
        // las partidas en un array, es poder ordenarlo antes de grabar a sql; de esa forma, podemos grabar 
        // los montos positivos primero y luego los negativos, siempre desde el mayor al menor. 
        // --------------------------------------------------------------------------------------
        // partida para registrar la compra o venta (gasto o ingresos por venta)
        let partida = {};
        let partidasAsientoContable = [];
        let leerCuentaContableDefinida = null;
        let montoAsiento = 0;

        let cuentaContableDefinidaID = 0;
        let conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            conceptoDefinicionCuentaContable = 2;
        } else {
            conceptoDefinicionCuentaContable = 8;
        }

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                entidadOriginal.proveedor,
                                                                                entidadOriginal.tipo,
                                                                                entidadOriginal.moneda,
                                                                                companiaContab.numero,
                                                                                null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para contabilizar las compras (Compras).
                              Por favor defina una cuenta contable para contabilizar las compras.`
                }
            } else {
                return {
                    error: true,
                    message: `no se ha encontrado una cuenta contable definida para contabilizar las ventas (Ventas).
                        Por favor defina una cuenta contable para contabilizar las ventas.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
                              entidadOriginal.concepto.substring(0, 75) :
                              entidadOriginal.concepto;

        partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                             entidadOriginal.numeroFactura.toString().substring(0, 20) :
                             entidadOriginal.numeroFactura.toString();

        montoAsiento = (entidadOriginal.montoFacturaSinIva ? entidadOriginal.montoFacturaSinIva : 0) +
                       (entidadOriginal.montoFacturaConIva ? entidadOriginal.montoFacturaConIva : 0);

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);

        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el monto del iva;
        // leemos el monto del impuesto Iva en el array de impuestos y retenciones
        let impuestoIva = {};
        if (entidadOriginal.impuestosRetenciones) {
            impuestoIva = lodash.find(entidadOriginal.impuestosRetenciones, (x) => { return x.predefinido === 1; });
        }

        // nótese que el monto puede ser contabilizado con el pago, si así lo inidca el usuario ...
        if (impuestoIva && !impuestoIva.contabilizarAlPagar_flag && impuestoIva.monto) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 4;
            else
                conceptoDefinicionCuentaContable = 9;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva).
                                  Por favor defina una cuenta contable para contabilizar el Iva.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva por pagar).
                            Por favor defina una cuenta contable para contabilizar el Iva.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                                 entidadOriginal.numeroFactura.toString().substring(0, 20) :
                                 entidadOriginal.numeroFactura.toString();

            montoAsiento = impuestoIva.monto;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el ISLR retenido
        // leemos el monto de retención islr en el array de impuestos y retenciones
        let retencionIslr = {};
        if (entidadOriginal.impuestosRetenciones) {
            retencionIslr = lodash.find(entidadOriginal.impuestosRetenciones, (x) => { return x.predefinido === 3; });
        }

        // nótese que el monto puede ser contabilizado con el pago, si así lo inidca el usuario ...
        if (retencionIslr && !retencionIslr.contabilizarAlPagar_flag && retencionIslr.monto) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 3;
            else
                conceptoDefinicionCuentaContable = 3;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                                 entidadOriginal.numeroFactura.toString().substring(0, 20) :
                                 entidadOriginal.numeroFactura.toString();

            montoAsiento = retencionIslr.monto;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el impuesto Iva retenido
        // leemos el monto de retención iva en el array de impuestos y retenciones
        let retencionIva = {};
        if (entidadOriginal.impuestosRetenciones) {
            retencionIva = lodash.find(entidadOriginal.impuestosRetenciones, (x) => { return x.predefinido === 2; });
        }

        // nótese que el monto puede ser contabilizado con el pago, si así lo inidca el usuario ...
        if (retencionIva && !retencionIva.contabilizarAlPagar_flag && retencionIva.monto) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 5;
            else
                conceptoDefinicionCuentaContable = 5;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el IVA (Retención sobre iva).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar la retención sobre el IVA (Retención sobre iva).
                                  Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                                 entidadOriginal.numeroFactura.toString().substring(0, 20) :
                                 entidadOriginal.numeroFactura.toString();

            montoAsiento = retencionIva.monto;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar la cuenta por cobrar o pagar ...
        cuentaContableDefinidaID = 0;
        conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1)
            conceptoDefinicionCuentaContable = 1;
        else
            conceptoDefinicionCuentaContable = 7;

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                entidadOriginal.proveedor,
                                                                                entidadOriginal.tipo,
                                                                                entidadOriginal.moneda,
                                                                                companiaContab.numero,
                                                                                null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxP)).
                              Por favor defina una cuenta contable para la compañia.`
                }
            } else {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxC)).
                        Por favor defina una cuenta contable para la compañia.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
                              entidadOriginal.concepto.substring(0, 75) :
                              entidadOriginal.concepto;

        partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                             entidadOriginal.numeroFactura.toString().substring(0, 20) :
                             entidadOriginal.numeroFactura.toString();

        // calculamos el total a pagar a la compañía
        montoAsiento =
            (
            (entidadOriginal.montoFacturaSinIva ? entidadOriginal.montoFacturaSinIva : 0) +
            (entidadOriginal.montoFacturaConIva ? entidadOriginal.montoFacturaConIva : 0) +
            (entidadOriginal.otrosImpuestos ? entidadOriginal.otrosImpuestos : 0) -
            (entidadOriginal.otrasRetenciones ? entidadOriginal.otrasRetenciones : 0) -
            (entidadOriginal.anticipo ? entidadOriginal.anticipo : 0)
            );

        // los impuestos y retenciones están en el array impuestosRetenciones y fueron leídos en las variables que siguen;
        // nótese que el usuario puede indicar que estos montos se contabilicen con el pago (en vez de ahora)

        if (impuestoIva && !impuestoIva.contabilizarAlPagar_flag && impuestoIva.monto) {
            // hay un monto Iva y no se va a contabilizar al pagar
            montoAsiento += impuestoIva.monto;
        }

        if (retencionIva && !retencionIva.contabilizarAlPagar_flag && retencionIva.monto) {
            // hay un monto Iva y no se va a contabilizar al pagar
            montoAsiento -= retencionIva.monto;
        }

        if (retencionIslr && !retencionIslr.contabilizarAlPagar_flag && retencionIslr.monto) {
            // hay un monto Iva y no se va a contabilizar al pagar
            montoAsiento -= retencionIslr.monto;
        }

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);


        // -----------------------------------------------------------------------------------------------------
        // partida para registrar el monto cobrado o pagado por anticipado
        if (entidadOriginal.anticipo) {
            cuentaContableDefinidaID = 0;
            conceptoDefinicionCuentaContable = 0;

            if (entidadOriginal.cxCCxPFlag == 1)
                conceptoDefinicionCuentaContable = 12;
            else
                conceptoDefinicionCuentaContable = 12;

            leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
                                                                                    entidadOriginal.proveedor,
                                                                                    proveedor.tipo,
                                                                                    entidadOriginal.moneda,
                                                                                    companiaContab.numero,
                                                                                    null);

            if (leerCuentaContableDefinida.error) {
                if (entidadOriginal.cxCCxPFlag == 1) {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar el monto de anticipo (Anticipo en pago de facturas).
                                  Por favor defina una cuenta contable para contabilizar el anticipo.`
                    }
                } else {
                    return {
                        error: true,
                        message: `Error: no se ha encontrado una cuenta contable definida para
                                  contabilizar el monto de anticipo (Anticipo en pago de facturas).
                                  Por favor defina una cuenta contable para contabilizar el anticipo.`
                    }
                }
            }

            partida = {};

            partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

            partida.descripcion = entidadOriginal.concepto.length > 75 ?
                                  entidadOriginal.concepto.substring(0, 75) :
                                  entidadOriginal.concepto;

            partida.referencia = entidadOriginal.numeroFactura.toString().length > 20 ?
                                 entidadOriginal.numeroFactura.toString().substring(0, 20) :
                                 entidadOriginal.numeroFactura.toString();

            montoAsiento = entidadOriginal.anticipo;

            partida.debe = 0;
            partida.haber = 0;

            if (entidadOriginal.cxCCxPFlag == 1) {
                // CxP
                if (montoAsiento >= 0)
                    partida.haber = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.debe = montoAsiento * -1;
            } else {
                // CxC
                if (montoAsiento >= 0)
                    partida.debe = montoAsiento;
                else
                    // nótese que las NC trane su monto negativo ...
                    partida.haber = montoAsiento * -1;
            }

            partidasAsientoContable.push(partida);
        }

        // ----------------------------------------------------------------------------------------------------------------
        // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
        let asientoContable_sql = lodash.cloneDeep(asientoContable);
        asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
        asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
        asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

        let response = Async.runSync(function(done) {
        AsientosContables_sql.create(asientoContable_sql)
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        let asientoAgregado = response.result.dataValues;

        // ahora recorremos el array de partidas del asiento y agregamos a sql cada una de ellas
        let numeroPartida = 0;
        lodash(partidasAsientoContable).orderBy(['debe', 'haber'], ['desc', 'desc']).forEach((partidaAsiento) => {
            numeroPartida += 10;

            partidaAsiento.numeroAutomatico = asientoAgregado.numeroAutomatico,
            partidaAsiento.partida = numeroPartida,

            response = Async.runSync(function(done) {
                dAsientosContables_sql.create(partidaAsiento)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        });

        return {
            asientoContableAgregadoID: asientoAgregado.numeroAutomatico
        };
}




// -----------------------------------------------------------------------------------
// construimos y agregamos el asiento contable para el movimiento bancario
function agregarAsientoContable_CajaChica_Reposicion(entidadOriginal, companiaContab,
                                                       fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                                       provieneDe_ID, currentUser) {

    // ----------------------------------------------------------------------------------------------------------------------------------
    // leemos la tabla que contiene los parámetros de caja chica                                                     
    let response = null;
    response = Async.runSync(function(done) {
        CajaChica_Parametros_sql.findAll({ where: { cia: companiaContab.numero }, raw: true, })
        .then(function(result) { done(null, result); })
        .catch(function (err) { done(err, null); })
        .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
    if (!response.result.length) {
        return {
            error: true,
            message: `Error: no encontramos un registro para la compañía Contab en la tabla de <em>parámetros de caja chica</em>, 
                        para poder obtener el tipo de asiento y la cuenta contable 'puente' para la contabilización de la reposición de la caja chica.`
        };
    }

    let parametrosCajaChica = response.result[0];   // para obtener el tipo de asiento 'default' y la cuenta contable 'puente' 
    
    // ----------------------------------------------------------------------------------------------------------------------------------
    // leemos la caja chica que corresponde a la reposición, para obtener su descripción y mostrar en la descripción del asiento 
    response = null;
    response = Async.runSync(function(done) {
        CajaChica_CajasChicas_sql.findAll({ where: { cajaChica: entidadOriginal.cajaChica }, attributes: [ 'descripcion' ], raw: true, })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        return {
            error: true,
            message: `Error: no pudimos leer la reposición de caja chica indicada en la base de datos.<br /> 
                      Por favor revise.`
        };
    }

    let cajaChica = response.result[0];   


    // ----------------------------------------------------------------------------------------------------------------------------------
    // leemos la moneda que el usuario ha definido como 'defecto'. Debe haber una, para asignar al asiento                                              
    response = null;
    response = Async.runSync(function(done) {
        Monedas_sql.findAll({ where: { defaultFlag: true }, attributes: [ 'moneda' ], raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        return {
            error: true,
            message: `Error: no hemos podido leer una moneda marcada como <em>default</em> en la tabla  <em>Monedas</em>. <br /> 
                      Nótese que debe existir una para poder generar el asiento en forma automática.`
        };
    }

    let monedaDefault = response.result[0];     
   

    // ----------------------------------------------------------------------------------------------------------------------------------
    // debe existir una cuenta contable definida para la contabilización del Iva ... 
    let leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(4, null, null, null, companiaContab.numero, null);

    if (leerCuentaContableDefinida.error) {
        return {
            error: true,
            message: `Error: no se ha encontrado una cuenta contable definida para contabilizar el Iva (Iva).
                        Por favor defina una cuenta contable para contabilizar el Iva.`
        }
    } 

    let cuentaContableIvaID = leerCuentaContableDefinida.cuentaContableID;
 

    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    let asientoContable = {
        // numeroAutomatico: ,
        numero: numeroNegativoAsiento.numeroNegativoAsiento,
        mes: mesCalendario,
        ano: anoCalendario,
        tipo: parametrosCajaChica.tipoAsiento,
        fecha: fechaAsiento,
        descripcion: `Asiento de caja chica generado en forma automática para la reposición número ${entidadOriginal.reposicion.toString()}, de la caja chica: ${cajaChica.descripcion}`,
        moneda: monedaDefault.moneda,
        monedaOriginal: monedaDefault.moneda,
        convertirFlag: true,
        factorDeCambio: factorCambio.factorCambio,
        provieneDe: "Caja chica",
        provieneDe_id: provieneDe_ID,
        ingreso: new Date(),
        ultAct: new Date(),
        copiablaFlag: true,
        asientoTipoCierreAnualFlag: false,
        mesFiscal: mesFiscal.mesFiscal,
        anoFiscal: mesFiscal.anoFiscal,
        usuario: currentUser.emails[0].address,
        lote: null,
        cia: companiaContab.numero,
    };


    // ----------------------------------------------------------------------------------------------------------------
    // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.0 horas a cada una ...
    let asientoContable_sql = lodash.cloneDeep(asientoContable);
    asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

    // ----------------------------------------------------------------------------------------------------------------------------
    // construmos un array con las partidas que serán agregadas al asiento, una por gasto, además otra si hay un monto para el Iva 
    response = null;
    response = Async.runSync(function(done) {
        CajaChica_Reposiciones_Gastos_sql.findAll({ 
            where: { reposicion: entidadOriginal.reposicion }, 
            attributes: [ 'rubro', 'descripcion', 'montoNoImponible', 'monto', 'iva', 'numeroDocumento' ], 
            raw: true, })
           .then(function(result) { done(null, result); })
           .catch(function (err) { done(err, null); })
           .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        return {
            error: true,
            message: `Error: la reposición de caja chica <em>no contiene gastos asociados</em>. Por favor revise.`
        };
    }

    let gastos = response.result;   
    let partida = {}; 
    let partidas = []; 
    let totalMontoGastos = 0;       // sumarizamos el total de los gastos, más iva, para agregar una partida 'resumen' al final del asiento 
    
    for (let gasto of gastos) { 

        // ----------------------------------------------------------------------------------------------------------------------------
        // leemos la cuenta contable asociada al gasto; debe existir una en forma específica para la cia Contab seleccionada ... 
        query = `Select rc.CuentaContableID From CajaChica_RubrosCuentasContables rc Inner Join CuentasContables c 
                 On rc.CuentaContableID = c.ID Where rc.Rubro = ? And c.Cia = ? 
                `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ gasto.rubro, companiaContab.numero ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        if (!response.result.length) {
            return {
                error: true,
                message: `Error: no hemos podido leer una cuenta contable definida para el rubro indicado para el gasto <em>${gasto.descripcion}</em>. <br /> 
                          Por favor note que debe existir una <em>cuenta contable asociada</em> a cada rubro indicado en la reposición de caja chica.<br /> 
                          Por favor revise esta situación en la tabla que corresponde y solo luego regrese y continúe con este proceso.`
            };
        }

        let cuentaContableRubro = response.result[0]; 
        
        let debe = 0; 

        if (gasto.montoNoImponible) { debe += gasto.montoNoImponible; }; 
        if (gasto.monto) { debe += gasto.monto; }; 

        let referencia = null; 
        if (gasto.numeroDocumento) { 
            // nos aseguramos que el valor usado como referencia no pase de 20 chars 
            referencia = gasto.numeroDocumento.length > 20 ? gasto.numeroDocumento.substr(0, 20) : gasto.numeroDocumento; 
        }

        partida = { 
            cuentaContableID: cuentaContableRubro.CuentaContableID, 
            descripcion: gasto.descripcion.length > 75 ? gasto.descripcion.substr(0, 75) : gasto.descripcion,       // la descripción no debe ser mayor a 75 
            referencia: referencia, 
            debe: debe,  
            haber: 0 
        }

        partidas.push(partida); 
        totalMontoGastos += debe; 

        // si hay un monto para el Iva, agregamos una nueva partida 
        if (gasto.iva) { 
            partida = { 
                cuentaContableID: cuentaContableIvaID, 
                descripcion: gasto.descripcion.length > 75 ? gasto.descripcion.substr(0, 75) : gasto.descripcion,
                referencia: referencia, 
                debe: gasto.iva,  
                haber: 0 
            }

            partidas.push(partida); 
            totalMontoGastos += gasto.iva; 
        }
    }


    // finalmente, agregamos una partida para 'cuadrar' el asiento contra la cuenta 'puente' de caja chica ... 
    let descripcionPartidaFinal = `Caja chica # ${entidadOriginal.reposicion.toString()} de fecha ${moment(entidadOriginal.fecha).format("DD-MMM-YYYY")} - ${entidadOriginal.observaciones}`; 
    descripcionPartidaFinal = descripcionPartidaFinal.length > 75 ?
                              descripcionPartidaFinal.substr(0, 75) :
                              descripcionPartidaFinal,
    partida = { 
        cuentaContableID: parametrosCajaChica.cuentaContablePuenteID, 
        descripcion: descripcionPartidaFinal, 
        referencia: null, 
        debe: 0,  
        haber: totalMontoGastos 
    }
    partidas.push(partida); 


    // ----------------------------------------------------------------------------
    // finalmente, agregamos el asiento contable y sus partidas 
    response = null;
    response = Async.runSync(function (done) {
        AsientosContables_sql.create(asientoContable_sql)
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    let asientoAgregado = response.result.dataValues;


    // ahora recorremos el array de partidas y agregamos cada una a dAsientos en sql server; nótese que la idea es
    // que las de mayor monto vayan primero
    let numeroPartida = 0;
    lodash(partidas).orderBy(['debe', 'haber'], ['desc', 'desc']).forEach((partida) => {

        // renumeramos la partida ...
        numeroPartida += 10;

        partida.numeroAutomatico = asientoAgregado.numeroAutomatico; 
        partida.partida = numeroPartida;

        response = Async.runSync(function(done) {
            dAsientosContables_sql.create(partida)
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    })


    return {
        asientoContableAgregadoID: asientoAgregado.numeroAutomatico
    };
}



function agregarAsientoContable_RetencionImpuestos(entidadOriginal, 
                                                tipoAsientoDefault, companiaContab,
                                                fechaAsiento, mesFiscal, factorCambio, numeroNegativoAsiento,
                                                provieneDe_ID, currentUser) {

    // lo primero que hacemos es leer la retención para la cual generaremos el asiento; su id viene en provieneDe_ID 
    let retencionImpuestos = entidadOriginal.impuestosRetenciones.find(x => x.id === provieneDe_ID); 

    if (!retencionImpuestos) { 
        return {
            error: true,
            message: `Error inesperado: no pudimos leer la retención de impuestos, que se ha seleccionado en la lista, en la factura.<br />
                      La retención de impuestos que se ha seleccionado debe existir en la factura. <br /><br />
                      Por favor revise.`
        };
    }

    if (retencionImpuestos && retencionImpuestos.predefinido && retencionImpuestos.predefinido === 1) { 
        return {
            error: true,
            message: `<b>Error:</b> aunque el monto de impuestos Iva está en la lista, Ud. no debe generar su asiento contable usando esta opción.<br /><br />
                      La contabilización del monto de impuestos Iva, debe formar parte del asiento original de la factura y no de uno separado.
                      Utilice este mecanismo para obtener asientos contables de retenciones de impuesto (Iva / Islr).`
        };
    }

    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    let tipoRetencion = "Indefinido"; 

    if (retencionImpuestos.predefinido == 2) { 
        tipoRetencion = "Iva"; 
    } else if (retencionImpuestos.predefinido == 3) { 
        tipoRetencion = "Islr"; 
    }

    let descripcionAsiento = `Retención de impuestos (${tipoRetencion}) para la factura ${entidadOriginal.numeroFactura}`; 

    let asientoContable = {
        // numeroAutomatico: ,
        numero: numeroNegativoAsiento.numeroNegativoAsiento,
        mes: mesCalendario,
        ano: anoCalendario,
        tipo: tipoAsientoDefault,
        fecha: fechaAsiento,
        descripcion: descripcionAsiento.length <= 250 ? descripcionAsiento : descripcionAsiento.substring(0, 250),
        moneda: entidadOriginal.moneda,
        monedaOriginal: entidadOriginal.moneda,
        convertirFlag: true,
        factorDeCambio: factorCambio.factorCambio,
        provieneDe: "Facturas",
        provieneDe_id: entidadOriginal.claveUnica,      // nótese como asociamos el asiento a la factura (y no a la retención) 
        ingreso: new Date(),
        ultAct: new Date(),
        copiablaFlag: true,
        asientoTipoCierreAnualFlag: false,
        mesFiscal: mesFiscal.mesFiscal,
        anoFiscal: mesFiscal.anoFiscal,
        usuario: currentUser.emails[0].address,
        lote: null,
        cia: companiaContab.numero,
    };

    // leemos cuenta bancaria (está en mongo) pues luego lo usamos para obtener las cuentas contables
    let proveedor = Proveedores.findOne({ proveedor: entidadOriginal.proveedor });

    if (!proveedor) {
        return {
            error: true,
            message: `Error inesperado: no pudimos leer los datos de la compañía indicada en la factura.<br />
                        Debe existir una compañía para esta factura en <em>Catálogos</em>. Nota: probablemente Ud. deba
                        ejecutar la opción <em>Copiar catálogos</em> en el menú <em>Bancos / Generales</em>.`
        };
    }


    // creamos un array con las partidas del asiento, para grabarlas a sql al final; la idea de crear 
    // las partidas en un array, es poder ordenarlo antes de grabar a sql; de esa forma, podemos grabar 
    // los montos positivos primero y luego los negativos, siempre desde el mayor al menor. 
    // --------------------------------------------------------------------------------------
    // partida para registrar la compra o venta (gasto o ingresos por venta)
    let partida = {};
    let partidasAsientoContable = [];
    let leerCuentaContableDefinida = null;
    let montoAsiento = 0;
    let totalAsiento = 0; 

    let conceptoDefinicionCuentaContable = 0;

 
    // -----------------------------------------------------------------------------------------------------
    // partida para registrar el ISLR retenido
    // leemos el monto de retención islr en el array de impuestos y retenciones
    let retencionIslr = {};
    if (retencionImpuestos.predefinido === 3) {
        retencionIslr = retencionImpuestos;
    }

    // nótese que el monto puede ser contabilizado con el pago, si así lo inidca el usuario ...
    if (retencionIslr && !retencionIslr.contabilizarAlPagar_flag && retencionIslr.monto) {
        conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1)
            conceptoDefinicionCuentaContable = 3;
        else
            conceptoDefinicionCuentaContable = 3;

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
            entidadOriginal.proveedor,
            proveedor.tipo,
            entidadOriginal.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para
                                contabilizar la retención sobre el ISLR (Impuestos retenidos).
                                Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                }
            } else {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para
                            contabilizar la retención sobre el ISLR (Impuestos retenidos).
                            Por favor defina una cuenta contable para contabilizar la retención sobre el ISLR.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
            entidadOriginal.concepto.substring(0, 75) :
            entidadOriginal.concepto;

        partida.referencia = `RetIslr ${entidadOriginal.numeroFactura.toString()}`.length > 20 ?
                             `RetIslr ${entidadOriginal.numeroFactura.toString()}`.substring(0, 20) :
                             `RetIslr ${entidadOriginal.numeroFactura.toString()}`;

        montoAsiento = retencionIslr.monto;

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);
        totalAsiento = partida.debe - partida.haber; 
    }


    // -----------------------------------------------------------------------------------------------------
    // partida para registrar el impuesto Iva retenido
    // leemos el monto de retención iva en el array de impuestos y retenciones
    let retencionIva = {};
    if (retencionImpuestos.predefinido === 2) {
        retencionIva = retencionImpuestos;
    }

    // nótese que el monto puede ser contabilizado con el pago, si así lo inidca el usuario ...
    if (retencionIva && !retencionIva.contabilizarAlPagar_flag && retencionIva.monto) {
        conceptoDefinicionCuentaContable = 0;

        if (entidadOriginal.cxCCxPFlag == 1)
            conceptoDefinicionCuentaContable = 5;
        else
            conceptoDefinicionCuentaContable = 5;

        leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
            entidadOriginal.proveedor,
            proveedor.tipo,
            entidadOriginal.moneda,
            companiaContab.numero,
            null);

        if (leerCuentaContableDefinida.error) {
            if (entidadOriginal.cxCCxPFlag == 1) {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para
                                contabilizar la retención sobre el IVA (Retención sobre iva).
                                Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                }
            } else {
                return {
                    error: true,
                    message: `Error: no se ha encontrado una cuenta contable definida para
                            contabilizar la retención sobre el IVA (Retención sobre iva).
                            Por favor defina una cuenta contable para contabilizar la retención sobre el IVA.`
                }
            }
        }

        partida = {};

        partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;

        partida.descripcion = entidadOriginal.concepto.length > 75 ?
            entidadOriginal.concepto.substring(0, 75) :
            entidadOriginal.concepto;

        partida.referencia = `RetIva ${entidadOriginal.numeroFactura.toString()}`.length > 20 ?
                             `RetIva ${entidadOriginal.numeroFactura.toString()}`.substring(0, 20) :
                             `RetIva ${entidadOriginal.numeroFactura.toString()}`;

        montoAsiento = retencionIva.monto;

        partida.debe = 0;
        partida.haber = 0;

        if (entidadOriginal.cxCCxPFlag == 1) {
            // CxP
            if (montoAsiento >= 0)
                partida.haber = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.debe = montoAsiento * -1;
        } else {
            // CxC
            if (montoAsiento >= 0)
                partida.debe = montoAsiento;
            else
                // nótese que las NC trane su monto negativo ...
                partida.haber = montoAsiento * -1;
        }

        partidasAsientoContable.push(partida);
        totalAsiento = partida.debe - partida.haber; 
    }


    // -----------------------------------------------------------------------------------------------------
    // partida para registrar la cuenta por cobrar o pagar ...
    conceptoDefinicionCuentaContable = 0;

    if (entidadOriginal.cxCCxPFlag == 1)
        conceptoDefinicionCuentaContable = 1;
    else
        conceptoDefinicionCuentaContable = 7;

    leerCuentaContableDefinida = ContabFunctions.leerCuentaContableDefinida(conceptoDefinicionCuentaContable,
        entidadOriginal.proveedor,
        entidadOriginal.tipo,
        entidadOriginal.moneda,
        companiaContab.numero,
        null);

    if (leerCuentaContableDefinida.error) {
        if (entidadOriginal.cxCCxPFlag == 1) {
            return {
                error: true,
                message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxP)).
                            Por favor defina una cuenta contable para la compañia.`
            }
        } else {
            return {
                error: true,
                message: `Error: no se ha encontrado una cuenta contable definida para la compañía (Compañía (CxC)).
                            Por favor defina una cuenta contable para la compañia.`
            }
        }
    }

    partida = {};

    partida.cuentaContableID = leerCuentaContableDefinida.cuentaContableID;;

    partida.descripcion = entidadOriginal.concepto.length > 75 ?
        entidadOriginal.concepto.substring(0, 75) :
        entidadOriginal.concepto;

    if (retencionImpuestos.predefinido === 2) { 
        partida.referencia = `RetIva ${entidadOriginal.numeroFactura.toString()}`.length > 20 ?
                             `RetIva ${entidadOriginal.numeroFactura.toString()}`.substring(0, 20) :
                             `RetIva ${entidadOriginal.numeroFactura.toString()}`;

    } else { 
        partida.referencia = `RetIslr ${entidadOriginal.numeroFactura.toString()}`.length > 20 ?
                             `RetIslr ${entidadOriginal.numeroFactura.toString()}`.substring(0, 20) :
                             `RetIslr ${entidadOriginal.numeroFactura.toString()}`;
    }

    partida.debe = 0;
    partida.haber = 0;

    if (totalAsiento > 0) {
        partida.haber = totalAsiento;
    } else {
        partida.debe = totalAsiento * -1; 
    }

    partidasAsientoContable.push(partida);

    // ----------------------------------------------------------------------------------------------------------------
    // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
    let asientoContable_sql = lodash.cloneDeep(asientoContable);
    asientoContable_sql.fecha = moment(asientoContable.fecha).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ingreso = moment(asientoContable.ingreso).subtract(TimeOffset, 'h').toDate();
    asientoContable_sql.ultAct = moment(asientoContable.ultAct).subtract(TimeOffset, 'h').toDate();

    let response = Async.runSync(function (done) {
        AsientosContables_sql.create(asientoContable_sql)
            .then(function (result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    let asientoAgregado = response.result.dataValues;

    // ahora recorremos el array de partidas del asiento y agregamos a sql cada una de ellas
    let numeroPartida = 0;
    lodash(partidasAsientoContable).orderBy(['debe', 'haber'], ['desc', 'desc']).forEach((partidaAsiento) => {
        numeroPartida += 10;

        partidaAsiento.numeroAutomatico = asientoAgregado.numeroAutomatico,
            partidaAsiento.partida = numeroPartida,

            response = Async.runSync(function (done) {
                dAsientosContables_sql.create(partidaAsiento)
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    });

    return {
        asientoContableAgregadoID: asientoAgregado.numeroAutomatico
    };
}
