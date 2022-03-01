
// esta función recibe un monto y lo convierte a palabras 
import lodash from 'lodash'; 
import numeral from 'numeral'; 
import writtenNumber from 'written-number'; 

function montoEscrito(monto) { 

    // writtenNumber, aunque una excelente libreria, no convierte a texto los decimales. Intentamos hacerlo nosotros ... 
    // determinamos la parte decimal del monto 
    monto = lodash.round(Math.abs(monto), 2); 
    let parteDecimal = getDecimal(monto); 

    if (parteDecimal) { 
        // si hay una parte decimal, la redondeamos a solo 2 decimales y mostramos como parte del monto en letras 
        parteDecimal = lodash.round(parteDecimal, 2); 
        monto -= parteDecimal; 

        let sparteDecimal = numeral(parteDecimal).format('0.00'); 

        sparteDecimal = sparteDecimal.replace(',', '.');        // numeral localiza el formato (0.3 --> '0,3')
        sparteDecimal = sparteDecimal.replace('0.', ''); 

        let texto = writtenNumber(monto, { lang: 'es' }); 

        // ahora existe una deficiencia con esta librería cuando se usa en spanish: *un millón* es correcto; pero 
        // *dos cientos un* no lo es. Nótese como intentamos corregir ésto: 
        texto = replaceAllInstances(texto, "un ", "***");           
        texto = texto.replace("un", "uno"); 
        texto = replaceAllInstances(texto, "***", "un "); 

        return `${texto} con ${sparteDecimal} céntimos`; 
    } else { 
        let texto =  writtenNumber(monto, { lang: 'es' }); 

        texto = replaceAllInstances(texto, "un ", "***");           
        texto = texto.replace("un", "uno"); 
        texto = replaceAllInstances(texto, "***", "un "); 

        return texto; 
    }
    
}

export { montoEscrito }; 

function getDecimal(n) {
	return (n - Math.floor(n));
}

function replaceAllInstances(str, oldString, newString) { 
    // use lodash to escape regExp special characters; ex: *, ... 
    let regex = new RegExp(lodash.escapeRegExp(oldString), 'g');
    return str.replace(regex, newString);     
}