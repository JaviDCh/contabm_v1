
import moment from 'moment';

let validarMesCerradoEnContab = (fecha, ciaContab, asientoTipoCierreAnualFlag) => {

      let errMessage = "";

      if (typeof asientoTipoCierreAnualFlag === 'undefined') {
         asientoTipoCierreAnualFlag = false;
       };
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

      if (response.error)
          throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

      if (response.result.count == 0) {
          errMessage = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
              el mes que corresponde a la fecha del asiento (${moment(fecha).format('DD-MM-YYYY')}).<br />
              Por favor revise y corrija esta situación.`;

          return { error: true, errMessage: errMessage };
      };


      let mesAnoFiscal = response.result.rows[0].dataValues;

    let mesFiscal_asientoContable = mesAnoFiscal.mesFiscal;
    let anoFiscal_asientoContable = anoCalendario;

    if (mesAnoFiscal.ano == 1)
        anoFiscal_asientoContable--;


    // ------------------------------------------------------------------------------------
    // leemos el mes cerrado para la cia del asiento (nota importante: el último mes cerrado corresponde a
    // mes y año *fiscal* y no calendario)

    response = Async.runSync(function(done) {
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

    // nótese que la validación es compleja, pues debemos tomar en cuenta la situación que crea el
    // proceso de cierre anual ...

    if (mesCerradoContab_Fiscal < 12) {
        // cuando el mes (fiscal!) cerrado en anterior a 12, la validación es muy simple

        if ((anoFiscal_asientoContable < anoCerradoContab_Fiscal) ||
            (anoFiscal_asientoContable == anoCerradoContab_Fiscal &&
             mesFiscal_asientoContable <= mesCerradoContab_Fiscal)) {

            errMessage = `Error: la fecha que se desea editar o registrar, corresponde a un mes ya cerrado en <em>Contab</em>.<br />
                         Ud. no puede alterar un mes ya cerrado en <em>Contab</em>.`;

            return { error: true, errMessage: errMessage };
        };

        return { error: false };
    };

    // en adelante en este código, el mes cerrado (fiscal) es 12 o 13 ...

    if (mesCerradoContab_Fiscal == 13) {
        // en la contabilidad, para la cia del asiento, se hizo el cierre anual *más no* el traspaso de saldos
        // impedimos la edición de asientos de ese año o de años anteriores ..
        if (anoFiscal_asientoContable < anoCerradoContab_Fiscal) {

            errMessage = `Error: la fecha que se desea editar o registrar, corresponde a un mes ya cerrado en <em>Contab</em>.<br />
                         Ud. no puede alterar un mes ya cerrado en <em>Contab</em>.`;

            return { error: true, errMessage: errMessage };
        };

        if (anoFiscal_asientoContable = anoCerradoContab_Fiscal) {

            errMessage = `Error: se acaba de ejecutar el cierre anual en <em>Contab</em>, más <b>no</b> el traspaso de saldos
                          al nuevo año fiscal.<br />
                          Para agregar o editar asientos contables que correspondan al año fiscal que ahora está cerrado,
                          retroceda la fecha del <em>último mes cerrado</em>.`;

            return { error: true, errMessage: errMessage };
        };

        // aunque el cierre anual fue efectuado y no el traspaso de saldos, el asiento que se intenta grabar
        // corresponde a un mes de un año **posterior**; permitirmos ...
        return { error: false };
    };

    if (mesCerradoContab_Fiscal == 12) {
        // en la contabilidad, para la cia del asiento, se hizo el cierre mensual para el último mes del año fiscal
        // permitimos agregar asientos de tipo cierre anual

        if (anoFiscal_asientoContable === anoCerradoContab_Fiscal && mesFiscal_asientoContable === 12 && asientoTipoCierreAnualFlag) {
            // se cerró el mes 12 (fiscal) y se está intentando editar un asiento de tipo 'cierre anual'
            // justo para ese mes; permtimos ...
            return { error: false };
        };


        if (anoFiscal_asientoContable > anoCerradoContab_Fiscal) {
            // el asiento es de un año posterior, simplemente regresamos ...
            return { error: false };
        }
        else if ((anoFiscal_asientoContable < anoCerradoContab_Fiscal) ||
                (anoFiscal_asientoContable == anoCerradoContab_Fiscal &&
                 mesFiscal_asientoContable < mesCerradoContab_Fiscal)) {
            // el asiento es de un mes anterior; regresamos con error
            errMessage = `Error: la fecha que se desea editar o registrar, corresponde a un mes ya cerrado en <em>Contab</em>.<br />
                         Ud. no puede alterar un mes ya cerrado en <em>Contab</em>.`;


            return { error: true, errMessage: errMessage };
        };

        // TODO: creo que, al menos por ahora, debemos permitir aquí que el usuario agregue asientos de tipo cierre anual;
        // es decir, cuando el mes cerrado es igual a 12 (no 13!). Los asientos que se agregan en este estado, corresponden a
        // asientos de tipo cierre anual. Aunque ahora no necesitamos revisar ésto, lo necesitaremos para cuando permitamos
        // registrar asientos regulares y usemos esta función ...

        // los asientos que llegan aquí son del mes fiscal 12 (y el mes cerrado es 12)
        // agregar: permitimos; el asiento será de tipo cierre anual; el item se inicializará en Inserting
        // modificar: permitimos *solo* si el asiento es de tipo cierre anual

        // if (AddModify == "A")
        //     return true;
        // else
        //     // el asiento se está modificando o eliminando ...
        //     if (cierreAnualFlag == null || !cierreAnualFlag.Value)
        //     {

        // cuando el mes cerrado es 12, y el asiento contable editado corresponde a ese mes, solo permitirmos
        // si es del tipo 'cierre anual' ...
        errMessage = `Error: el último mes del año fiscal <b>ha sido cerrado</b>, más no se ha efectuado aún el cierre anual;
        bajo estas condiciones, solo se permite editar asientos del último mes del año fiscal, si corresponden a
        asientos contables de tipo <em>cierre anual</em>.`;

        return { error: true, errMessage: errMessage };
            // }

        // return true;
    };

    return { error: false };
};

ContabFunctions.validarMesCerradoEnContab = validarMesCerradoEnContab;
