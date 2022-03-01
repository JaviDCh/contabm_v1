
Meteor.publish('contab.filtrosConsultaContab', function (ciaContabSeleccionadaID) {
    // estos son los filtros que se pueden definir para 'delimitar' las consultas que pueden hacer los usuarios en
    // contab; normalmente, la idea es restringir las cuentas contables que puede ver un usuario; por ejemplo, solo
    // las 201* ...
    // En filtrosConsultasContab se registran los filtros que se deben aplicar a cada usuario ...
    return FiltrosConsultasContab.find({ cia: ciaContabSeleccionadaID });
});
