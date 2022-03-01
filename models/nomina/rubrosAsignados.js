
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

let simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    rubroAsignado: { type: Number, label: "Rubro asignado (id)", optional: false },
    rubro: { type: Number, label: "Rubro (id)", optional: false },
    descripcion: { type: String, label: "Descripción", optional: false },
    tipo: { type: String, label: "Tipo (asig/deduc)", optional: false },
    empleado: { type: Number, label: "Empleado", optional: false },
    suspendidoFlag: { type: Boolean, label: "Suspendido?", optional: true },
    tipoNomina: { type: String, label: "Tipo de nómina (Quinc/Mens/Vac/Esp/Util)", optional: false },
    salarioFlag: { type: Boolean, label: "Salario?", optional: true },
    desde: { type: Date, label: "Desde", optional: true },
    hasta: { type: Date, label: "Hasta", optional: true },
    siempre: { type: Boolean, label: "Siempre?", optional: true },
    periodicidad: { type: String, label: "Periodicidad (1q/2q/siempre)", optional: true },
    montoAAplicar: { type: Number, label: "Monto", optional: false },

    docState: { type: Number, optional: true },
});

RubrosAsignados = new Mongo.Collection("rubrosAsignados");
RubrosAsignados.attachSchema(simpleSchema);
