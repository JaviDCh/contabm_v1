
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    bancos_facturas_LeerDesdeSql: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });

        let where = "";

        if (filtro2.fechaEmision1) {
            if (filtro2.fechaEmision2) {
                where = `(f.FechaEmision Between '${moment(filtro2.fechaEmision1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaEmision2).format('YYYY-MM-DD')}')`;
            }
            else
                where = `(f.FechaEmision = '${moment(filtro2.fechaEmision1).format('YYYY-MM-DD')}')`;
        }

        if (filtro2.fechaRecepcion1) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (filtro2.fechaRecepcion2) {
                where += `(f.FechaRecepcion Between '${moment(filtro2.fechaRecepcion1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaRecepcion2).format('YYYY-MM-DD')}')`;
            }
            else
                where += `(f.FechaRecepcion = '${moment(filtro2.fechaRecepcion1).format('YYYY-MM-DD')}')`;
        }

        if (lodash.isFinite(filtro2.monto1)) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            if (lodash.isFinite(filtro2.monto2)) {
                where += `(mb.Monto Between ${filtro2.monto1} And ${filtro2.monto2})`;
            }
            else
                where += `(mb.Monto = ${filtro2.monto1})`;
        }

        // ambos, número de factura y número de control, son de tipo String; sin embargo, casi siempre
        // el usuario registra números alli. Por ahora, simplemente, leemos facturas que tengan éstos
        // valores en forma exacta al indicado en el filtro ...
        if (filtro2.numeroFactura) {

            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(f.NumeroFactura = '${filtro2.numeroFactura}')`;
        }

        if (filtro2.numeroControl) {

            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(f.NumeroControl = '${filtro2.numeroControl}')`;
        }

        if (filtro2.concepto) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.concepto.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(f.Concepto Like '${criteria}')`;
        }

        if (filtro2.numeroComprobante) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.numeroComprobante.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(f.NumeroComprobante Like '${criteria}')`;
        }

        if (filtro2.lote) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.lote.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(f.Lote Like '${criteria}')`;
        }

        if (filtro2.nombreCompania) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreCompania.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(p.Nombre Like '${criteria}')`;
        }


        if (filtro2.soloFacturasConRetencionIva) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(f.RetencionSobreIva Is Not Null And f.RetencionSobreIva <> 0)`;
        }

        if (filtro2.soloFacturasConRetencionIslr) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(f.ImpuestoRetenido Is Not Null And f.ImpuestoRetenido <> 0)`;
        }

        if (filtro2.soloNotasDeCredito) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            where += `(f.NcNdFlag Is Not Null And f.NcNdFlag <> '')`;
        }


        if (where)
            where += " And ";
        else
            where = "(1 = 1) And ";

        where += `(f.Cia = ${ciaContab.toString()})`;

        // estados (pendiente, pagado, ...)
        if (_.isArray(filtro2.estados) && filtro2.estados.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.estados.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            });

            lista += ")";
            where += `(f.Estado In ${lista})`;
        }

        // cxcCxPFlag (CxC, CxP, ...)
        if (_.isArray(filtro2.cxcCxP) && filtro2.cxcCxP.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.cxcCxP.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            });

            lista += ")";
            where += `(f.CxCCxPFlag In ${lista})`;
        }

        // compañías
        if (_.isArray(filtro2.proveedores) && filtro2.proveedores.length > 0) {

            if (where)
                where += " And ";
            else
                where += "(1 = 1) And ";

            let lista = "";

            filtro2.proveedores.forEach((x) => {
                if (!lista)
                    lista = "(" + x.toString();
                else
                    lista += ", " + x.toString();
            });

            lista += ")";
            where += `(f.Proveedor In ${lista})`;
        }


        if (!where)
            where = "1 = 1";            // esto nunca va a ocurrir aquí ...


        // -----------------------------------------------------------------------------------
        // preparamos un criterio para leer solo facturas pagadas en un período
        let criterioFechaPago = "(1 = 1)";

        if (filtro2.fechaPago1) {
            let periodoPago = "";
            if (filtro2.fechaPago2) {
                periodoPago = `(p.Fecha Between '${moment(filtro2.fechaPago1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaPago2).format('YYYY-MM-DD')}')`;
            }
            else
                periodoPago = `(p.Fecha = '${moment(filtro2.fechaPago1).format('YYYY-MM-DD')}')`;


            criterioFechaPago = `f.ClaveUnica In (Select cf.ClaveUnicaFactura
                                From CuotasFactura cf Inner Join dPagos dp On
                                     cf.ClaveUnica = dp.ClaveUnicaCuotaFactura
                                     Inner Join Pagos p On dp.ClaveUnicaPago = p.ClaveUnica
                                     Where ${periodoPago} And p.Cia = ${ciaContab.toString()}
                                )`;
        }


        // ---------------------------------------------------------------------------------------------------
        // leemos los movimientos bancarios para el período seleccionado. Además, leemos la chequera y la
        // cuenta bancaria (associations en model - include en query)

        let query = `Select f.ClaveUnica as claveUnica, f.NumeroFactura as numeroFactura,
                    f.NumeroControl as numeroControl,
                    f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion,
            	    p.Abreviatura as nombreCompania, m.Simbolo as simboloMoneda,
                    f.Concepto as concepto, f.NcNdFlag as ncNdFlag,
            	    Case f.CxCCxPFlag When 1 Then 'CxP' When 2 Then 'CxC' Else 'Indef' End As cxPCxC,
                    fp.Descripcion As nombreFormaPago,
            	    tp.Descripcion As nombreTipoServicio,
            	    f.NumeroComprobante as numeroComprobanteSeniat, f.MontoFacturaSinIva as montoNoImponible,
                    f.MontoFacturaConIva as montoImponible,
            	    f.IvaPorc as ivaPorc, f.Iva as iva, f.TotalFactura as totalFactura,
                    f.ImpuestoRetenido as retencionIslr, f.RetencionSobreIva as retencionIva,
                    f.Anticipo as anticipo, f.Saldo as saldo,
            	    Case Estado When 1 Then 'Pend' When 2 Then 'Parcial' When 3 Then 'Pag'
                    When 4 Then 'Anul' Else 'Indef' End As estadoFactura
                    From Facturas f Inner Join Proveedores p on f.Proveedor = p.Proveedor
            	    Inner Join FormasDePago fp on f.CondicionesDePago = fp.FormaDePago
                    Inner Join Monedas m on f.Moneda = m.Moneda
            	    Inner Join TiposProveedor tp On f.Tipo = tp.Tipo
                    Where ${where} And ${criterioFechaPago}
                    `;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());


        // eliminamos los asientos que el usuario pueda haber registrado antes ...
        Temp_Consulta_Bancos_Facturas.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        EventDDP.matchEmit('bancos_leerBancosFacturas_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosFacturasDesdeSqlServer' },
                            { current: 1, max: 1, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let factura = lodash.clone(item);

            factura._id = new Mongo.ObjectID()._str;
            factura.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...

            factura.fechaEmision = factura.fechaEmision ? moment(factura.fechaEmision).add(TimeOffset, 'hours').toDate() : null;
            factura.fechaRecepcion = factura.fechaRecepcion ? moment(factura.fechaRecepcion).add(TimeOffset, 'hours').toDate() : null;

            Temp_Consulta_Bancos_Facturas.insert(factura);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_leerBancosFacturas_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosFacturasDesdeSqlServer' },
                                    { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_leerBancosFacturas_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosFacturasDesdeSqlServer' },
                                        { current: 1, max: 1, progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return "Ok, las facturas han sido leídos desde sql server.";
    }
})
