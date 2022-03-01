
import lodash from 'lodash';

import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

import { Companias } from '/imports/collections/companias';

validarCuenta = function() {
    if (this.isSet && this.value) {
        let intValue = parseInt(this.value);
        if (!lodash.isInteger(intValue)) {
            return "Error: la cuenta contable debe siempre ser un valor numérico.";
        };
    };

    // validamos aquí que:
    // 1) una cuenta de tipo detalle tenga más de 1 nivel
    // 2) una cuenta de total tenga un max de 6 niveles

    let tipoCuenta = this.field("totDet");
    if (tipoCuenta.isSet) {
        let cantNiveles = this.field("numNiveles").isSet ? this.field("numNiveles").value : null;
        switch (tipoCuenta.value) {
            case "T":
                if (cantNiveles && cantNiveles > 6) {
                    return `Error: una cuenta de tipo total (${this.value}) no debe tener más de seis niveles.`;
                };
                break;
            case "D":
                if (cantNiveles && cantNiveles < 2) {
                    return `Error: una cuenta de tipo detalle (${this.value}) no debe tener menos de dos niveles.`;
                };
                break;
        };
    };

    return true;
};

// CuentasContables = new Mongo.Collection("cuentasContables");
CuentasContables = new Mongo.Collection('cuentasContables');

if (Meteor.isServer) {
    // indicamos a mongo que queremos un índice ..
    CuentasContables._ensureIndex({ id: 1 });
}

let schema = new SimpleSchema({
    _id: { type: String, optional: false },
    id: { type: Number, label: "ID", optional: false },
    cuenta: { type: String, label: "Cuenta contable", optional: false, min: 1, max: 25, custom: validarCuenta, },
    descripcion: { type: String, label: "Descripción", optional: false, min: 1, max: 40, },

    nivel1: { type: String, label: "Nivel1", optional: false, min: 1, max: 5, },
    nivel2: { type: String, label: "Nivel2", optional: true, max: 5, },
    nivel3: { type: String, label: "Nivel3", optional: true, max: 5, },
    nivel4: { type: String, label: "Nivel4", optional: true, max: 5, },
    nivel5: { type: String, label: "Nivel5", optional: true, max: 5, },
    nivel6: { type: String, label: "Nivel6", optional: true, max: 5, },
    nivel7: { type: String, label: "Nivel7", optional: true, max: 5 ,},

    numNiveles: { type: Number, label: "Cant de niveles", optional: false, min: 1, max: 7, },
    totDet: { type: String, label: "Tipo (total/detalle)", optional: false, min: 1, max: 1, },
    actSusp: { type: String, label: "Activa/Suspendida", optional: false, min: 1, max: 1,  },
    cuentaEditada: { type: String, label: "Cuenta editada", optional: false, min: 1, max: 30,  },
    grupo: { type: Number, label: "Grupo", optional: false },
    cia: { type: Number, label: "Cia contab", optional: false },
    docState: { type: Number, optional: true },
    existeEnOrigen: { type: Boolean, optional: true },      // cuando el usuario elmina un registro en sql server, lo eliminamos en mongo ...
});


CuentasContables.attachSchema(schema);
