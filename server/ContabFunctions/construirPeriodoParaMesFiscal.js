

let construirPeriodoParaMesFiscal = function(mesFiscal, anoFiscal, ciaContab) {
    // determinamos el período del mes para un mes fiscal dado. Ejemplo, si la compañía cierra su año fiscal en
    // Enero, el período para el mes fiscal 12/2015 es: 1-1-16 al 31-1-16.

      let errMessage = "";

      let response = null;
      response = Async.runSync(function(done) {
          MesesDelAnoFiscal_sql.findAll({
              where: { mesFiscal: mesFiscal, cia: ciaContab },
              raw: true,
          })
              .then(function(result) { done(null, result); })
              .catch(function (err) { done(err, null); })
              .done();
      });

      if (response.error)
          throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

      if (!response.result.length) {
          errMessage = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en <em>Contab</em>, para
              el mes fiscal (${mesFiscal.toString()}) y la compañía <em>Contab</em> seleccionada.`;

          return { error: true, errorMessage: errorMessage };
      };

      let mesAnoFiscal = response.result[0];

      let mesCalendario = mesAnoFiscal.mesCalendario;
      let anoCalendario = anoFiscal;

      if (mesAnoFiscal.ano == 1)
         anoCalendario++;

     let desde = new Date(anoCalendario, mesCalendario -1, 1);
     let hasta = new Date(anoCalendario, mesCalendario -1 + 1, 0);        // js: last day of month ...


      return { error: false, desde: desde, hasta: hasta, nombreMes: mesAnoFiscal.nombreMes };
};

ContabFunctions.construirPeriodoParaMesFiscal = construirPeriodoParaMesFiscal;
