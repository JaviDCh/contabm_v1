
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.nomina.consulta.cuentasContablesEmpleadoRubro.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = { sort: { rubro: 1, cuentaContable: 1, }, limit: cantRecords, };

    return Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.find({ user: this.userId }, options);
});
