
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'factura.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: SimpleSchema.Integer, }
        }).validate({ pk });

        let response = null;
        response = Async.runSync(function(done) {
            Facturas_sql.findAll(
                {
                    where: { claveUnica: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        // cuando el registro es eliminado, simplemente no existe. Regresamos de inmediato ...
        if (!response.result.length) {
            return null;
        }

        let factura = response.result[0];

        // -------------------------------------------------------------------------------------------------
        // ahora leemos los impuestos y las retenciones registradas para la factura en Facturas_Impuestos
        response = null;
        response = Async.runSync(function(done) {
            Facturas_Impuestos_sql.findAndCountAll(
                {
                    where: { facturaID: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }

        factura.impuestosRetenciones = [];

        if (response.result.count) {
            response.result.rows.forEach((i) => {
                // agregamos este _id para que ui_grid pueda manejar estos registros en forma adecuada en el
                // cliente; aunque los registros ya vienen con un id desde sql, cuando el usuario agregue en el
                // cliente uno nuevo (cosa que no ocurrirá a menudo, pero si con 'Determinar'), este id no
                // existirá ...
                i._id = new Mongo.ObjectID()._str,
                i.fechaRecepcionPlanilla = i.fechaRecepcionPlanilla ? moment(i.fechaRecepcionPlanilla).add(TimeOffset, 'hours').toDate() : null;
                factura.impuestosRetenciones.push(i);
            });
        };


        // -------------------------------------------------------------------------------------------------
        // ahora leemos las cuotas de la factura
        response = null;
        response = Async.runSync(function(done) {
            CuotasFactura_sql.findAndCountAll(
                {
                    where: { claveUnicaFactura: pk },
                    raw: true,
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        factura.cuotasFactura = [];

        if (response.result.count) {
            response.result.rows.forEach((cuota) => {
                // agregamos este _id para que ui_grid pueda manejar estos registros en forma adecuada en el
                // cliente; aunque los registros ya vienen con un id desde sql, cuando el usuario agregue en el
                // cliente uno nuevo (cosa que no ocurrirá a menudo, pero si con 'Determinar'), este id no
                // existirá ...
                cuota._id = new Mongo.ObjectID()._str,
                cuota.fechaVencimiento = cuota.fechaVencimiento ? moment(cuota.fechaVencimiento).add(TimeOffset, 'hours').toDate() : null;
                factura.cuotasFactura.push(cuota);
            });
        };
        // -------------------------------------------------------------------------------------------------


        // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
        factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
        factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;
        factura.fRecepcionRetencionISLR = factura.fRecepcionRetencionISLR ? moment(factura.fRecepcionRetencionISLR).add(TimeOffset, 'hours').toDate() : null;
        factura.fRecepcionRetencionIVA = factura.fRecepcionRetencionIVA ? moment(factura.fRecepcionRetencionIVA).add(TimeOffset, 'hours').toDate() : null;
        factura.ingreso = factura.ingreso ? moment(factura.ingreso).add(TimeOffset, 'hours').toDate() : null;
        factura.ultAct = factura.ultAct ? moment(factura.ultAct).add(TimeOffset, 'hours').toDate() : null;

        // regresamos un object, pues luego debemos agregar las faltas y el salario; éstos están en tablas diferentes ...
        // TODO: mejor! vamos a leer como una relación y enviar, aunque como string, en un solo objeto ...
        return JSON.stringify(factura);
    }
});
