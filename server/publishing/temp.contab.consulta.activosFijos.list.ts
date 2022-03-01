

import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Contab_ActivosFijos } from '../../imports/collections/contab/temp.contab.consulta.activosFijos'; 

Meteor.publish("temp.contab.consulta.activosFijos.list", function (cantRecords) {
    // nótese como en estos casos de consultas, siempre regresamos, simplemente, los items que coresponden al usuario

    new SimpleSchema({
        cantRecords: { type: Number, optional: false, }
      }).validate({ cantRecords });

    const options = {
        sort: { claveUnica: 1 },
        limit: cantRecords,
    };

    return Temp_Consulta_Contab_ActivosFijos.find({ user: this.userId }, options);
})