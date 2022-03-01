

Meteor.publish("codificacionesContables", function (ciaContabSeleccionada) {
    return [
             CodificacionesContables.find({ cia: ciaContabSeleccionada })
    ];
});
