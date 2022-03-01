

import * as lodash from 'lodash';
import * as numeral from 'numeral';
import { Decimal } from "decimal.js"
import { vacacPorAnoGenericas_schema } from '../../../../imports/collections/nomina/parametros.nomina.cantidadDiasVacacionesPorAno';

export let cuadrarAsientoContable = function (partidas, partidaSeleccionada) {

    // recorremos las partidas del asiento y 'cuadramos' en la partida que el usuario ha seleccionado ...

    // primero recorremos las partidas y redondeamos a 2 decimales; si existe algún monto con más de dos decimales,
    // al redondear, el resultado final será siempre de dos decimales
    Decimal.set({ rounding: Decimal.ROUND_CEIL }); 

    partidas.forEach((partida) => {
        let debe = new Decimal(partida.debe ? partida.debe : 0); 
        let haber = new Decimal(partida.haber ? partida.haber : 0); 
        partida.debe = debe.toDecimalPlaces(2).toNumber();  
        partida.haber = haber.toDecimalPlaces(2).toNumber();  
    })


    // ya nos aseguramos que las partidas no tienen, ninguna, más de 2 decimales; ahora continuamos y cuadramos
    // contra la partida seleccionada ...
    let sumOfDebe = new Decimal(0);
    let sumOfHaber = new Decimal(0);


    partidas.forEach((partida) => {
        if (partida._id && partidaSeleccionada._id && (partida._id != partidaSeleccionada._id)) {
            // evitamos la partida seleccionada ... 
            sumOfDebe = sumOfDebe.plus(partida.debe ? partida.debe : 0); 
            sumOfHaber = sumOfHaber.plus(partida.haber ? partida.haber : 0); 
        }
    })

    partidaSeleccionada.debe = 0;
    partidaSeleccionada.haber = 0;

    // finalmente, cuadramos 'contra' la partida seleccionada ... 
    if (sumOfDebe.greaterThanOrEqualTo(sumOfHaber)) {
        partidaSeleccionada.haber = sumOfDebe.minus(sumOfHaber).toNumber(); 
    }
    else {
        partidaSeleccionada.debe = sumOfHaber.minus(sumOfDebe).toNumber();  
    }

    if (!partidaSeleccionada.docState) { 
        partidaSeleccionada.docState = 2; 
    }

    // sumarizamos una vez más para mostrar el total al usuario ... 
    sumOfDebe = new Decimal(0);
    sumOfHaber = new Decimal(0);

    for (let partida of partidas) { 
        sumOfDebe = sumOfDebe.plus(partida.debe); 
        sumOfHaber = sumOfHaber.plus(partida.haber); 
    }

    let message = `Ok, el asiento contable ha sido cuadrado. Las sumatoria de los montos de sus partidas suman ahora cero.<br />
                   Además <b>ningún</b> monto debe tener ahora más de dos decimales. <br /> 
                   Las sumas del debe y el haber son ahora: <b>${numeral(sumOfDebe.toNumber()).format("0,0.000000")}</b> - 
                   <b>${numeral(sumOfHaber.toNumber()).format("0,0.000000")}</b>.`
    
    // para eliminar '//' que typescript (???) agrega al string (cuando existen caracteres especiales, como new line) ... 
    message = message.replace(/\/\//gi, "");

    return {
        error: false,
        message: message, 
    }

}


export let revisarSumasIguales = function(partidas) { 

    Decimal.set({ rounding: Decimal.ROUND_UP }); 

    if (Array.isArray(partidas) && partidas.length > 0) { 
        // la idea es notificar al usuario si el asiento está descuadrado, aunque, la verdad, permitimos grabarlo así ... 
        let sumOfDebe = new Decimal(0);
        let sumOfHaber = new Decimal(0);

        for (let partida of partidas) { 
            sumOfDebe = sumOfDebe.plus(partida.debe); 
            sumOfHaber = sumOfHaber.plus(partida.haber); 
        }

        if (!sumOfDebe.equals(sumOfHaber)) { 
            return { 
                error: true, 
                message: `El asiento contable <b>no</b> está cuadrado. La suma de su debe y haber no es cero.<br />
                          Recuerde que un asiento contable puede ser grabado a la base de datos aunque <b>sus sumas no sumen cero</b>. <br /><br />
                          Las sumas del debe y el haber son: <b>${numeral(sumOfDebe.toNumber()).format("0,0.000000")}</b> - <b>${numeral(sumOfHaber.toNumber()).format("0,0.000000")}</b>.`
            }
        } else { 
            return { 
                error: false, 
            }
        }
    } else { 
        return { 
            error: false, 
        }
    }
}

