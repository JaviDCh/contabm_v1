

Meteor.methods(
{
    vacacionesSave: function (item) {

        check(item, Object);

        let itemID = "-999";

        if (item.docState && item.docState == 1) {
            delete item.docState;

            // cada vez que agregamos una nómina de vacaciones, debemos asignar un valor al item
            // claveUnicaContab. Este valor es usado para relacionar la vacación al proceso de nómina.
            // cuando el usuario ejecute el proceso de nómina para esta vacación en particular, la nómina
            // buscará la vacación por este número ...

            let claveUnicaContab_ultima = Vacaciones.findOne({ cia: item.cia },
                                                             { sort: { claveUnicaContab: -1 },
                                                               fields: { claveUnicaContab: 1 }});

            if (claveUnicaContab_ultima) {
                item.claveUnicaContab = claveUnicaContab_ultima.claveUnicaContab + 1;
            }
            else {
                item.claveUnicaContab = 1;
            };

            itemID = Vacaciones.insert(item);
        };


        if (item.docState && item.docState == 2) {
            delete item.docState;
            Vacaciones.update({ _id: item._id }, { $set: item });
            itemID = item._id;
        };


        if (item.docState && item.docState == 3) {
            Vacaciones.remove({ _id: item._id });
        };

        return {
            message: `Ok, los datos han sido actualizados en la base de datos.`,
            id: itemID
        };
    }
});
