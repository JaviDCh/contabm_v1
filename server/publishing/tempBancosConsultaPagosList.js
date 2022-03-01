
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.bancos.consulta.pagos.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { fecha: 1, numeroPago: 1 },
        limit: cantRecords,
    };

    return Temp_Consulta_Bancos_Pagos.find(
        { user: this.userId },
        options
    );
});
