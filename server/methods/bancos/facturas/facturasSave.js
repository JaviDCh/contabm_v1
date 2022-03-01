
import lodash from 'lodash';
import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

import { dFormasDePago_sql } from '/server/imports/sqlModels/bancos/formasDePago'; 

Meteor.methods(
{
    facturasSave: function (factura, fechaEmisionOriginal, fechaRecepcionOriginal, ciaContabID) {

        new SimpleSchema({
            factura: { type: Object, blackbox: true, optional: false, },
            fechaEmisionOriginal: { type: Date, optional: true, },
            fechaRecepcionOriginal: { type: Date, optional: true, },
            ciaContabID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ factura, fechaEmisionOriginal, fechaRecepcionOriginal, ciaContabID, });

        if (!factura || !factura.docState) {
            throw new Meteor.Error("Aparentemente, no se han editado los datos en la forma. No hay nada que actualizar.");
        }

        // una factura con pagos no puede ser alterada
        let pagosEnFactura = validarPagosEnFactura(factura.claveUnica);

        if (pagosEnFactura.error) {
            return {
                error: true,
                message: pagosEnFactura.message,
            }
        }


        if (factura.numeroFactura && factura.numeroFactura != '0') {
            // ------------------------------------------------------------------------------------------------------
            // el número de factura debe ser único. CxP: por proveedor; CxC: por ciaContab ...
            let validar_numeroFactura = validarNumeroFactura(factura.claveUnica,
                                                             factura.numeroFactura,
                                                             factura.cxCCxPFlag,
                                                             factura.proveedor,
                                                             ciaContabID);

            if (validar_numeroFactura.error) {
                return {
                    error: true,
                    message: validar_numeroFactura.message,
                }
            }
        }


        // nótese como la validación del UMC depende del tipo de compañía (prov o cliente)
        let validarUMCBancos = validarUMC_Bancos(factura.docState,
                                                 factura.cxCCxPFlag,
                                                 factura.fechaEmision,
                                                 factura.fechaRecepcion,
                                                 fechaEmisionOriginal,
                                                 fechaRecepcionOriginal,
                                                 ciaContabID);

        if (validarUMCBancos.error) {
            return {
                error: true,
                message: validarUMCBancos.message,
            }
        }

        // para facturas de proveedores y con retencion Iva, determinamos el número de comprobante ...
        if (factura.cxCCxPFlag === 1 && !factura.numeroComprobante && factura.retencionSobreIva) {

            if (!factura.comprobanteSeniat_UsarUnoExistente_Flag) {
                // Nota: si el usuario NO quiere uno existente, siempre calculamos uno nuevo y el #Operacion es 0
                let determinar_numeroComprobanteSeniat =
                    determinarNumeroComprobanteSeniat(factura.fechaRecepcion, factura.cia);

                if (determinar_numeroComprobanteSeniat.error) {
                    return {
                        error: true,
                        message: determinar_numeroComprobanteSeniat.message,
                    }
                }

                factura.numeroComprobante = determinar_numeroComprobanteSeniat.numeroComprobante;
                factura.numeroOperacion = 1;
            } else {
                // TODO: la funcion debe regresar uno para el proveedor; mismo mes y año; si no existe,
                // error. Si existe, regresar prox número operación
                let determinar_numeroComprobanteSeniatExistente =
                    determinarNumeroComprobanteSeniatExistente(factura.fechaRecepcion, factura.proveedor, factura.cia);

                if (determinar_numeroComprobanteSeniatExistente.error) {
                    return {
                        error: true,
                        message: determinar_numeroComprobanteSeniatExistente.message,
                    }
                }

                factura.numeroComprobante = determinar_numeroComprobanteSeniatExistente.numeroComprobante;
                factura.numeroOperacion = determinar_numeroComprobanteSeniatExistente.numeroOperacion;
            }
        }


        // determinamos las cuotas de la factura
        if (factura.docState != 3) {
            let calcular_cuotasFactura = calcularCuotasFactura(factura);

            if (calcular_cuotasFactura.error) {
                return {
                    error: true,
                    message: calcular_cuotasFactura.message,
                }
            }
        }


        let usuario = Meteor.users.findOne(Meteor.userId());
        let docState = factura.docState;

        if (factura.docState != 3) {
            if (factura.cxCCxPFlag == 2 && (!factura.numeroFactura || factura.numeroFactura === '0')) {
                // ------------------------------------------------------------------------------------------------------
                // solo para facturas a clientes y con número igual a 0, intentamos asignar un número consecutivo
                // el número de factura debe ser único. CxP: por proveedor; CxC: por ciaContab ...
                let determinar_ProxNumeroFacturaCxC = determinarProxNumeroFacturaCxC(factura);

                if (determinar_ProxNumeroFacturaCxC.error) {
                    return {
                        error: true,
                        message: determinar_ProxNumeroFacturaCxC.message,
                    }
                }

                factura.numeroFactura = determinar_ProxNumeroFacturaCxC.numeroFactura.toString();

                if (!factura.numeroControl || factura.numeroControl === '0') {
                    factura.numeroControl = determinar_ProxNumeroFacturaCxC.numeroControl.toString();
                }
            }
        }

        if (factura.docState == 1) {
            delete factura.docState;

            let factura_sql = _.clone(factura);
            // ------------------------------------------------------------------------------------------
            // sequelize siempre convierte las fechas a utc (es decir, las globaliza); nuestro offset
            // en ccs es -4.00; sequelize va a sumar 4.0 para llevar a utc; restamos 4.0 para eliminar
            // este efecto ...
            factura_sql.fechaEmision = factura_sql.fechaEmision ? moment(factura_sql.fechaEmision).subtract(TimeOffset, 'hours').toDate() : null;
            factura_sql.fechaRecepcion = factura_sql.fechaRecepcion ? moment(factura_sql.fechaRecepcion).subtract(TimeOffset, 'hours').toDate() : null;
            factura_sql.ingreso = factura_sql.ingreso ? moment(factura_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;
            factura_sql.ultAct = factura_sql.ultAct ? moment(factura_sql.ultAct).subtract(TimeOffset, 'hours').toDate() : null;

            // sequelize ignora algunas propiedades que no estén en el modelo; por eso no las eliminamos antes;
            // ej: _id, arrays de faltas y sueldos, etc.
            response = Async.runSync(function(done) {
                Facturas_sql.create(factura_sql)
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // el registro, luego de ser grabado en sql, es regresado en response.result.dataValues ...
            let savedItem = response.result.dataValues;
            factura.claveUnica = savedItem.claveUnica;

            // agregamos las impuestos y retenciones
            if (factura.impuestosRetenciones) {
                factura.impuestosRetenciones.forEach((impuesto) => {

                    delete impuesto._id;
                    delete impuesto.id;
                    impuesto.facturaID = factura.claveUnica;

                    response = Async.runSync(function(done) {
                        Facturas_Impuestos_sql.create(impuesto)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error)
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                })
            }

            // agregamos las cuotas de la factura
            factura.cuotasFactura.forEach((cuota) => {

                delete cuota._id;
                delete cuota.claveUnica;
                cuota.claveUnicaFactura = factura.claveUnica;

                response = Async.runSync(function(done) {
                    CuotasFactura_sql.create(cuota)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })
        };


        if (factura.docState == 2) {
            delete factura.docState;

            // -------------------------------------------------------------------------------------------------------------------------
            // ahora actualizamos el asiento contable; nótese como usamos el mismo objeto; sequelize ignora algunos fields que no
            // existan en el modelo ...

            // ----------------------------------------------------------------------------------------------------------------
            // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos 4.3 horas a cada una ...
            let factura_sql = _.clone(factura);

            factura_sql.fechaEmision = factura_sql.fechaEmision ? moment(factura_sql.fechaEmision).subtract(TimeOffset, 'hours').toDate() : null;
            factura_sql.fechaRecepcion = factura_sql.fechaRecepcion ? moment(factura_sql.fechaRecepcion).subtract(TimeOffset, 'hours').toDate() : null;
            factura_sql.ingreso = factura_sql.ingreso ? moment(factura_sql.ingreso).subtract(TimeOffset, 'hours').toDate() : null;

            let usuario = Meteor.users.findOne(this.userId);
            factura_sql.ultAct = moment(new Date()).subtract(TimeOffset, 'hours').toDate();
            factura_sql.usuario = usuario.emails[0].address;

            response = Async.runSync(function(done) {
                Facturas_sql.update(factura_sql, {
                        where: { claveUnica: factura_sql.claveUnica
                    }})
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            // eliminamos los registros de impuesto para la factura
            response = Async.runSync(function(done) {
                Facturas_Impuestos_sql.destroy({ where: { FacturaID: factura.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            // agregamos las impuestos y retenciones
            if (factura.impuestosRetenciones) {
                factura.impuestosRetenciones.forEach((impuesto) => {

                    delete impuesto._id;
                    delete impuesto.id;

                    response = Async.runSync(function(done) {
                        Facturas_Impuestos_sql.create(impuesto)
                            .then(function(result) { done(null, result); })
                            .catch(function (err) { done(err, null); })
                            .done();
                    });

                    if (response.error)
                        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                })
            }


            // eliminamos las cuotas para la factura
            response = Async.runSync(function(done) {
                CuotasFactura_sql.destroy({ where: { claveUnicaFactura: factura.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }


            // agregamos las cuotas de la factura
            factura.cuotasFactura.forEach((cuota) => {

                delete cuota._id;
                delete cuota.claveUnica;

                response = Async.runSync(function(done) {
                    CuotasFactura_sql.create(cuota)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                })

                if (response.error) {
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
                }
            })
        };


        if (factura.docState == 3) {
            // sql elimina (cascade delete) las tablas relacionadas en sql server ...
            response = Async.runSync(function(done) {
                Facturas_sql.destroy({ where: { claveUnica: factura.claveUnica } })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) {
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
        };

        let tempFactura = null;

        if (docState != 3) {
            // leemos nuevamente para actualizar el collection 'temp' en mongo; la idea es que el
            // registro *también* se actualize (modifique/agregue) en la lista (ie: filter --> lista) ...
            let where = `ClaveUnica = ${factura.claveUnica}`;

            let query = `Select f.ClaveUnica as claveUnica, f.NumeroFactura as numeroFactura,
                        f.NumeroControl as numeroControl,
                        f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion,
                	    p.Abreviatura as nombreCompania, m.Simbolo as simboloMoneda,
                        f.Concepto as concepto, f.NcNdFlag as ncNdFlag,
                	    Case f.CxCCxPFlag When 1 Then 'CxP' When 2 Then 'CxC' Else 'Indef' End As cxPCxC,
                        fp.Descripcion As nombreFormaPago,
                	    tp.Descripcion As nombreTipoServicio,
                	    f.NumeroComprobante as numeroComprobanteSeniat, f.MontoFacturaSinIva as montoNoImponible,
                        f.MontoFacturaConIva as montoImponible,
                	    f.IvaPorc as ivaPorc, f.Iva as iva, f.TotalFactura as totalFactura,
                        f.ImpuestoRetenido as retencionIslr, f.RetencionSobreIva as retencionIva,
                        f.Anticipo as anticipo, f.Saldo as saldo,
                	    Case Estado When 1 Then 'Pend' When 2 Then 'Parcial' When 3 Then 'Pag'
                        When 4 Then 'Anul' Else 'Indef' End As estadoFactura
                        From Facturas f Inner Join Proveedores p on f.Proveedor = p.Proveedor
                	    Inner Join FormasDePago fp on f.CondicionesDePago = fp.FormaDePago
                        Inner Join Monedas m on f.Moneda = m.Moneda
                	    Inner Join TiposProveedor tp On f.Tipo = tp.Tipo
                        Where ClaveUnica = ?
                        `;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query,
                    {
                        replacements: [ factura.claveUnica, ],
                        type: sequelize.QueryTypes.SELECT,
                    })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            tempFactura = _.isArray(response.result) && response.result.length ? response.result[0] : null;


            tempFactura._id = new Mongo.ObjectID()._str;
            tempFactura.user = Meteor.userId();

            // al leer de sql, sequelize intenta 'localizar' los dates; como sequelize resta el offset
            // para localizar, nosotros lo sumamos para contrarestar este efecto
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            tempFactura.fechaEmision = tempFactura.fechaEmision ? moment(tempFactura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            tempFactura.fechaRecepcion = tempFactura.fechaRecepcion ? moment(tempFactura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;
        };


        if (docState == 1) {
            Temp_Consulta_Bancos_Facturas.insert(tempFactura, function (error, result) {
                if (error)
                    throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
            })
        }
        else if (docState == 2) {
            delete tempFactura._id;
            Temp_Consulta_Bancos_Facturas.update(
                { claveUnica: tempFactura.claveUnica, user: this.userId, },
                { $set: tempFactura },
                { multi: false, upsert: false },
                function (error, result) {
                    if (error)
                        throw new Meteor.Error("validationErrors", error.message ? error.message : error.toString());
                });
        }
        else if (docState == 3) {
            // eliminamos el movimiento en mongo, para que se elimine de la lista (en filter --> list ...)
            Temp_Consulta_Bancos_Facturas.remove({
                user: this.userId,
                claveUnica: factura.claveUnica
            });

            // ponemos el pk en -999 para que la página se refresque para el usuario y no se lea nada (desde sql)
            factura.claveUnica = -999;
        }

        return {
            message: 'Ok, los datos han sido actualizados en la base de datos.',
            id: factura.claveUnica.toString(),
        };
    }
});


// --------------------------------------------------------------------------------
// para calcular las cuotas cada vez que el usuario hace un cambio en la factura

// nota: cuando el usuario modifica la factura desde este method, la factura nunca tendrá pagos; esto quiere decir que sus cuotas
// pueden ser reconstruidas, siempre, como si la factura fuera nueva ...
function calcularCuotasFactura(factura) {

    // ----------------------------------------------------------------------------------
    // eliminamos las cuotas antes (si existen)
    let query = `Delete From CuotasFactura Where ClaveUnicaFactura = ?`;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ factura.claveUnica ],
                type: sequelize.QueryTypes.DELETE
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    // -----------------------------------------------------------------------------------------------------
    // leemos la forma de pago de la factura; nótese que leemos directamente dFormasDePago (y no FormasDePago).
    // en esta tabla hay un registro para cada cuota que corresponde a la forma de pago indicada para la factura.
    // No es común que el usuario registre formas de pago que contengan más de 1 cuota ...
    response = Async.runSync(function(done) {
        dFormasDePago_sql.findAndCountAll(
            { where: { formaDePago: factura.condicionesDePago },
            raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    let formasDePago = response.result.rows;
    // -----------------------------------------------------------------------------------------------------

    // asumimos que hay un error si la forma de pago no tiene registros para determinar sus cuotas (en dFormasPago)
    if (formasDePago.length === 0) {
        let errorMessage = `Error: la forma de pago indicada para la factura, no posee registros asociados para
                            calcular sus cuotas. Toda forma de pago debe tener registros asociados que permitan
                            determinar las cuotas que corresponden a una factura a la cual se asocie esta
                            forma de pago.<br />
                            Por favor revise la forma de pago en <em>Bancos / Catálogos / Formas de pago</em> y
                            corrija esta situación, antes de intentar asociar esta forma de pago a una factura.
                           `;

        return {
            error: true,
            message: errorMessage,
        }
    }

    if (!factura.cuotasFactura || !_.isArray(factura.cuotasFactura))
        factura.cuotasFactura = [];

    // siempre eliminamos las cuotas que pueda ahora tener la factura
    factura.cuotasFactura.length = 0;


    let i = 0;
    let facturaMontoNoImponible = factura.montoFacturaSinIva ? factura.montoFacturaSinIva : 0;
    let facturaMontoImponible = factura.montoFacturaConIva ? factura.montoFacturaConIva : 0;
    let facturaMontoISLRRetenido = factura.impuestoRetenido ? factura.impuestoRetenido : 0;
    let facturaMontoIVARetenido = factura.retencionSobreIva ? factura.retencionSobreIva : 0;
    let facturaMontoIva = factura.iva ? factura.iva : 0;
    let facturaOtrosImpuestos = factura.otrosImpuestos ? factura.otrosImpuestos : 0;
    let facturaOtrasRetenciones = factura.otrasRetenciones ? factura.otrasRetenciones : 0;
    let facturaMontoAnticipo = factura.anticipo ? factura.anticipo : 0;

    // si la forma de pago de la factura tiene una sola cuota; simplemente copiamos los montos de la misma a la cuota ...
    if (formasDePago.length === 1) {
        let cuota = {};

        cuota.numeroDeCuota = 1;

        let formaPago = formasDePago[0];

        cuota.claveUnicaFactura = factura.claveUnica;
        cuota.numeroCuota = formaPago.numeroDeCuota;
        cuota.diasVencimiento = formaPago.diasDeVencimiento;
        cuota.fechaVencimiento = moment(factura.fechaRecepcion).add(formaPago.diasDeVencimiento, 'days').toDate();
        cuota.proporcionCuota = formaPago.proporcionCuota;      // siempre debe ser 100%

        cuota.montoCuota = facturaMontoNoImponible + facturaMontoImponible;

        if (facturaMontoIva != 0)
            cuota.iva = facturaMontoIva;

        if (facturaOtrosImpuestos != 0)
            cuota.otrosImpuestos = facturaOtrosImpuestos;

        if (facturaMontoISLRRetenido != 0)
            cuota.retencionSobreIslr = facturaMontoISLRRetenido;

        if (facturaMontoIVARetenido != 0)
            cuota.retencionSobreIva = facturaMontoIVARetenido;

        if (facturaOtrasRetenciones != 0)
            cuota.otrasRetenciones = facturaOtrasRetenciones;

        if (facturaMontoAnticipo != 0)
            cuota.anticipo = facturaMontoAnticipo;

        cuota.totalCuota = factura.totalAPagar;
        cuota.saldoCuota = factura.saldo;

        if (factura.estado == 4 || factura.estado == 1) {
            // si la factura está anulada o totalmente pendiente, simplemente asumimos su estado en cada cuota ...
            cuota.estadoCuota = factura.estado;
        }
        else {
            if (cuota.saldoCuota == 0)
                cuota.estadoCuota = 3;  //  totalemente pagada
            else if (cuota.saldoCuota < cuota.totalCuota)
                cuota.estadoCuota = 2;  //  parcialmente pagada
            else
                cuota.estadoCuota = 1;  //  pendiente
        }

        factura.cuotasFactura.push(cuota);
    }
    else {
        lodash(formasDePago).orderBy(['numeroDeCuota'], ['asc']).forEach((d) => {
            i++;

            let cuota = {};

            cuota.claveUnicaFactura = factura.claveUnica;

            cuota.numeroCuota = i;

            cuota.diasVencimiento = d.diasDeVencimiento;
            cuota.fechaVencimiento = moment(factura.fechaRecepcion).add(d.diasDeVencimiento, 'days').toDate();
            cuota.proporcionCuota = d.proporcionCuota;

            cuota.montoCuota = (facturaMontoNoImponible + facturaMontoImponible) * (d.proporcionCuota / 100);

            if (facturaMontoIva != 0 && d.proporcionIva)
                cuota.iva = facturaMontoIva * d.proporcionIva / 100;

            if (facturaOtrosImpuestos != 0 && d.proporcionIva)
                cuota.otrosImpuestos = facturaOtrosImpuestos * d.proporcionIva / 100;

            if (facturaMontoISLRRetenido != 0 && d.proporcionRetencionISLR != null)
                cuota.retencionSobreISLR = facturaMontoISLRRetenido * d.proporcionRetencionISLR / 100;

            if (facturaMontoIVARetenido != 0 && d.ProporcionRetencionIVA != null)
                cuota.retencionSobreIva = facturaMontoIVARetenido * d.proporcionRetencionIVA / 100;

            if (facturaOtrasRetenciones != 0 && d.ProporcionRetencionIVA != null)
                cuota.otrasRetenciones = facturaOtrasRetenciones * d.proporcionRetencionIVA / 100;

            cuota.totalCuota = cuota.montoCuota;

            // sumamos los impuestos ...
            if (cuota.iva != null)
                cuota.totalCuota += cuota.iva;

            if (cuota.otrosImpuestos != null)
                cuota.totalCuota += cuota.otrosImpuestos;

            // restamos las retenciones ...
            if (cuota.retencionSobreISLR != null)
                cuota.totalCuota -= cuota.retencionSobreISLR;

            if (cuota.retencionSobreIva != null)
                cuota.totalCuota -= cuota.retencionSobreIva;

            if (cuota.otrasRetenciones != null)
                cuota.totalCuota -= cuota.otrasRetenciones;

            cuota.SaldoCuota = cuota.totalCuota;

            if (facturaMontoAnticipo != 0)
                cuota.anticipo = facturaMontoAnticipo * d.proporcionCuota / 100;

            if (factura.estado == 4 || factura.estado == 1) {
                // si la factura está anulada o totalmente pendiente, simplemente asumimos su estado en cada cuota ...
                cuota.estadoCuota = factura.estado;
            }
            else {
                if (cuota.saldoCuota == 0)
                    cuota.estadoCuota = 3;  //  totalemente pagada
                else if (cuota.saldoCuota < cuota.totalCuota)
                    cuota.estadoCuota = 2;  //  parcialmente pagada
                else
                    cuota.estadoCuota = 1;  //  pendiente
            }

            factura.cuotasFactura.push(cuota);
        });
    };

    return {
        error: false,
    }
};


function validarUMC_Bancos (docState,
                            cxCCxPFlag,
                            fechaEmision,
                            fechaRecepcion,
                            fechaEmisionOriginal,
                            fechaRecepcionOriginal,
                            ciaContabID) {

    if (docState != 1) {
        if (cxCCxPFlag == 1) {
            // factura a proveedores; usamos la fecha de recepción
            let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaRecepcionOriginal, ciaContabID);

            if (validarMesCerradoEnBancos.error) {
                // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
                let errorMessage = ` Error: factura a proveedores; la fecha de recepción de la factura
                                     (${moment(fechaRecepcionOriginal).format('DD-MM-YYYY')}) corresponde
                                     a un mes ya cerrado en Bancos.
                                   `;
                return {
                    error: true,
                    message: errorMessage
                };
            };
        };

        if (cxCCxPFlag == 2) {
            // factura a clientes; usamos la fecha de recepción
            let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaEmisionOriginal, ciaContabID);

            if (validarMesCerradoEnBancos.error) {
                // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
                let errorMessage = ` Error: factura a clientes; la fecha de emisión de la factura
                                     (${moment(fechaEmisionOriginal).format('DD-MM-YYYY')}) corresponde
                                     a un mes ya cerrado en Bancos.
                                   `;
                return {
                    error: true,
                    message: errorMessage
                };
            };
        };

    };

    // arriba validamos las fechas 'originales' cuando el usuario modifica; ahora validamos las fechas indicadas
    // para la factura, al agregar o modificar
    if (cxCCxPFlag == 1) {
        // factura a proveedores; usamos la fecha de recepción
        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaRecepcion, ciaContabID);

        if (validarMesCerradoEnBancos.error) {
            // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
            let errorMessage = ` Error: factura a proveedores; la fecha de recepción de la factura
                                 (${moment(fechaRecepcion).format('DD-MM-YYYY')}) corresponde
                                 a un mes ya cerrado en Bancos.
                               `;
            return {
                error: true,
                message: errorMessage
            };
        };
    };

    if (cxCCxPFlag == 2) {
        // factura a clientes; usamos la fecha de recepción
        let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(fechaEmision, ciaContabID);

        if (validarMesCerradoEnBancos.error) {
            // aunque la función regresa su propio mensaje, preparamos uno propio para que sea más específico
            let errorMessage = ` Error: factura a clientes; la fecha de emisión de la factura
                                 (${moment(fechaEmision).format('DD-MM-YYYY')}) corresponde
                                 a un mes ya cerrado en Bancos.
                               `;
            return {
                error: true,
                message: errorMessage
            };
        };
    };

    return {
        error: false
    };
};

function validarPagosEnFactura(claveUnicaFactura) {

    // una factura con pagos no puede ser modificada; revisamos que no haya un pago (en dPagos)
    // para alguna de las cuotas de la factura

    let query = `Select Count(*) as contaPagos From Facturas f Inner Join CuotasFactura c
                 On f.ClaveUnica = c.ClaveUnicaFactura Inner Join dPagos p On
                 c.ClaveUnica = p.ClaveUnicaCuotaFactura
                 Where f.ClaveUnica = ?
                 `;

    let response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ claveUnicaFactura ],
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (response.result && response.result.length) {
        let contaPagos = response.result[0].contaPagos;
        if (contaPagos) {
            let errorMessage = ` Error: la factura tiene pagos asociados. Una factura con pagos asociados no puede ser alterada.
                               `;
            return {
                error: true,
                message: errorMessage
            };
        }
    }

    return {
        error: false
    }
}





function validarNumeroFactura(claveUnicaFactura, numeroFactura, cxCCxPFlag, proveedorID, ciaContabID) {
    // validamos que el número de factura no se haya usado antes.
    // factura cxp: no debe existir una para el mismo proveedor
    // factura cxc: no debe existir una para la misma cia Contab
    let response = null;
    let replacements = [];
    let query = ``;

    if (cxCCxPFlag == 1) {
        // factura de tipo CxP
        query = `Select Count(*) as contaFacturas From Facturas f
                     Where f.ClaveUnica <> ? And f.Proveedor = ? And NumeroFactura = ? And CxCCxPFlag = ? And Cia = ?`;
        replacements = [ claveUnicaFactura, proveedorID, numeroFactura, cxCCxPFlag, ciaContabID, ];
    } else {
        query = `Select Count(*) as contaFacturas From Facturas f
                     Where f.ClaveUnica <> ? And NumeroFactura = ? And CxCCxPFlag = ? And Cia = ?`;
        replacements = [ claveUnicaFactura, numeroFactura, cxCCxPFlag, ciaContabID, ];
    }

    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: replacements,
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })


    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (response.result && response.result.length) {
        let contaFacturas = response.result[0].contaFacturas;
        if (contaFacturas) {
            let errorMessage = "";
            if (cxCCxPFlag == 1) {
                // factura de tipo CxP
                errorMessage = `Error: ya existe una factura, para el proveedor indicado en la factura, registrada con ese número.<br />
                                No debe haber más de una factura de tipo CxP con el mismo número
                                para el mismo proveedor y en la misma compañía Contab.<br />
                                Por favor revise.`;
            } else {
                // factura de tipo CxC
                errorMessage = `Error: ya existe una factura a clientes registrada con ese número.<br />
                                No debe haber más de una factura de tipo CxC con el mismo número en la misma compañía Contab.<br />
                                Por favor revise.`;
            }

            return {
                error: true,
                message: errorMessage
            }
        }
    }

    return {
        error: false
    }
}


function determinarNumeroComprobanteSeniat(fechaRecepcion, ciaID) {

    // leemos el número de comprobante *mayor* que se ha usado para la compañía y construimos uno nuevo
    let response = null;
    let query = ``;

    // nótese como usamos Top para regresar solo el 1ro. Sql server 2008 no acepta limit ...
    query = `Select Top(1) NumeroComprobante as numeroComprobante From Facturas
             Where NumeroComprobante Is Not Null And CxCCxPFlag = 1 And Cia = ?
             Order By NumeroComprobante Desc
             `;

    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ ciaID ],
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        errorMessage = `Error: no existe un número de comprobante (Seniat) registrado para facturas de
                        esta compañía; por esta razón, no podemos determinar uno.<br />
                        Ud. debe indicar el número de comprobante para esta factura; para las próximas,
                        el proceso podrá determinar el uno.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    let numeroComprobante = response.result[0].numeroComprobante;

    if (numeroComprobante.length != 14) {
        errorMessage = `Error: el número de comprobante (${numeroComprobante}) leído en la base de datos
                        (para poder determinar éste) contiene más o menos de 14 caracteres.<br />
                        El número de comprobante registrado debe contener siempre 14 caracteres.<br />
                        Por favor revise y corrija esta situación antes de intentar grabar esta factura.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    // el numero de comprobante es un string en sql server; sin embargo, debe ser siempre numérico
    let isnum = /^\d+$/.test(numeroComprobante);

    if (!isnum) {
        errorMessage = `Error: el número de comprobante (${numeroComprobante}) leído en la base de datos
                        (para poder determinar éste) contiene caracteres diferentes a dígitos.<br />
                        El número de comprobante registrado debe siempre ser numérico.<br />
                        Por favor revise y corrija esta situación antes de intentar grabar esta factura.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    // todo a partir del 7 caracter
    let numeroComprobante2 = (parseInt(numeroComprobante) + 1).toString().substring(6);
    let mes = moment(fechaRecepcion).format('MM');
    let ano = moment(fechaRecepcion).format('YYYY');

    let numeroComprobanteProximo = ano + mes + numeroComprobante2;

    return {
        error: false,
        numeroComprobante: numeroComprobanteProximo
    }
}


function determinarNumeroComprobanteSeniatExistente(fechaRecepcion, proveedor, ciaID) {

    // buscamos el comprobante *mayor* para el proveedor y en el mes; agregamos 1 al numOper y regresamos
    let response = null;
    let query = ``;

    let primerDiaMes = new Date(fechaRecepcion.getFullYear(), fechaRecepcion.getMonth(), 1);
    // nótese como obtenemos el último día del mes
    let ultimoDiaMes = new Date(fechaRecepcion.getFullYear(), fechaRecepcion.getMonth() + 1, 0);

    // ahora leemos un comprobante para el *mismo* proveedor y mes
    query = `Select Top(1) NumeroComprobante as numeroComprobante, NumeroOperacion as numeroOperacion From Facturas
             Where NumeroComprobante Is Not Null And Proveedor = ?
             And FechaRecepcion Between ? And ?
             And CxCCxPFlag = 1 And Cia = ?
             Order By NumeroComprobante Desc, NumeroOperacion Desc
             `;

    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [
                                proveedor,
                                moment(primerDiaMes).format('YYYY-MM-DD'),
                                moment(ultimoDiaMes).format('YYYY-MM-DD'),
                                ciaID
                            ],
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        errorMessage = `Error: Ud. indicó que quiere <em>agregar esta factura a un comprobante que exista</em>
                        (para este mismo proveedor).<br />
                        Sin embargo, no hemos podido leer un comprobante para este proveedor y para el mismo mes
                        (${moment(fechaRecepcion).format('MM-YYYY')}),
                        para asignar esta factura a ese comprobante.<br />
                        Ud. puede dejar esta factura y revisar esta situación para determinar que pueda estar pasando, o
                        puede desmarcar la opción mencionada para asignar un nuevo número de comprobante.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    let numeroComprobante = response.result[0].numeroComprobante;
    let numeroOperacion = response.result[0].numeroOperacion;

    if (numeroComprobante.length != 14) {
        errorMessage = `Error: el número de comprobante (${numeroComprobante}) leído en la base de datos
                        (para asignar esta factura al mismo) contiene más o menos de 14 caracteres.<br />
                        El número de comprobante registrado debe contener siempre 14 caracteres.<br />
                        Por favor revise y corrija esta situación antes de intentar grabar esta factura.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    // el numero de comprobante es un string en sql server; sin embargo, debe ser siempre numérico
    let isnum = /^\d+$/.test(numeroComprobante);

    if (!isnum) {
        errorMessage = `Error: el número de comprobante (${numeroComprobante}) leído en la base de datos
                        (para asignar esta factura al mismo) contiene caracteres diferentes a dígitos.<br />
                        El número de comprobante registrado debe siempre ser numérico.<br />
                        Por favor revise y corrija esta situación antes de intentar grabar esta factura.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    // Ok, encontramos un número de comprobante para el proveedor y mes. Simplemente agregamos 1 al número de
    // operación y regresamos ...
    numeroOperacion++;

    return {
        error: false,
        numeroComprobante: numeroComprobante,
        numeroOperacion: numeroOperacion,
    }
}


function determinarProxNumeroFacturaCxC(factura) {
    // leemos la factura con un número mayor para la cia seleccionada y agregamos 1
    // hacemos algo similar para el número de control ...
    let response = null;
    let query = ``;

    // leemos el mayor número de factura, para la fecha más reciente
    // (nótese como leemos *solo* facturas cuyo numero de factura (nvarchar) sea numérico ...)
    query = `Select Top 1 NumeroFactura as numeroFactura, NumeroControl as numeroControl,
             FechaEmision as fechaEmision
             From Facturas
             Where NumeroFactura not like '%[^0-9]%' and NumeroFactura != '' And
            	   CxCCxPFlag = ? And Cia = ?
             Order by FechaEmision Desc, NumeroFactura Desc
            `;

    response = Async.runSync(function(done) {
        sequelize.query(query,
            {
                replacements: [ 2, factura.cia, ],
                type: sequelize.QueryTypes.SELECT
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    })

    if (response.error) {
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    if (!response.result.length) {
        let errorMessage = "";
        errorMessage = `Error: No hemos podido leer un número de factura para la compañía <em>Contab</em>
                        seleccionada.<br />
                        Para intentar asignar un número a esta factura, debemos leer una (inmediata) anterior,
                        pero no ha sido posible.<br /><br />
                        Probablemente, no hay facturas registradas o no tienen sus números de factura
                        registrados en forma numérica.<br />
                        Por favor <b>asigne Ud., en forma manual, un número a la factura.</b>, y luego
                        intente grabar la factura.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    let numeroFactura = response.result[0].numeroFactura;
    let numeroControl = response.result[0].numeroControl;
    let fechaEmision = response.result[0].fechaEmision;         // usamos solo si hay un error ...

    // nos *aseguramos* que el número de factura leído sea numérico (aunque el Select intenta ésto ...)
    let isnum = /^\d+$/.test(numeroFactura);

    if (!isnum) {
        let errorMessage = "";
        errorMessage = `Error: el número de factura (${numeroFactura}) leído en la base de datos,
                        para intentar determinar uno nuevo, contiene caracteres diferentes a dígitos.<br />
                        Por favor revise esta situación.<br />
                        Por alguna razón, este proceso leyó un número de factura que no es numérico.`;

        return {
            error: true,
            message: errorMessage,
        }
    }

    let nNumeroFactura = parseInt(numeroFactura) + 1;
    let nNumeroControl = 0;

    // con el Select arriba, no chequeamos que el número de control fuera numérico
    isnum = /^\d+$/.test(numeroControl);
    if (isnum) {
        nNumeroControl = parseInt(numeroControl) + 1;
    }

    // ------------------------------------------------------------------------------------------------------------
    // antes de regresar, nos aseguramos que el número determinado para la factura *no exista*; esto puede resultar
    // cuando el usuario registra números de factura que *no son consecutivos* en el tiempo; por ejemplo, la semana
    // pasada se registraron las facturas 500, 5001, 5002, ...; luego, esta semana se registra una factura 250.
    // Cuando el programa intente determinar el próximo número, calculará 251, el cual ya fue asignado en el pasado.

    // aunque esta validación se hace siempre más adelante, luego de esta función, lo hacemos aquí para regresar
    // un mensaje de error muy específico que intente orientar al usuario en la solución de esta situación ...
    let validar_numeroFactura = validarNumeroFactura(factura.claveUnica,
                                                     nNumeroFactura.toString(),
                                                     factura.cxCCxPFlag,
                                                     factura.proveedor,
                                                     factura.cia);

    if (validar_numeroFactura.error) {
        let errorMessage = "";
        errorMessage = `Error: al intentar determinar un número para el documento, pues los números para
                        documentos (de este tipo) que se han registrado para esta compañía <em>Contab</em>,
                        <b>no son consecutivos en el tiempo</b>.<br /><br />
                        Error al intentar asignar el número <b>${nNumeroFactura.toString()}</b>
                        a la factura que se está registrando, pues ya existe una factura con ese número
                        para la compañía <em>Contab</em> seleccionada.<br /><br />
                        Ud. puede consultar los documentos de este tipo para esta compañía y
                        corroborar esta situación.<br />
                        Ud. puede, también, asignar un número en forma manual a este documento y evitar así
                        que este proceso intente hacerlo.`;
        return {
            error: true,
            message: errorMessage,
        }
    }

    return {
        error: false,
        numeroFactura: nNumeroFactura,
        numeroControl: nNumeroControl,
    }
}
