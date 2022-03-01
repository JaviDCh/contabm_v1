

import SimpleSchema from 'simpl-schema';

// esta tabla no existe en mongo; creamos este schema para validar cuando el usuario edita ... 
export const nominaParametrosSalarioMinimo_schema = new SimpleSchema({
    id: { type: Number, label: "ID", optional: false },
    desde: { type: Date, label: "Desde", optional: false },
    monto: { type: Number, label: "Monto", optional: false },
    docState: { type: Number, optional: true },
})
