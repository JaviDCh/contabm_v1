
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.bancos.consulta.cuentasContablesDefinicion.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = { sort: { rubro: 1, cuentaContable: 1, }, limit: cantRecords, };

    return Temp_Consulta_Bancos_CuentasContables_Definicion.find({ user: this.userId }, options);
});
