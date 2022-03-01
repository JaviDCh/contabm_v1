
Meteor.publish("configuracionChequeImpreso", function (ciaContab_ID) {
    // cuando el usuario abre la aplicación, enviamos (publicamos) todos los filtros que corresponden al usuario
    return ConfiguracionChequeImpreso.find({ cia: ciaContab_ID });
});
