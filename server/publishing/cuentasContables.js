
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';

Meteor.publish('cuentasContables', function (todasLasCiasContab) {

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let empresaUsuariaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    // solo regresamos las cuentas contables que corresponden a la compañía Contab seleccionada por el usuario ...
    if (todasLasCiasContab) {
        return [
            CuentasContables.find(),
        ];
    }
    else {
        return [
            CuentasContables.find({ cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -9999 }),
        ];
    }
})
