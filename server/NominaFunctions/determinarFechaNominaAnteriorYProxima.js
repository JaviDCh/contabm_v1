

import moment from 'moment'; 

let determinarFechaProximaNomina = function (tipoNomina, fecha) {
    // esta función recibe una fecha y determina la fecha de la próxima nómina; nota: la función debe saber
    // el tipo de nómina (mensual/quincenal) para determinar ésto ...

    let fechaProxNomina = new Date();
    let errorMessage = "";

    if (tipoNomina != 1 && tipoNomina != 2) {
        errorMessage = `El tipo de nómina debe ser: 1 (quincenal) o 2 (mensual) para que la fecha de la
                        próxima nómina pueda ser determinada por esta función.`;
        return {
            error: true,
            errMessage: errorMessage
        };
    };


    switch (tipoNomina)
    {
        case 2:                 // mensual
            {
                // fin del mes
                const finDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

                if (fecha == finDelMes) {
                    // nómina mensual y la fecha es el fin de un mes; la fecha de la próx nómina es,
                    // simplemente, el fin del próximo mes ...
                    fechaProxNomina = moment(new Date(fecha.getFullYear(),
                                                      fecha.getMonth(), 1)).
                                                      add(2, 'months').
                                                      subtract(1, 'days').toDate();
                    }
                else {
                    // nómina mensual y la fecha no es un fin de mes; la fecha de la próx nómina es,
                    // simplemente, el fin de ese mes ...
                    fechaProxNomina = finDelMes;
                    }

                break;
            }
        case 1:                 // quincenal
            {
                if (fecha.Day < 15)
                    // nómina quincenal y fecha antes del 15; la fecha de la próx nómina es, simplemente, el próx 15 del mismo mes
                    fechaProxNomina = new DateTime(fecha.getFullYear(), fecha.getMonth(), 15);
                else
                {
                    // fin del mes
                    const finDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

                    if (fecha == finDelMes)
                        // nómina quincenal y la fecha es el fin de un mes; la fecha de la próx nómina es, simplemente, el 15 del próximo mes ...
                        fechaProxNomina = moment(finDelMes).add(15, 'days').toDate();
                    else
                        // nómina quincenal y la fecha está en la 2da. quincena pero no fin de mes;
                        // la fecha de la próx nómina es el fin del mes
                        fechaProxNomina = finDelMes;
                }

                break;
            }
    }


    return {
        error: false,
        fechaProxNomina: fechaProxNomina
    };
};


let determinarFechaNominaAnterior = function (tipoNomina, fecha)
{
    // esta función recibe una fecha y determinar la fecha de la próxima nómina; nota: la función debe saber
    // el tipo de nómina (mensual/quincenal) para determinar ésto ...

    // al menos por ahora, como esta función se usa para determinar la cantidad de días de adelanto que se deben descontar en
    // la próxima nómina a las vacaciones, vamos a regresar la misma fecha cuando la fecha es una nómina exacta; por ejemplo,
    // cuando, para nóminas quincenales, la fecha es 15 o fin de mes (31/7 o 30/6, ...)

    let fechaNominaAnterior = new Date();
    let errorMessage = "";

    if (tipoNomina != 1 && tipoNomina != 2) {
        errorMessage = `El tipo de nómina debe ser: 1 (quincenal) o 2 (mensual) para que la fecha de la
                        próxima nómina pueda ser determinada por esta función.`;
        return {
            error: true,
            errMessage: errorMessage
        };
    };

    switch (tipoNomina)
    {
        case 2:                 // mensual
            {
                // fin del mes
                const finDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

                if (fecha == finDelMes) {
                    fechaNominaAnterior = finDelMes;
                }
                else {
                    // para nóminas mensuales, la nómina anterior es simpre el fin del mes anterior ...
                    fechaNominaAnterior = moment(finDelMes).subtract(1, 'months').toDate();
                };

                break;
            }
        case 1:                 // quincenal
            {
                const finDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

                if (fecha == finDelMes) {
                    fechaNominaAnterior = finDelMes;
                    break;
                };

                if (fecha.Day == 15) {
                    fechaNominaAnterior = fecha;
                    break;
                };

                if (fecha.Day < 15) {
                    // nómina quincenal y fecha antes del 15; la fecha de la nómina anterior es, simplemente, el fin del mes anterior
                    fechaNominaAnterior = moment(finDelMes).subtract(1, 'months').toDate();
                }
                else {
                    // nómina quincenal y la fecha está en la 2da. quincena; la fecha es siempre el 15 del mes ...
                    fechaNominaAnterior = new Date(fecha.getFullYear(), fecha.getMonth(), 15);
                };

                break;
            };
    }

    return {
        error: false,
        fechaNominaAnterior: fechaNominaAnterior
    };
};

NominaFunctions.determinarFechaProximaNomina = determinarFechaProximaNomina;
NominaFunctions.determinarFechaNominaAnterior = determinarFechaNominaAnterior;
