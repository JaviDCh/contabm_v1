
import { sequelize } from '../_globals/_loadThisFirst/_globals';
import Sequelize from 'sequelize';

Facturas_sql = sequelize.define('facturas', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false },
    proveedor: { type: Sequelize.INTEGER, field: 'Proveedor', allowNull: false },
    numeroFactura: { type: Sequelize.STRING, field: 'NumeroFactura', allowNull: false },
    numeroControl: { type: Sequelize.STRING, field: 'NumeroControl', allowNull: true },
    ncNdFlag: { type: Sequelize.STRING, field: 'NcNdFlag', allowNull: true },
    numeroFacturaAfectada: { type: Sequelize.STRING, field: 'NumeroFacturaAfectada', allowNull: true },
    numeroComprobante: { type: Sequelize.STRING, field: 'NumeroComprobante', allowNull: true },
    numeroOperacion: { type: Sequelize.INTEGER, field: 'NumeroOperacion', allowNull: true },
    comprobanteSeniat_UsarUnoExistente_Flag: { type: Sequelize.BOOLEAN, field: 'ComprobanteSeniat_UsarUnoExistente_Flag', allowNull: true },
    tipo: { type: Sequelize.INTEGER, field: 'Tipo', allowNull: false },
    numeroPlanillaImportacion: { type: Sequelize.STRING, field: 'NumeroPlanillaImportacion', allowNull: true },
    condicionesDePago: { type: Sequelize.INTEGER, field: 'CondicionesDePago', allowNull: false },
    fechaEmision: { type: Sequelize.DATE, field: 'FechaEmision', allowNull: false },
    fechaRecepcion: { type: Sequelize.DATE, field: 'FechaRecepcion', allowNull: false },
    concepto: { type: Sequelize.STRING, field: 'Concepto', allowNull: true },
    montoFacturaSinIva: { type: Sequelize.DECIMAL(10, 2), field: 'MontoFacturaSinIva', allowNull: true },
    montoFacturaConIva: { type: Sequelize.DECIMAL(10, 2), field: 'MontoFacturaConIva', allowNull: true },
    tipoAlicuota: { type: Sequelize.STRING, field: 'TipoAlicuota', allowNull: true },
    ivaPorc: { type: Sequelize.DECIMAL(6, 3), field: 'IvaPorc', allowNull: true },
    iva: { type: Sequelize.DECIMAL(10, 2), field: 'Iva', allowNull: true },
    totalFactura: { type: Sequelize.DECIMAL(10, 2), field: 'TotalFactura', allowNull: false },
    codigoConceptoRetencion: { type: Sequelize.STRING, field: 'CodigoConceptoRetencion', allowNull: true },
    montoSujetoARetencion: { type: Sequelize.DECIMAL(10, 2), field: 'MontoSujetoARetencion', allowNull: true },
    impuestoRetenidoPorc: { type: Sequelize.DECIMAL(6, 3), field: 'ImpuestoRetenidoPorc', allowNull: true },
    impuestoRetenidoISLRAntesSustraendo: { type: Sequelize.DECIMAL(10, 2), field: 'ImpuestoRetenidoISLRAntesSustraendo', allowNull: true },
    impuestoRetenidoISLRSustraendo: { type: Sequelize.DECIMAL(10, 2), field: 'ImpuestoRetenidoISLRSustraendo', allowNull: true },
    impuestoRetenido: { type: Sequelize.DECIMAL(10, 2), field: 'ImpuestoRetenido', allowNull: true },
    fRecepcionRetencionISLR: { type: Sequelize.DATE, field: 'FRecepcionRetencionISLR', allowNull: true },
    retencionSobreIvaPorc: { type: Sequelize.DECIMAL(6, 3), field: 'RetencionSobreIvaPorc', allowNull: true },
    retencionSobreIva: { type: Sequelize.DECIMAL(10, 2), field: 'RetencionSobreIva', allowNull: true },
    fRecepcionRetencionIVA: { type: Sequelize.DATE, field: 'FRecepcionRetencionIVA', allowNull: true },
    otrosImpuestos: { type: Sequelize.DECIMAL(10, 2), field: 'OtrosImpuestos', allowNull: true },
    otrasRetenciones: { type: Sequelize.DECIMAL(10, 2), field: 'OtrasRetenciones', allowNull: true },
    totalAPagar: { type: Sequelize.DECIMAL(10, 2), field: 'TotalAPagar', allowNull: false },
    anticipo: { type: Sequelize.DECIMAL(10, 2), field: 'Anticipo', allowNull: true },
    saldo: { type: Sequelize.DECIMAL(10, 2), field: 'Saldo', allowNull: false },
    estado: { type: Sequelize.INTEGER, field: 'Estado', allowNull: false },
    claveUnicaUltimoPago: { type: Sequelize.INTEGER, field: 'ClaveUnicaUltimoPago', allowNull: true },
    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false },
    cxCCxPFlag: { type: Sequelize.INTEGER, field: 'CxCCxPFlag', allowNull: false },
    comprobante: { type: Sequelize.INTEGER, field: 'Comprobante', allowNull: true },
    importacionFlag: { type: Sequelize.BOOLEAN, field: 'ImportacionFlag', allowNull: true },
    modificadoPor: { type: Sequelize.STRING, field: 'ModificadoPor', allowNull: true },
    lote: { type: Sequelize.STRING, field: 'Lote', allowNull: true },
    ingreso: { type: Sequelize.DATE, field: 'Ingreso', allowNull: false },
    ultAct: { type: Sequelize.DATE, field: 'UltAct', allowNull: false },
    usuario: { type: Sequelize.STRING, field: 'Usuario', allowNull: false },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false },
}, {
     tableName: 'Facturas'
});


