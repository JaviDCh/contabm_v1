


import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Bancos } from '/imports/collections/bancos/bancos';

Meteor.publish(null, function () {
    // nótese como la idea es regresar aquí todos los catálogos ...
    // nota: como el nombre de método es null, los collections se regresan a
    // cada client en forma automática ...

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada = null;
    let ciaContabSeleccionada = null;

    if (this.userId) {
        ciaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });
        if (ciaSeleccionada) {
            ciaContabSeleccionada = Companias.findOne({ _id: ciaSeleccionada.companiaID });
        }
    }

    // solo regresamos las cuentas contables que corresponden a la compañía Contab seleccionada por el usuario ...
    // dejamos de regresar las cuentas contables; la razón es que son demasiadas; las persistimos al cliente con
    // una opción específica ...
    return [
             Companias.find(),
             Cargos.find(),
             Meteor.roles.find({}),
             Departamentos.find(),
             Paises.find(),
             Ciudades.find(),
             Bancos.find(),
             CompaniaSeleccionada.find({ userID: this.userId }),
             Parentescos.find(),
             TiposDeCuentaBancaria.find(),
             MaestraRubros.find(),
    ]
})
