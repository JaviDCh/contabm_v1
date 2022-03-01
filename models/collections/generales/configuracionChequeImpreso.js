
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';﻿

// -----------------------------------------------------------------------
// Datos de configuración para el proceso de impresión de cheques
// -----------------------------------------------------------------------
var schema = new SimpleSchema({
    _id: { type: String,optional: false },
    elaboradoPor: { type: String, optional: true, },
    revisadoPor: { type: String, optional: true, },
    aprobadoPor: { type: String, optional: true, },
    contabilizadoPor: { type: String, optional: true, },
    cia: { type: String, optional: true, },
});

ConfiguracionChequeImpreso = new Mongo.Collection("configuracionChequeImpreso");
ConfiguracionChequeImpreso.attachSchema(schema);
