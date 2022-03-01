

import moment from 'moment';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'bancos.facturas.anular': function (facturaID, noModificarAsientoContableAsociado) {

        new SimpleSchema({
            facturaID: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ facturaID, });

        // una factura con pagos no puede ser alterada
        let pagosEnFactura = validarPagosEnFactura(facturaID);

        if (pagosEnFactura.error) {
          throw new Meteor.Error('bancos.facturas.anular.errorPagosEnFactura',
                                 `Error al intentar validar pagos en la factura.`,
                                  pagosEnFactura.message);
        }

        // leemos la factura
        let response = null;
        response = Async.runSync(function(done) {
            Facturas_sql.findAll(
                {
                    where: { claveUnica: facturaID },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
          throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // la factura no pudo ser leída (???!!!)
        if (!response.result.length) {
          let mensaje = `Error inesperado: la factura no pudo ser leída desde la base de datos. Por favor revise.`;

          throw new Meteor.Error('bancos.facturas.anular.errorAlIntentarLeerFactura',
                                 `Error al intentar leer la factura.`,
                                  mensaje);
        }

        let factura = response.result[0];

        // ajustamos las fechas
        factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
        factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

        // validamos el UMC en bancos
        let fechaEmisionOriginal = factura.fechaEmision;
        let fechaRecepcionOriginal = factura.fechaRecepcion;

        let validarUMCBancos = validarUMC_Bancos(factura.docState,
                                                 factura.cxCCxPFlag,
                                                 factura.fechaEmision,
                                                 factura.fechaRecepcion,
                                                 fechaEmisionOriginal,
                                                 fechaRecepcionOriginal,
                                                 factura.cia);

        if (validarUMCBancos.error) {
          throw new Meteor.Error('bancos.facturas.anular.MesCerradoEnBancos',
                                 `Error al validar el mes cerrado en Bancos.`,
                                  validarUMCBancos.message);
        }



        if (!noModificarAsientoContableAsociado) {
          // solo si la factura tiene un asiento, validamos el último mes cerrado en Contab ...
          let query = `Select Fecha as fecha From Asientos Where ProvieneDe = 'Facturas' And ProvieneDe_ID = ? And Cia = ?`;

          response = null;
          response = Async.runSync(function(done) {
              sequelize.query(query, { replacements: [ facturaID, factura.cia ],
                                       type: sequelize.QueryTypes.SELECT
                                     })
                  .then(function(result) { done(null, result); })
                  .catch(function (err) { done(err, null); })
                  .done();
          });

          if (response.error)
              throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

          if (response.result.length) {
              // ok, hay un asiento asociado; validamos el umc en contab ...
              let fechaAsiento = response.result[0].fecha;
              // ajustamos la fecha pues siempre viene 'globalized' ...
              fechaAsiento = fechaAsiento ? moment(fechaAsiento).add(TimeOffset, 'hours').toDate() : null;

              let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(fechaAsiento,
                                                                                        factura.cia,
                                                                                        false   // si es del tipo cierre anual; asumimos que no
                                                                                      );

              if (validarMesCerradoEnContab.error) {
                throw new Meteor.Error('bancos.facturas.anular.MesCerradoEnContab',
                                       `Error al validar el mes cerrado en Contab.`,
                                        validarMesCerradoEnContab.errMessage);
              }
          }
        }


        // ponemos todos los montos en cero
        anularFactura(factura.claveUnica);


        // si la factura tiene un asiento, lo modificamos para poner sus montos en cero ...
        if (!noModificarAsientoContableAsociado) {
          let usuario = Meteor.users.findOne(this.userId);
          anularAsientoContable(factura.claveUnica, factura.cia, usuario);
        }


        return {
          message: 'Ok, la factura esta ahora anulada.'
        }
    }
})



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
}

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

function anularFactura(claveUnicaFactura) {

  // facturas
  let query = `Update Facturas Set MontoFacturaSinIva = 0, MontoFacturaConIva = 0, Iva = 0, TotalFactura = 0, MontoSujetoARetencion = 0,
                                   ImpuestoRetenidoISLRAntesSustraendo = 0,  ImpuestoRetenidoIslrSustraendo = 0,
                                   ImpuestoRetenido = 0, RetencionSobreIva = 0, OtrosImpuestos = 0, OtrasRetenciones = 0,
                                   TotalAPagar = 0, Saldo = 0, Estado = 4
               Where ClaveUnica = ?
               `;

  let response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query,
          {
              replacements: [ claveUnicaFactura ],
              type: sequelize.QueryTypes.UPDATE
          })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  });

  if (response.error) {
      throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
  }
  // ------------------------------------------------------------------------------------------------------------------------
  // cuotas de factura
  query = `Update CuotasFactura Set MontoCuota = 0, Iva = 0,
                  RetencionSobreIslr = 0, RetencionSobreIva = 0, OtrosImpuestos = 0, OtrasRetenciones = 0,
                  TotalCuota = 0, SaldoCuota = 0, EstadoCuota = 4
                  Where ClaveUnicaFactura = ?
               `;

  response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query,
          {
              replacements: [ claveUnicaFactura ],
              type: sequelize.QueryTypes.UPDATE
          })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  });

  if (response.error) {
      throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
  }
  // ------------------------------------------------------------------------------------------------------------------------
  // impuestos y retenciones
  query = `Update Facturas_Impuestos Set MontoBase = 0, MontoAntesSustraendo = 0,
                  Sustraendo = 0, Monto = 0 Where FacturaID = ?
               `;

  response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query,
          {
              replacements: [ claveUnicaFactura ],
              type: sequelize.QueryTypes.UPDATE
          })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  });

  if (response.error) {
      throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
  }
  // ------------------------------------------------------------------------------------------------------------------------

    return;
}

function anularAsientoContable(claveUnicaFactura, ciaContab, usuario) {

  // dAsientos
  let query = `Update d Set d.Debe = 0, d.Haber = 0
               From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
               Where a.ProvieneDe = 'Facturas' And a.ProvieneDe_ID = ? And a.Cia = ?
               `;

  let response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query,
          {
              replacements: [ claveUnicaFactura, ciaContab ],
              type: sequelize.QueryTypes.UPDATE
          })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  });

  if (response.error) {
      throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
  }
  // ------------------------------------------------------------------------------------------------------------------------
  // Asientos
  query = `Update Asientos Set UltAct = '${moment(new Date()).format('YYYY-MM-DD HH:mm')}', Usuario = '${usuario.emails[0].address}'
                  Where ProvieneDe = 'Facturas' And ProvieneDe_ID = ? And Cia = ?
               `;

  response = null;
  response = Async.runSync(function(done) {
      sequelize.query(query,
          {
              replacements: [ claveUnicaFactura, ciaContab ],
              type: sequelize.QueryTypes.SELECT
          })
          .then(function(result) { done(null, result); })
          .catch(function (err) { done(err, null); })
          .done();
  });

  if (response.error) {
      throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
  }
  // ------------------------------------------------------------------------------------------------------------------------

    return;
}
