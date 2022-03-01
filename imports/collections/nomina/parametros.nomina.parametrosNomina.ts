



import SimpleSchema from 'simpl-schema';

// esta tabla no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
export const parametrosNomina_schema = new SimpleSchema({
    agregarAsientosContables: { type: Boolean, label: "Agregar asiento contable de nómina?", optional: true },
    tipoAsientoDefault: { type: String, label: "Tipo del asiento (defecto)", optional: true, min: 1, max: 6,  },
    cuentaContableNomina: { type: Number, label: "Cuenta contable de nómina", optional: true },
    monedaParaElAsiento: { type: Number, label: "Moneda para el asiento (default)", optional: true },
    sumarizarPartidaAsientoContable: { type: Number, label: "Sumarizar partidas en el asiento?", optional: true },
    cia: { type: Number, label: "ID", optional: false },
    docState: { type: Number, optional: true },
})