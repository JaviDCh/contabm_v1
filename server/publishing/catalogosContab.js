
import { Monedas } from '/imports/collections/monedas.js';
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { TiposAsientoContable } from '/imports/collections/contab/tiposAsientoContable'; 
import { GruposContables } from '/imports/collections/contab/gruposContables'; 
import { MesesDelAnoFiscal } from '/imports/collections/contab/mesesAnoFiscal'; 

Meteor.publish("catalogosContab", function () {
    // estos catálogos se publican en forma automática desde 'catalogos.js'; sin embargo, cuando abrimos
    // la página que permite editar un asiento desde *otra* página y en otro Tab, ésta puede abrirse *antes*
    // que los catálogos se publiquen (con 'catalogos.js'). En estos casos, suscribimos aqui *antes*
    // de ir al state (asientosContables) y los catálogos existirán en el cliente en forma adecuada

    let ciaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    };

    // solo regresamos las cuentas contables que corresponden a la compañía Contab seleccionada por el usuario ...
    // dejamos de regresar las cuentas contables; la razón es que son demasiadas; las persistimos al cliente con
    // una opción específica ...
    return [
             Companias.find(),
             Meteor.roles.find({}),
             TiposAsientoContable.find(),
             GruposContables.find(),
             Monedas.find(),
             CompaniaSeleccionada.find({ userID: this.userId }),
             MesesDelAnoFiscal.find(),
    ]
})
