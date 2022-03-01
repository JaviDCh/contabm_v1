

Meteor.publish("tempConsulta_empleados", function () {

    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    return Temp_Consulta_Empleados.find({ user: this.userId });
});
