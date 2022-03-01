
Meteor.publish('movimientosBancarios', function () {

    // por ahora, regresamos todos los registros para el usuario; en un futuro, recibiremos un filtro cuando
    // otras aplicaciones usen esta tabla (collection) ...

    return [
        MovimientosBancarios.find({ user: this.userId }),
    ];
});
