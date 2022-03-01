
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.bancos.consulta.conciliacionesBancarias.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { desde: 1, cuentaBancaria: 1 },
        limit: cantRecords,
    };

    return Temp_Bancos_ConciliacionesBancarias_Lista.find(
        { user: this.userId },
        options
    );
});
