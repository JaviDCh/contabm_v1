
import SimpleSchema from 'simpl-schema';

Meteor.methods(
{
    corregirChequera: function (numeroChequera) {

        // este método ejecuta la función 'actualizarChequera', la cual lee una chequera y actualiza sus
        // valores: cantidad de cheques usados, agotada, etc.
        new SimpleSchema({
            numeroChequera: { type: SimpleSchema.Integer, optional: false, },
        }).validate({ numeroChequera, });


        let actualizarChequera = BancosFunctions.actualizarChequera(numeroChequera);
        if (actualizarChequera.error) {
            return { error: true, message: actualizarChequera.errMessage };
        }
        // ---------------------------------------------------------------------------------------------

        return {
            message: actualizarChequera.message
        };
    }
});