Facturas_Impuestos_sql = sequelize.define('facturas_Impuestos', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false },
    facturaID: { type: Sequelize.INTEGER, field: 'FacturaID', allowNull: false },
    impRetID: { type: Sequelize.INTEGER, field: 'ImpRetID', allowNull: false },
    codigo: { type: Sequelize.STRING, field: 'Codigo', allowNull: true },
    montoBase: { type: Sequelize.DECIMAL(10, 2), field: 'MontoBase', allowNull: true },
    porcentaje: { type: Sequelize.DECIMAL(6, 3), field: 'Porcentaje', allowNull: true },
    tipoAlicuota: { type: Sequelize.STRING, field: 'TipoAlicuota', allowNull: true },
    montoAntesSustraendo: { type: Sequelize.DECIMAL(10, 2), field: 'MontoAntesSustraendo', allowNull: true },
    sustraendo: { type: Sequelize.DECIMAL(10, 2), field: 'Sustraendo', allowNull: true },
    monto: { type: Sequelize.DECIMAL(10, 2), field: 'Monto', allowNull: false },
    fechaRecepcionPlanilla: { type: Sequelize.DATE, field: 'FechaRecepcionPlanilla', allowNull: true },
    contabilizarAlPagar_flag: { type: Sequelize.BOOLEAN, field: 'ContabilizarAlPagar_flag', allowNull: true },
}, {
     tableName: 'Facturas_Impuestos'
});


CuotasFactura_sql = sequelize.define('cuotasFactura', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', primaryKey: true, autoIncrement: true, allowNull: false },
    claveUnicaFactura: { type: Sequelize.INTEGER, field: 'ClaveUnicaFactura', allowNull: false },
    numeroCuota: { type: Sequelize.INTEGER, field: 'NumeroCuota', allowNull: false },
    diasVencimiento: { type: Sequelize.INTEGER, field: 'DiasVencimiento', allowNull: false },
    fechaVencimiento: { type: Sequelize.DATE, field: 'FechaVencimiento', allowNull: false },
    proporcionCuota: { type: Sequelize.DECIMAL(6, 3), field: 'ProporcionCuota', allowNull: false },
    montoCuota: { type: Sequelize.DECIMAL(10, 2), field: 'MontoCuota', allowNull: false },
    iva: { type: Sequelize.DECIMAL(10, 2), field: 'Iva', allowNull: true },
    retencionSobreIva: { type: Sequelize.DECIMAL(10, 2), field: 'RetencionSobreIva', allowNull: true },
    retencionSobreIslr: { type: Sequelize.DECIMAL(10, 2), field: 'RetencionSobreISLR', allowNull: true },
    otrosImpuestos: { type: Sequelize.DECIMAL(10, 2), field: 'OtrosImpuestos', allowNull: true },
    otrasRetenciones: { type: Sequelize.DECIMAL(10, 2), field: 'OtrasRetenciones', allowNull: true },
    totalCuota: { type: Sequelize.DECIMAL(10, 2), field: 'TotalCuota', allowNull: false },
    anticipo: { type: Sequelize.DECIMAL(10, 2), field: 'Anticipo', allowNull: true },
    saldoCuota: { type: Sequelize.DECIMAL(10, 2), field: 'SaldoCuota', allowNull: false },
    estadoCuota: { type: Sequelize.INTEGER, field: 'EstadoCuota', allowNull: false },
}, {
     tableName: 'CuotasFactura'
});

 // relations / asociations
 Facturas_sql.hasMany(Facturas_Impuestos_sql, { as: 'impuestosRetenciones', foreignKey: 'facturaID' } );
 Facturas_Impuestos_sql.belongsTo(Facturas_sql, { as: 'factura', foreignKey: 'facturaID' } );
