
Meteor.methods(
{
    'contab.asientos.leerFactorCambioMasReciente': function (fecha) {
        check(fecha, Date);
        let factorCambio = ContabFunctions.leerCambioMonedaMasReciente(fecha);
        return factorCambio;
    }
})
