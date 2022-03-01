

Meteor.publish("tempConsultaAsientosContables2", function () {
    // este collection es usado para consultas en el client. Agregamos registros aquí para el usuario que
    // ejecuta la consulta; luego regresamos el collection al usuario, leemos en el cliente y producimos
    // la consulta ... 
    return Temp_Consulta_AsientosContables2.find({ user: this.userId });
});
