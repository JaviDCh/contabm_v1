

Meteor.publish("vacacionesLista", function () {
    return Temp_Consulta_Vacaciones_Lista.find({ user: this.userId });
});
