

import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';
import { Chequeras } from '/imports/collections/bancos/chequeras'; 

Meteor.publish("chequeras", function (filtro) {

    var filtro = JSON.parse(filtro);
    var selector = {};

    if (filtro._id) {
        selector._id = { $eq: filtro._id };
    }

    if (filtro.numeroCuenta) {
        selector.numeroCuenta = { $eq: filtro.numeroCuenta };
    }

    if (filtro.user) {
        selector.user = { $eq: filtro.user };
    }

    // siempre regresamos las chequeras de las compañía contab seleccionada
    let ciaContabSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
    let companiaSeleccionada = Companias.findOne(ciaContabSeleccionada ? ciaContabSeleccionada.companiaID : '-999',
                                                 { fields: { numero: 1, _id: 0, }});

    if (companiaSeleccionada) {
        // en sql, las chequeras no tienen la columna cia; sin embargo, cuando las copiamos a mongo,
        // desde copiar catálogos, agregamos la cia a cada chequera, para poder filtrar en forma
        // fácil (como hacemos abajo) ...
        selector.cia = { $eq: companiaSeleccionada.numero };
    }

    return Chequeras.find(selector);
});
