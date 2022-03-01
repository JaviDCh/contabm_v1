
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

validarComprobanteSeniat = function() {

    let numeroComprobante = this.field("numeroComprobante").value;
    let numeroOperacion = this.field("numeroOperacion").value;

    if ((numeroComprobante && !numeroOperacion) || (!numeroComprobante && numeroOperacion)) {
        return `Error: si el usuario indica algún valor para el campo Número de Comprobante,
                debe siempre también indicar el número de operación (y viceversa).`;
    };

    if (numeroComprobante && numeroComprobante.length != 14) {
        return `Error: el Número de Comprobante debe siempre tener 14 caracteres
                (4 para el año, 2 para el mes y 8 para el consecutivo)
                `;
    };

    return true;
};

validarFechasFactura = function() {
    let fechaEmision = this.field("fechaEmision").value;
    let fechaRecepcion = this.field("fechaRecepcion").value;

    if (fechaEmision && fechaRecepcion) {
        if (fechaEmision > fechaRecepcion) {
            return `Error: la fecha de emisión de la factura no debe ser posterior a la fecha de recepción.`;
        }
    }
    return true;
};

validarAnticipo = function() {
    let anticipo = this.field("anticipo").value;
    let totalAPagar = this.field("totalAPagar").value;

    if (anticipo && totalAPagar) {
        if (anticipo > totalAPagar) {
            return `Error: el anticipo debe siempre ser menor que el total a pagar.`;
        }
    }
    return true;
};

let facturasImpuestos_SimpleSchema = new SimpleSchema({
     _id: { type: String, label: '_id', optional: true, },       // tipo mongo, solo útil al validar ...
     id: { type: Number, label: 'ID', optional: false },
     facturaID: { type: Number, label: 'FacturaID', optional: false },
     impRetID: { type: Number, label: 'ImpRetID', optional: false },
     codigo: { type: String, label: 'Codigo', optional: true },
     montoBase: { type: Number, label: 'MontoBase', optional: true },
     porcentaje: { type: Number, label: 'Porcentaje', optional: true },
     tipoAlicuota: { type: String, label: 'TipoAlicuota', optional: true },
     montoAntesSustraendo: { type: Number, label: 'MontoAntesSustraendo', optional: true },
     sustraendo: { type: Number, label: 'Sustraendo', optional: true },
     monto: { type: Number, label: 'Monto', optional: false },
     fechaRecepcionPlanilla: { type: Date, label: 'FechaRecepcionPlanilla', optional: true },
     contabilizarAlPagar_flag: { type: Boolean, label: 'Contabilizar al pagar?', optional: true },
 });

 let cuotasFactura_SimpleSchema = new SimpleSchema({
      _id: { type: String, label: '_id', optional: true, },       // tipo mongo, solo útil al validar ...
      claveUnica: { type: Number, label: 'ID', optional: false },
      claveUnicaFactura: { type: Number, label: 'FacturaID', optional: false },
      numeroCuota: { type: Number, label: '#Cuota', optional: false },
      diasVencimiento: { type: Number, label: 'Días venc', optional: false },
      fechaVencimiento: { type: Date, label: 'F venc', optional: false },
      proporcionCuota: { type: Number, label: '%', optional: false },
      montoCuota: { type: Number, label: 'Monto', optional: false },
      iva: { type: Number, label: 'Iva', optional: true },
      retencionSobreIva: { type: Number, label: 'Ret iva', optional: true },
      retencionSobreIslr: { type: Number, label: 'Ret islr', optional: true },
      otrosImpuestos: { type: Number, label: 'Otros imp', optional: true },
      otrasRetenciones: { type: Number, label: 'Otras ret', optional: true },
      totalCuota: { type: Number, label: 'Total', optional: false },
      anticipo: { type: Number, label: 'Anticipo', optional: true },
      saldoCuota: { type: Number, label: 'Saldo', optional: false },
      estadoCuota: { type: Number, label: 'Estado', optional: false },
  });


