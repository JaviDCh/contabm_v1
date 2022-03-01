

Meteor.publish("tempConsulta_cuentasContablesYSusMovimientos", function () {

    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario
    // TODO: vamos a implementar aqui un mecanismo para que la publicación sea progresiva
    // ('más items ...'  -  'todos los items ...')
    return [
        Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }),
        Temp_Consulta_Contab_CuentasYSusMovimientos2.find({ user: this.userId }), 
    ];
});
