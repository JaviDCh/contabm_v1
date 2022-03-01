
import moment from 'moment';

Meteor.methods(
{
    determinarSiExisteAsientoAutomaticoCierreAnual: function (anoFiscal, ciaContab) {

        Match.test(anoFiscal, Match.Integer);
        Match.test(ciaContab, Match.Object);

        // los asientos automáticos de cierre anual siempre existen para el mes fiscal 12
        let periodoCalendario = ContabFunctions.construirPeriodoParaMesFiscal(12, anoFiscal, ciaContab.numero);

        if (periodoCalendario.error)
            throw new Meteor.Error(periodoCalendario.errMessage);

        let primerDiaMes = periodoCalendario.desde;
        let ultimoDiaMes = periodoCalendario.hasta;
        let nombreMesCalendario = periodoCalendario.nombreMes;

        let response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.count({ where: {
                fecha: {
                    $gte: moment(primerDiaMes).format('YYYY-MM-DD'),
                    $lte: moment(ultimoDiaMes).format('YYYY-MM-DD')
                },
                tipo: 'AUTO',
                asientoTipoCierreAnualFlag: { $eq: true },
                cia: ciaContab.numero,
            }})
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        return JSON.stringify({ 'cantidadAsientosTipoCierreAnual': response.result });
    }
});


function leerMesesDesdeTablaMesesDelAnoFiscal(mesesArray, cia) {

    // ahora leemos los registros que existen en la tabla MesesDelAnoFiscal; el contenido de esta tabla nos ayuda a
    // determinar si el año fiscal de la compañía es un año calendario normal, o empieza y termina en meses diferentes
    // al primero y último del año calendario

    // nótese como leemos solo los meses que se van a cerrar; puede ser 1 o varios ...

    let response = {};
    response = Async.runSync(function(done) {
        MesesDelAnoFiscal_sql.findAndCountAll(
            {
                attributes: [ 'mesFiscal', 'mes', 'nombreMes' ],
                where: { mesFiscal: { $in: mesesArray }, cia: cia },
                order: [['mesFiscal', 'ASC']],
                raw: true
            })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error)
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

    if (response.result.count === 0)
        throw new Meteor.Error("tabla-mesesAnoFiscal-vacia",
        "Por favor revise esta tabla para la compañía Contab seleccionada; debe contener registros.");

    return response.result.rows;
};
