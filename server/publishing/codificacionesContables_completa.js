

Meteor.publish("codificacionesContables_completa", function (ciaContabSeleccionada) {
    return [
             CodificacionesContables.find({ cia: ciaContabSeleccionada }),
             CodificacionesContables_codigos.find({ cia: ciaContabSeleccionada }),
             CodificacionesContables_codigos_cuentasContables.find({ cia: ciaContabSeleccionada }),
    ];
});
