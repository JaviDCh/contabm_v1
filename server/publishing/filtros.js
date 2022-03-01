
import { Filtros } from '/imports/collections/general/filtros'; 

Meteor.publish(null, function () {
    // cuando el usuario abre la aplicación, enviamos (publicamos) todos los filtros que corresponden al usuario
    return Filtros.find({ userId: this.userId });
});
