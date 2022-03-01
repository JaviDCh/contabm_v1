
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// NOTA IMPORTANTE: según este schema los bancos contienen un array de agencias y éstas, a su vez, un array de 
// cuentas bancarias. 
// En sql server estas son tablas separadas, aunque relacionadas. La idea de este schema es poder validar 
// el catálogo de bancos que el usuario edita (CRUD). En el method en el server las tres tablas son separadas y 
// grabadas en forma separada ... 

let cuentasBancarias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false, },
    cuentaInterna: { type: Number, label: "ID cuenta bancaria", optional: false, },
    cuentaBancaria: { type: String, label: "Cuenta bancaria", optional: false, min: 1, max: 50,  },
    tipo: { type: String, label: 'Tipo cuenta', optional: false, min: 1, max: 2,  },
    moneda: { type: Number, label: 'Moneda cuenta', optional: false, },
    lineaCredito: { type: Number, label: "Línea de crédito", optional: true,  },
    estado: { type: String, label: "Estado", optional: false, min: 1, max: 2,  },
    cuentaContable: { type: Number, label: "Cuenta contable", optional: true, },
    cuentaContableGastosIDB: { type: Number, label: "Cuenta contable IDB", optional: true, },
    numeroContrato: { type: String, label: "Número de contrato", optional: true, min: 0, max: 20,  },
    chequeras: { type: Array, optional: true, minCount: 0 },
    cia: { type: Number, label: "Cia Contab", optional: false, },
    docState: { type: Number, optional: true, }
})

let agencias_SimpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },
    agencia: { type: Number, label: "Agencia", optional: false },
    nombre: { type: String, label: "Nombre de la agencia", optional: false, min: 1, max: 50, },
    direccion: { type: String, label: 'Dirección', optional: true, min: 0, max: 255, },
    telefono1: { type: String, label: 'Telefono', optional: true, min: 0, max: 14,  },
    telefono2: { type: String, label: "Telefono", optional: true, min: 0, max: 14,  },
    fax: { type: String, label: "Fax", optional: true, min: 0, max: 14, },
    contacto1: { type: String, label: "Contacto en la agencia", optional: true, min: 0, max: 50, },
    contacto2: { type: String, label: "Contacto en la agencia", optional: true, min: 0, max: 50, },
    cuentasBancarias: { type: Array, optional: true, minCount: 0 },
    'cuentasBancarias.$': { type: cuentasBancarias_SimpleSchema },
    docState: { type: Number, optional: true, }
})

let bancos_SimpleSchema: any = new SimpleSchema({
    _id: { type: String, optional: false },
    banco: { type: Number, label: "Banco", optional: false },
    nombre: { type: String, label: "Nombre", optional: false, min: 1, max: 50, },
    nombreCorto: { type: String, label: 'Nombre corto', optional: false, min: 1, max: 10, },
    abreviatura: { type: String, label: 'Abreviatura', optional: false, min: 1, max: 6, },
    codigo: { type: String, label: "Código", optional: true, min: 0, max: 4, },
    agencias: { type: Array, optional: true, minCount: 0 },
    'agencias.$': { type: agencias_SimpleSchema },
    docState: { type: Number, optional: true, }
})

export const Bancos: any = new Mongo.Collection("bancos");
Bancos.attachSchema(bancos_SimpleSchema);
