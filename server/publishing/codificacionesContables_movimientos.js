

Meteor.publish("codificacionesContables_consulta_codigosYMovimientos", function (codificacionContableSeleccionadaID) {

    // codificaciones contables - consulta: una vez que el usuario selecciona un codíficación para consultar,
    // regresamos sus códigos y movimientos ...

    return [
             CodificacionesContables_codigos.find({ codificacionContable_ID: codificacionContableSeleccionadaID }),
             CodificacionesContables_movimientos.find({ codificacionContable_ID: codificacionContableSeleccionadaID })
    ];
});


Meteor.publish("codificacionesContables_movimientos", function (codificacionContableSeleccionada) {
    return CodificacionesContables_movimientos.find(
        {
            codificacionContable_ID: codificacionContableSeleccionada._id,
            user: this.userId, 
        });
});
