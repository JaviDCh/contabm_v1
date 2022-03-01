


let validarMesCerradoEnBancos = (fecha, ciaContab) => {

    let errMessage = "";

    // ----------------------------------------------------------------------------------------------
    // determinamos el mes y año fiscal en base al mes y año calendario del asiento
    let mesCalendario = fecha.getMonth() + 1;
    let anoCalendario = fecha.getFullYear();

    // ------------------------------------------------------------------------------------
    // leemos el mes cerrado para la cia del asiento (nota importante: el último mes cerrado corresponde a
    // mes y año *fiscal* y no calendario)
    response = Async.runSync(function(done) {
        UltimoMesCerradoBancos_sql.findAll({ where: { cia: ciaContab }, raw: true })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (!response.result.length) {
        errMessage = `Error: no hemos encontrado un registro en la tabla <em>Ultimo Mes Cerrado</em> en <em>Bancos</em>
            "que corresponda a la cia Contab indicada.<br />
            "Por favor revise y corrija esta situación.`;

        return { error: true, errMessage: errMessage };
    };

    let ultimoMesCerrado = response.result[0];

    let mesCerrado_bancos = ultimoMesCerrado.mes;
    let anoCerrado_bancos = ultimoMesCerrado.ano;

    if ((anoCalendario < anoCerrado_bancos) ||
        (anoCalendario == anoCerrado_bancos &&
         mesCalendario <= mesCerrado_bancos)) {
        errMessage = `Error: la fecha que se desea editar o registrar, corresponde a un mes ya cerrado en <em>Bancos</em>.<br />
            Ud. no puede alterar un mes ya cerrado en <em>Bancos</em>.`;

        return { error: true, errMessage: errMessage };
    };

    return { error: false };
};

BancosFunctions.validarMesCerradoEnBancos = validarMesCerradoEnBancos;
