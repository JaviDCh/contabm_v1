

let nombreMesFiscalTablaSaldos = (mesFiscal) => {

    if (!Number.isInteger(mesFiscal)) {
        let errMessage = `Error: el valor pasado a la función 'nombreMesFiscalTablaSaldos' no es del tipo 'entero'.`;
        return { error: true, errorMessage: errorMessage };
    }

    let nombreMesFiscalAnterior = 0;
    let nombreMesFiscal = 0;

    switch (mesFiscal) {
        case 1:
            nombreMesFiscalAnterior = "Inicial";
            nombreMesFiscal = "Mes01";
            break;
        case 2:
            nombreMesFiscalAnterior = "Mes01";
            nombreMesFiscal = "Mes02";
            break;
        case 3:
            nombreMesFiscalAnterior = "Mes02";
            nombreMesFiscal = "Mes03";
            break;
        case 4:
            nombreMesFiscalAnterior = "Mes03";
            nombreMesFiscal = "Mes04";
            break;
        case 5:
            nombreMesFiscalAnterior = "Mes04";
            nombreMesFiscal = "Mes05";
            break;
        case 6:
            nombreMesFiscalAnterior = "Mes05";
            nombreMesFiscal = "Mes06";
            break;
        case 7:
            nombreMesFiscalAnterior = "Mes06";
            nombreMesFiscal = "Mes07";
            break;
        case 8:
            nombreMesFiscalAnterior = "Mes07";
            nombreMesFiscal = "Mes08";
            break;
        case 9:
            nombreMesFiscalAnterior = "Mes08";
            nombreMesFiscal = "Mes09";
            break;
        case 10:
            nombreMesFiscalAnterior = "Mes09";
            nombreMesFiscal = "Mes10";
            break;
        case 11:
            nombreMesFiscalAnterior = "Mes10";
            nombreMesFiscal = "Mes11";
            break;
        case 12:
            nombreMesFiscalAnterior = "Mes11";
            nombreMesFiscal = "Mes12";
            break;
        default:
            let errMessage = `Error: el valor pasado a la función 'nombreMesFiscalTablaSaldos' no es un valor válido (1 a 12).`;
            return { error: true, errorMessage: errorMessage };
    }

    return { error: false, nombreMesFiscalAnterior: nombreMesFiscalAnterior, nombreMesFiscal: nombreMesFiscal };
}

ContabFunctions.nombreMesFiscalTablaSaldos = nombreMesFiscalTablaSaldos;
