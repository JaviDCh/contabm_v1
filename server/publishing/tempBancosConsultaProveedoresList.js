
import SimpleSchema from 'simpl-schema';

Meteor.publish("temp.bancos.consulta.proveedores.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente,
    // los items que coresponden al usuario
    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = { sort: { nombre: 1, }, limit: cantRecords, };

    return Temp_Consulta_Bancos_Proveedores.find({ user: this.userId }, options);
});
