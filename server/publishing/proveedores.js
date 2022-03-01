
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Proveedores } from '/imports/collections/bancos/proveedoresClientes'; 

Meteor.publish("proveedores", function (proveedorID) {

    // con los proveedores, nos aseguramos de regresar la compañía seleccionada; es importante pues
    // casi siempre la necesitamos en páginas que corresponden a Bancos ...
    let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    // el proveedorID puede o no venir
    if (proveedorID) {
        return [
            Proveedores.find({ proveedor: proveedorID }),
            CompaniaSeleccionada.find({ userID: this.userId }),
            Companias.find(ciaContabSeleccionada.companiaID,
                           { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1, }}),
        ];
    } else {
        return [
            Proveedores.find(),
            CompaniaSeleccionada.find({ userID: this.userId }),
            Companias.find(ciaContabSeleccionada.companiaID,
                           { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1, }}),
        ];
    }
});


Meteor.publish("proveedoresLista", function () {
    return Proveedores.find({}, { fields: { proveedor: 1, nombre: 1, }});
});
