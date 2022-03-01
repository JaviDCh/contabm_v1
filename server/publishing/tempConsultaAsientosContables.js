

Meteor.publish("tempConsulta_asientosContables", function () {

    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    return Temp_Consulta_AsientosContables.find({ user: this.userId });
});
