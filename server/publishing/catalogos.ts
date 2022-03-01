
import { Monedas } from '../../imports/collections/monedas';
import { Companias } from '../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../imports/collections/companiaSeleccionada';
import { GruposEmpleados } from '../../models/nomina/catalogos';
import { Empleados } from '../../models/nomina/empleados'; 
import { TiposAsientoContable } from '../../imports/collections/contab/tiposAsientoContable'; 
import { Bancos } from 'imports/collections/bancos/bancos';
import { ParametrosBancos } from '../../imports/collections/bancos/parametrosBancos'; 
import { ParametrosGlobalBancos } from '../../imports/collections/bancos/parametrosGlobalBancos'; 
import { GruposContables } from '../../imports/collections/contab/gruposContables'; 
import { MesesDelAnoFiscal } from '../../imports/collections/contab/mesesAnoFiscal'; 

Meteor.publish(null, function () {
    // nótese como la idea es regresar aquí todos los catálogos ...
    // nota: como el nombre de método es null, los collections se regresan a
    // cada client en forma automática ...

    // determinamos la compañía seleccionada, pues algunos catálogos que se publiquen deben corresponder a ésta ...
    let ciaSeleccionada = { companiaID: 0 as number };
    let ciaContabSeleccionada = {}; 

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
             Meteor.roles.find(),
             TiposAsientoContable.find(),
             GruposContables.find(),
             Monedas.find(),
             Bancos.find(),
             CompaniaSeleccionada.find({ userID: this.userId }),
             ParametrosBancos.find(),
             ParametrosGlobalBancos.find(),
             MesesDelAnoFiscal.find(),
             Empleados.find(),
             GruposEmpleados.find(),
    ]
})
