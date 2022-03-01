

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { GruposEmpleados } from '/models/nomina/catalogos';

Meteor.publish('nomina.gruposEmpleados', function () {
    
    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    return [
        GruposEmpleados.find({ cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -999 }),
    ]
})