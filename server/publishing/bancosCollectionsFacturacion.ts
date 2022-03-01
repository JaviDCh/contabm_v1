

import { Companias } from '../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../imports/collections/companiaSeleccionada';
import { ParametrosBancos } from '../../imports/collections/bancos/parametrosBancos'; 
import { ParametrosGlobalBancos } from '../../imports/collections/bancos/parametrosGlobalBancos'; 

Meteor.publish("bancosCollectionsFacturacion", function () {

    // facturas puede abrirse 'desde pagos'; cuando eso ocurre, muchos collections (catálogos) no están en el
    // client, pues 'no ha dado tiempo' de que se carguen. Cuando el proceso es más normal, y el usuario llega
    // a facturas desde el menú principal, en cambio, todos los catálogos están allí ...
    // Por esa razón, tuvimos que agregar este publishing para que se usará desde facturas, aunque en la mayoría
    // de los casos (casos normales) no sea necesario usarla ...
    let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId }, { fields: { companiaID: 1, }});

    if (!ciaContabSeleccionada) {
        return this.ready();
    }

    let ciaContab = Companias.findOne(ciaContabSeleccionada.companiaID);

    if (!ciaContab) {
        return this.ready();
    }

    return [
         CompaniaSeleccionada.find({ userID: this.userId }),
         Companias.find(ciaContab._id, { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1, } }),
         ParametrosGlobalBancos.find(),
         ParametrosBancos.find({ cia: ciaContab.numero }),
    ]
});
