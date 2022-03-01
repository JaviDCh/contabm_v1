

import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

Meteor.publish('analisisContable', function (noRegresarCuentasContables) {

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let empresaUsuariaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada)
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
    };

    var user = Meteor.users.findOne({ _id: this.userId });

    if (!user)
        return [];

    // para registrar las ocmpañías permitidas para el usuario ... 
    let ciasPermitidas = [];
    let analisisContableID_Array = [];

    if (_.isArray(user.companiasPermitidas)) {
        user.companiasPermitidas.forEach((cia) => { ciasPermitidas.push(cia); });
        // ahora construimos un array con los _ids de los analisis contables que vamos a regresar, para leer *solo* las cuentas contables
        // que corresponden a éstos ...
        AnalisisContable.find({ cia: { $in: ciasPermitidas } }).forEach((a) => { analisisContableID_Array.push(a._id); });
    };



    if (ciasPermitidas.length)
        // solo regresamos análisis contables que corresponden a las compañías permitidas para el usuario
        // además, solo las cuentas contables que corresponden a éstos ...
        if (noRegresarCuentasContables)
            return [
                AnalisisContable.find({ cia: { $in: ciasPermitidas } }),
            ];
        else
            return [
                AnalisisContable.find({ cia: { $in: ciasPermitidas } }),
                AnalisisContableCuentasContables.find({ analisisContableID: { $in: analisisContableID_Array } }),
            ];
    else
        // el usuario no tiene compañías permitidas; regresamos analisis contables para todas ...
        if (noRegresarCuentasContables)
            return [
                AnalisisContable.find(),
            ];
        else
            return [
                AnalisisContable.find(),
                AnalisisContableCuentasContables.find(),
            ];
});
