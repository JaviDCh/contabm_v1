
import moment from 'moment';

let determinarMesFiscal = (fecha, ciaContab) => {

    let errorMessage = "";

    // ----------------------------------------------------------------------------------------------
    // determinamos el mes y año fiscal en base al mes y año calendario del asiento
    let mesCalendario = fecha.getMonth() + 1;
    let anoCalendario = fecha.getFullYear();

    let response = null;
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll({
            where: { mesCalendario: mesCalendario, cia: ciaContab },
        })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
        
    if (response.result.count == 0) {
        errMessage = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
            el mes que corresponde a la fecha del asiento (${moment(fecha).format('DD-MM-YYYY')}).<br />
            Por favor revise y corrija esta situación.`;

        return { error: true, errorMessage: errorMessage };
    }

    let mesAnoFiscal = response.result.rows[0].dataValues;

    let mesFiscal = mesAnoFiscal.mesFiscal;
    let anoFiscal = anoCalendario;

    if (mesAnoFiscal.ano == 1) { 
        anoFiscal--;
    }

    return { error: false, mesFiscal: mesFiscal, anoFiscal: anoFiscal };
}

ContabFunctions.determinarMesFiscal = determinarMesFiscal;
