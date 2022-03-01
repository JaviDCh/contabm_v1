
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';

Meteor.methods(
{
    'leerTablas.impuestosRetencionesDefinicion.alicuotasIva': function () {

        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)

        let query = `Select * From ImpuestosRetencionesDefinicion`;

        let response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!_.isArray(response.result)) {
            return {
                error: true,
                message: `Error: hemos obtenido un error al intentar leer la tabla
                <em>Definición de Impuestos y Retenciones</em>.`,
            };
        };

        let impuestosRetencionesDefinicion = response.result;

        query = `Select * From TiposAlicuotaIva`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        if (!_.isArray(response.result)) {
            return {
                error: true,
                message: `Error: hemos obtenido un error al intentar leer la tabla
                <em>Tipos de alícuota para el impuesto Iva (TiposAlicuotaIva)</em>.`,
            };
        };

        let tiposAlicuotaIva = response.result;

        let data = {
            impuestosRetencionesDefinicion: impuestosRetencionesDefinicion,
            tiposAlicuotaIva: tiposAlicuotaIva,
        };

        return JSON.stringify(data);
    }
});
