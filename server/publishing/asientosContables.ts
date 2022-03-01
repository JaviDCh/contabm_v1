

import { AsientosContables } from '../../imports/collections/contab/asientosContables'; 

Meteor.publish("asientosContables", function (filtro) {

    filtro = JSON.parse(filtro);
    let selector = {} as any;

    if (filtro._id) {
        selector._id = { $eq: filtro._id };
    }

    if (filtro.numeroAutomatico) {
        selector.numeroAutomatico = { $eq: filtro.numeroAutomatico };
    }

    if (filtro.lote) {
        let search = new RegExp(filtro.lote, 'i');
        selector.lote = search;
    }

    if (filtro.user) {
        selector.user = { $eq: filtro.user };
    }

    if (filtro.cia) { 
        selector.cia = { $eq: filtro.cia };
    }
        
    return AsientosContables.find(selector);
});