let facturas_SimpleSchema = new SimpleSchema({
    claveUnica: { type: Number, label: 'ClaveUnica', optional: false },
    proveedor: { type: Number, label: 'Compañía (proveedor o cliente)', optional: false },
    numeroFactura: { type: String, label: 'Número de factura', optional: false },
    numeroControl: { type: String, label: 'Número de control', optional: true },
    ncNdFlag: { type: String, label: 'NcNdFlag', optional: true },
    numeroFacturaAfectada: { type: String, label: 'Número de la factura afectada', optional: true },
    numeroComprobante: { type: String, label: 'Número de comprobante', optional: true, custom: validarComprobanteSeniat, },
    numeroOperacion: { type: Number, label: 'Número de operación', optional: true },
    comprobanteSeniat_UsarUnoExistente_Flag: { type: Boolean, label: 'ComprobanteSeniat_UsarUnoExistente_Flag', optional: true },
    tipo: { type: Number, label: 'Tipo', optional: false },
    numeroPlanillaImportacion: { type: String, label: 'NumeroPlanillaImportacion', optional: true },
    condicionesDePago: { type: Number, label: 'Condición de pago', optional: false },
    fechaEmision: { type: Date, label: 'Fecha de emisión', optional: false, custom: validarFechasFactura, },
    fechaRecepcion: { type: Date, label: 'Fecha de recepción', optional: false },
    concepto: { type: String, label: 'Concepto', optional: true },
    // este valor no está en sql; lo agregamos a la factura para, temporalmente, guardar este valor ...
    montoFactura: { type: Number, label: 'Monto de la factura', optional: true },
    montoFacturaSinIva: { type: Number, label: 'Monto no imponible', optional: true },
    montoFacturaConIva: { type: Number, label: 'Monto imponible', optional: true },

    impuestosRetenciones: { type: Array, optional: true, minCount: 0, },
    'impuestosRetenciones.$': { type: facturasImpuestos_SimpleSchema },
    cuotasFactura: { type: Array, optional: true, minCount: 0, },
    'cuotasFactura.$': { type: cuotasFactura_SimpleSchema },

    tipoAlicuota: { type: String, label: 'Tipo de alícuota (Iva)', optional: true },
    ivaPorc: { type: Number, label: 'IvaPorc', optional: true },
    iva: { type: Number, label: 'Iva', optional: true },
    totalFactura: { type: Number, label: 'Total de la factura', optional: false },
    codigoConceptoRetencion: { type: String, label: 'CodigoConceptoRetencion', optional: true },
    montoSujetoARetencion: { type: Number, label: 'MontoSujetoARetencion', optional: true },
    impuestoRetenidoPorc: { type: Number, label: 'ImpuestoRetenidoPorc', optional: true },
    impuestoRetenidoISLRAntesSustraendo: { type: Number, label: 'ImpuestoRetenidoISLRAntesSustraendo', optional: true },
    impuestoRetenidoISLRSustraendo: { type: Number, label: 'ImpuestoRetenidoISLRSustraendo', optional: true },
    impuestoRetenido: { type: Number, label: 'ImpuestoRetenido', optional: true },
    fRecepcionRetencionISLR: { type: Date, label: 'FRecepcionRetencionISLR', optional: true },
    retencionSobreIvaPorc: { type: Number, label: 'RetencionSobreIvaPorc', optional: true },
    retencionSobreIva: { type: Number, label: 'RetencionSobreIva', optional: true },
    fRecepcionRetencionIVA: { type: Date, label: 'FRecepcionRetencionIVA', optional: true },
    otrosImpuestos: { type: Number, label: 'OtrosImpuestos', optional: true },
    otrasRetenciones: { type: Number, label: 'OtrasRetenciones', optional: true },
    totalAPagar: { type: Number, label: 'Total a pagar', optional: false },
    anticipo: { type: Number, label: 'Anticipo', optional: true, custom: validarAnticipo, },
    saldo: { type: Number, label: 'Saldo', optional: false },
    estado: { type: Number, label: 'Estado', optional: false },
    claveUnicaUltimoPago: { type: Number, label: 'ClaveUnicaUltimoPago', optional: true },
    moneda: { type: Number, label: 'Moneda', optional: false },
    cxCCxPFlag: { type: Number, label: 'Tipo de la factura: cxc / cxp', optional: false, allowedValues: [1, 2], },
    comprobante: { type: Number, label: 'Comprobante', optional: true },
    importacionFlag: { type: Boolean, label: 'ImportacionFlag', optional: true },
    modificadoPor: { type: String, label: 'ModificadoPor', optional: true },
    lote: { type: String, label: 'Lote', optional: true },
    ingreso: { type: Date, label: 'Ingreso', optional: false },
    ultAct: { type: Date, label: 'UltAct', optional: false },
    usuario: { type: String, label: 'Usuario', optional: false },
    cia: { type: Number, label: 'Cia', optional: false },

    docState: { type: Number, optional: true },
});

Facturas = new Mongo.Collection("facturas");
Facturas.attachSchema(facturas_SimpleSchema);

 // FacturasImpuestos = new Mongo.Collection("facturasImpuestos");
 // FacturasImpuestos.attachSchema(facturasImpuestos_SimpleSchema);
