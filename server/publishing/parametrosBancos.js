

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { ParametrosBancos } from '/imports/collections/bancos/parametrosBancos'; 
import { ParametrosGlobalBancos } from '/imports/collections/bancos/parametrosGlobalBancos'; 

Meteor.publish('parametrosBancos', function () {

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let empresaUsuariaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada)
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
    };

    return [
        ParametrosBancos.find({ cia: ciaContabSeleccionada && ciaContabSeleccionada.numero ? ciaContabSeleccionada.numero : -9999 }),
    ];
});


Meteor.publish('parametrosGlobalBancos', function () {

    return [
        ParametrosGlobalBancos.find(),
    ];
});
