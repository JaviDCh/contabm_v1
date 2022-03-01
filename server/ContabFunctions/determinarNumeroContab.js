
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

let  determinarNumeroAsientoContab = (fechaAsiento, tipoAsiento, ciaContab, asientoTipoCierreAnualFlag) => {

    // debugger;

    // esta función determina y regresa un número de asiento Contab. Nótese que el número determinado
    // depende de si se genera por grupos de tipo o no. Esto lo determina un flag en ParametrosContab:
    // NumeracionAsientosSeparadaFlag.

    // la functión pasa 'asientoTipoCierreAnualFlag' a 'validarMesCerradoEnContab'. Si el mes cerrado es 12,
    // la función permitirá editar asientos de tipo 'cierre anual', si su fecha corresponde a ese mismo mes ...

    if (typeof asientoTipoCierreAnualFlag === 'undefined') {
       asientoTipoCierreAnualFlag = false;
     };

    // ----------------------------------------------------------------------------------------------
    // lo primero que hacemos es validar que el mes no esté cerrado en Contab
    let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(fechaAsiento, ciaContab, asientoTipoCierreAnualFlag);

    if (validarMesCerradoEnContab.error)
        return { error: true, errMessage: validarMesCerradoEnContab.errMessage };
    // ----------------------------------------------------------------------------------------------

    let errMessage = "";
    let numeroAsientoContab = 0;

    let query = "";

    let mesCalendario = fechaAsiento.getMonth() + 1;
    let anoCalendario = fechaAsiento.getFullYear();

    // leemos parámetrosContab para la compañía seleccionada, para determinar si la numeración de los asientos es separada por tipo de asiento
    query = `Select Top 1 NumeracionAsientosSeparadaFlag From ParametrosContab Where Cia = ?`;

    response = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ ciaContab ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.length == 0) {
        errMessage = `Error: No hemos encontrado un registro en la tabla de <em>parámetros contab</em> para la
                     compañía Contab seleccionada.`;

        return { error: true, errMessage: errMessage };
    };

    // lo primero que hacemos es determinar si el número se genera de acuerdo al tipo del asiento
    let numeracionAsientosSeparadaFlag = response.result[0].NumeracionAsientosSeparadaFlag;


    if (typeof numeracionAsientosSeparadaFlag == 'undefined' || numeracionAsientosSeparadaFlag == null) {
        errMessage = "Error: aparentemente, no se ha definido si la numeración de los asientos es o " +
            "no separada de acuerdo a su tipo.<br />" +
            "Por favor abra la tabla <em>parámetros</em> en Contab y defina un valor para este item.";

        return { error: true, errMessage: errMessage };
    };


    if (!numeracionAsientosSeparadaFlag)
    {
        // la númeración NO ES separada de acuerdo al tipo del asiento. La determinación del número
        // es más simple

        // leemos el número (del próximo) del asiento de la tabla AsientosId
        query = `Select Top 1 Numero From AsientosId Where Mes = ? And Ano = ? And Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ mesCalendario, anoCalendario, ciaContab ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        if (response.result.length == 0) {
            // no existe un registro en la tabla para el mes, año y cia. Lo creamos y asumimos 1
            numeroAsientoContab = 1;

            query = `Insert Into AsientosId (Numero, Mes, Ano, Cia) Values (2, ?, ?, ?)`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ mesCalendario, anoCalendario, ciaContab ], type: sequelize.QueryTypes.INSERT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
        else
        {
            numeroAsientoContab = response.result[0].Numero;

            query = `Update AsientosId Set Numero = Numero + 1 Where Mes = ? And Ano = ? And Cia = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ mesCalendario, anoCalendario, ciaContab ], type: sequelize.QueryTypes.UPDATE })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }
    else {
        // 1) leemos el grupo (de tipos de asiento) de la tabla TiposDeAsiento, para luego obtener el 'número inicial' para este grupo
        query = `Select Top 1 Grupo From TiposDeAsiento Where Tipo = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ tipoAsiento ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function(err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (response.result.length == 0 || response.result[0].Grupo == null) {
            errMessage = `Error: aparentemente, no se ha definido el <em>grupo</em> al cual corresponde el tipo de asientos
                que Ud. ha indicado para el asiento contable.<br />
                Como la numeración de los asientos contables es <em>separada de acuerdo a su tipo</em>
                (según está ahora definido en el sistema <em>Contab</em>), cada tipo de asientos debe corresponder
                a un grupo (de tipos de asiento).<br />
                Por favor abra la tabla <em>Tipos de Asiento</em> en <em>Contab</em> y
                asocie el tipo indicado para este asiento, a un <em>grupo de tipos de asiento</em>, que se haya previamente
                registrado en <em>Contab</em>.`;

            return { error: true, errMessage: errMessage };
        };

        let grupoTiposAsiento = response.result[0].Grupo;

        // 2) leemos el número de 'inicio' (de asiento) que corresponde al grupo (de tipos de asiento), por mes, ano, grupo y cia
        query = `Select Top 1 Numero From AsientosIdPorGrupo Where Grupo = ? And Mes = ? And Ano = ? And Cia = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ grupoTiposAsiento, mesCalendario, anoCalendario, ciaContab ], type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        if (response.result.length == 0) {
            // no existe un registro en la tabla AsientosIdPorGrupo, para el mes, año y cia. Buscamos el número INICIAL
            // en la tabla tGruposDeTiposDeAsiento
            query = `Select Top 1 NumeroInicial From tGruposDeTiposDeAsiento Where Grupo = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ grupoTiposAsiento ], type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


            if (response.result.lenght == 0 || response.result[0].NumeroInicial == null)
            {
                errMessage = `Error: hemos encontrado un error al intentar leer el grupo al cual corresponde el tipo
                              que se ha asignado a este asiento.<br />
                              Por favor abra la tabla <em>grupos de tipos de asiento</em>, en <em>Contab</em>, y revise que exista
                              un registro para el grupo al cual corresponde este tipo de asiento. Además, que exista un número
                              inicial para los asientos contables que coresponden a este grupo.<br />
                              Para determinar cual es el grupo al cual corresponde el tipo del asiento, debe abrir la tabla
                              <em>tipos de asiento</em>, en <em>Contab</em>, y buscar un registro para este tipo.`;
                return { error: true, errMessage: errMessage };
            }

            numeroAsientoContab = response.result[0].NumeroInicial;

            // finalmente, insertamos un registro en la tabla de números *por grupo* para avanzar el número
            query = `Insert Into AsientosIdPorGrupo (Grupo, Mes, Ano, Numero, Cia) Values (?, ?, ?, ?, ?)`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ grupoTiposAsiento, mesCalendario, anoCalendario, numeroAsientoContab + 1, ciaContab ],
                                         type: sequelize.QueryTypes.INSERT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
        else {
            numeroAsientoContab = response.result[0].Numero;

            // avanzamos el número en la tabla de números de asiento por grupo (de tipos de asiento)
            query = `Update AsientosIdPorGrupo Set Numero = ? Where Grupo = ? And Mes = ? And Ano = ? And Cia = ?`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { replacements: [ numeroAsientoContab + 1, grupoTiposAsiento, mesCalendario, anoCalendario, ciaContab ],
                                         type: sequelize.QueryTypes.UPDATE })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
    }

    return { error: false, numeroAsientoContab: numeroAsientoContab };
};


ContabFunctions.determinarNumeroAsientoContab = determinarNumeroAsientoContab;
