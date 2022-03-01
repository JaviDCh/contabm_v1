
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    claveUnica: { type: Number, label: "ID", optional: false, },
    rubro: { type: Number, label: "Rubro", optional: false, },
    empleado: { type: Number, label: "Empleado", optional: true, },
    departamento: { type: Number, label: "Departamento", optional: true, },
    cuentaContable: { type: Number, label: "Cuenta contable", optional: false, },
    sumarizarEnUnaPartidaFlag: { type: Boolean, label: "Sumarizar?", optional: true, },
    cia: { type: Number, label: "Cia Contab", optional: false, },

    user: { type: String, label: 'Mongo user', optional: false, },
    docState: { type: Number, optional: true, }
});

Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro = new Mongo.Collection("temp_consulta_nomina_cuentasContablesEmpleadoRubro");
Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.attachSchema(simpleSchema);
