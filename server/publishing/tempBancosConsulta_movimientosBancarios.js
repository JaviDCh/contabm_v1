
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.Bancos.Consulta.movimientosBancarios", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number }
      }).validate({ cantRecords });

    const options = {
        sort: { fecha: 1, transaccion: 1 },
        limit: cantRecords,
    };

    return Temp_Consulta_Bancos_MovimientosBancarios.find(
        { user: this.userId },
        options
    );
});
