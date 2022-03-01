


import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Bancos_CajaChica } from '../../imports/collections/bancos/temp.bancos.consulta.cajaChica'; 

Meteor.publish("temp.bancos.consulta.cajaChica.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { reposicion: 1 },
        limit: cantRecords,
    };

    return Temp_Consulta_Bancos_CajaChica.find({ user: this.userId }, options);
})