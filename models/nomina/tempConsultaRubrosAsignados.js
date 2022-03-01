
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

validarPeriodo = function() {
    let siempre = this.isSet ? this.value : false;
    let desde = this.field("desde").value;
    let hasta = this.field("hasta").value;

    if (siempre && (desde || hasta)) {
        return `Error: Ud. debe indicar un período de aplicación o marcar <em>Siempre</em>; no ambos.`;
    }

    if (!siempre && (!desde || !hasta)) {
        return `Error: Ud. debe indicar un período de aplicación o marcar <em>Siempre</em>.`;
    }

    return true;
}

validarTipoNomina = function() {
    // aunque normal no está permitido, muchos registros que ya existen lo usan ...
    let pattern = new RegExp("[QMVEU]");

    if (this.isSet && this.value) {
        let value = this.value;
        if (!pattern.test(value)) {
            return `Error: el valor indicado para el <em>tipo de nómina</em> debe ser siempre una combinación
                    de las siguientes letras:
                    Q (quincenal), M (mensual), V (vacaciones), E (especial), U (utilidades).<br />
                    Ejemplos: QM, QMV, VQM, UE, EU, etc. `;
        }
    }

    return true;
}

// ------------------------------------------------------------------------------------------------------------
// nótese que la siguiente tabla es muy similar a la anterior, pero incluye el usuario Meteor. La idea es que
// los rubros asignados, al menos por ahora, no existen en mongo, solo en sql server. Al consultar, los
// registramos en mongo pero por usuario ...
let simpleSchema = new SimpleSchema({
    _id: { type: String, optional: false },

    rubroAsignado: { type: Number, label: "Rubro asignado (id)", optional: false, },
    rubro: { type: Number, label: "Rubro (id)", optional: false, },
    descripcion: { type: String, label: "Descripción", optional: false, },
    tipo: { type: String, label: "Tipo (asig/deduc)", optional: false, },
    empleado: { type: Number, label: "Empleado", optional: false, },
    suspendidoFlag: { type: Boolean, label: "Suspendido?", optional: true, },
    tipoNomina: { type: String, label: "Tipo de nómina (Quinc/Mens/Vac/Esp/Util)", optional: false, custom: validarTipoNomina, },
    salarioFlag: { type: Boolean, label: "Salario?", optional: true, },
    desde: { type: Date, label: "Desde", optional: true, },
    hasta: { type: Date, label: "Hasta", optional: true, },
    siempre: { type: Boolean, label: "Siempre?", optional: true, custom: validarPeriodo, },
    periodicidad: { type: String, label: "Periodicidad (1q/2q/siempre)", optional: true, },
    montoAAplicar: { type: Number, label: "Monto", optional: false, },

    user: { type: String, label: 'Mongo user', optional: false, },
    docState: { type: Number, optional: true, }
});

Temp_Consulta_Nomina_RubrosAsignados = new Mongo.Collection("temp_consulta_nomina_rubrosAsignados");
Temp_Consulta_Nomina_RubrosAsignados.attachSchema(simpleSchema);
