

import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from '/imports/collections/bancos/conciliacionesBancarias'; 

Meteor.methods(
{
    "bancos.conciliacionesBancarias.save": function (item) {

        check(item, Object);

        // para regresar el _id; sobre todo del item recién agregado ...
        let itemID = "-999";

        if (item.docState && item.docState == 1) {
            delete item.docState;
            itemID = ConciliacionesBancarias.insert(item);
        }


        if (item.docState && item.docState == 2) {
            delete item.docState;
            ConciliacionesBancarias.update({ _id: item._id }, { $set: item });
            itemID = item._id;
        }


        if (item.docState && item.docState == 3) {
            ConciliacionesBancarias_movimientosBanco.remove({ conciliacionID: item._id });
            ConciliacionesBancarias_movimientosPropios.remove({ conciliacionID: item._id });
            ConciliacionesBancarias_movimientosCuentaContable.remove({ conciliacionID: item._id });

            ConciliacionesBancarias.remove({ _id: item._id });
        }

        return {
            message: `Ok, los datos han sido actualizados en la base de datos.`,
            id: itemID,
        };
    }
});
