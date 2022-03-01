

Meteor.methods(
{
    validarMesAnteriorCerradoEnContab: function (fecha, ciaContab) {

        check(fecha, Date);
        check(ciaContab, Match.Integer);

        // este método revisa si el mes fiscal anterior a la fecha indicada está cerrado en contab. Muchos procesos, sobre
        // todo consultas deben saber si el mes fiscal anterior está cerrado o no; los saldos anteriores mostrados podrían
        // ser inexactos si el mes fiscal anterior no está cerrado ...

        // TODO: determinar mes fiscal a la fecha indicada
        let determinarMesFiscal = ContabFunctions.determinarMesFiscal(fecha, ciaContab);

        if (determinarMesFiscal.error)
            return { error: true, errMessage: determinarMesFiscal.errMessage };


        let mesFiscal = determinarMesFiscal.mesFiscal;
        let anoFiscal = determinarMesFiscal.anoFiscal;




        // --------------------------------------------------------------------------------------------------------------
        // leemos último mes cerrado en Contab
        let response = Async.runSync(function(done) {
            UltimoMesCerradoContab_sql.findAll({ where: { cia: ciaContab }, raw: true })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!response.result.length) {
            errMessage = `Error: no hemos encontrado un registro en la tabla <em>Ultimo Mes Cerrado</em> en Contab
                "que corresponda a la cia Contab indicada.<br />
                "Por favor revise y corrija esta situación.`;

            return { error: true, errMessage: errMessage };
        };

        let ultimoMesCerrado = response.result[0];

        let mesCerradoContab_Fiscal = ultimoMesCerrado.mes;
        let anoCerradoContab_Fiscal = ultimoMesCerrado.ano;


        // --------------------------------------------------------------------------------------------------------------
        // ahora aprovechamos para leer el nombre del mes fiscal en la tabla MesesDelAnoFiscal
        response = null;
        response = Async.runSync(function(done) {
            MesesDelAnoFiscal_sql.findAndCountAll({
                where: { mesFiscal: mesCerradoContab_Fiscal, cia: ciaContab },
            })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.count == 0) {
            errMessage = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
                el mes que corresponde a la fecha (${moment(fecha).format('DD-MM-YYYY')}).<br />
                Por favor revise y corrija esta situación.`;

            return { error: true, errMessage: errMessage };
        };

        let mesesDelAnoFiscal = response.result.rows[0].dataValues;
        // --------------------------------------------------------------------------------------------------------------



        // TODO: determinar si el mes fiscal está cerrado (return true) o no (return false)
        if (anoFiscal > anoCerradoContab_Fiscal)
            return { error: false,
                     mesFiscalAnteriorCerrado: false,
                     mensaje: `El mes anterior al mes indicado a este proceso <b>no está cerrado</b>.<br />
                               El último mes (fiscal) cerrado para la compañía seleccionada es:
                               ${mesCerradoContab_Fiscal.toString() + "/" + anoCerradoContab_Fiscal.toString()}
                               (${mesesDelAnoFiscal.nombreMes}).<br /><br />
                               Esto podría significar que los saldos iniciales mostrados por este porceso no sean correctos.
                               ` ,
                       mesFiscalCerrado: mesCerradoContab_Fiscal,
                       anoFiscalCerrado: anoCerradoContab_Fiscal,
                       nombreMes: mesesDelAnoFiscal.nombreMes };

         if (anoFiscal == anoCerradoContab_Fiscal && (mesFiscal > mesCerradoContab_Fiscal + 1) )
             return { error: false,
                      mesFiscalAnteriorCerrado: false,
                      mensaje: `El mes anterior al mes indicado a este proceso <b>no está cerrado</b>.<br />
                                El último mes (fiscal) cerrado para la compañía seleccionada es:
                                ${mesCerradoContab_Fiscal.toString() + "/" + anoCerradoContab_Fiscal.toString()}
                                (${mesesDelAnoFiscal.nombreMes}).<br /><br />
                                Esto podría significar que los saldos iniciales mostrados por este porceso no sean correctos.
                               ` ,
                       mesFiscalCerrado: mesCerradoContab_Fiscal,
                       anoFiscalCerrado: anoCerradoContab_Fiscal,
                       nombreMes: mesesDelAnoFiscal.nombreMes };

        return { error: false,
                mesFiscalAnteriorCerrado: true,
                mensaje: `Ok, el mes anterior al mes indicado a este proceso está cerrado.<br />
                          El último mes (fiscal) cerrado para la compañía seleccionada es:
                          ${mesCerradoContab_Fiscal.toString() + "/" + anoCerradoContab_Fiscal.toString()}
                          (${mesesDelAnoFiscal.nombreMes}).
                          `,
                  mesFiscalCerrado: mesCerradoContab_Fiscal,
                  anoFiscalCerrado: anoCerradoContab_Fiscal,
                  nombreMes: mesesDelAnoFiscal.nombreMes };

    }
});
