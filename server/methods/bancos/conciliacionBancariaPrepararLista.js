
import numeral from 'numeral';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { FlattenBancos } from '/imports/general/bancos/flattenBancos'; 

import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';

Meteor.methods(
{
    conciliacionBancariaPrepararLista: function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Object, blackbox: true, optional: false, },
        }).validate({ filtro2, ciaContab });

        let selector = {};

        // nótese como los 'dates' vienen como strings y deben ser convertidos ...
        if (filtro2.desde1 && moment(filtro2.desde1).isValid()) {
            if (filtro2.desde2 && moment(filtro2.desde2).isValid())
                selector.desde = { $gte: moment(filtro2.desde1).toDate(), $lte: moment(filtro2.desde2).toDate() };
            else
                selector.desde = moment(filtro2.desde1).toDate();
        };

        if (filtro2.hasta1 && moment(filtro2.hasta1).isValid()) {
            if (filtro2.hasta2 && moment(filtro2.hasta2).isValid())
                selector.hasta = { $gte: moment(filtro2.hasta1).toDate(), $lte: moment(filtro2.hasta2).toDate() };
            else
                selector.hasta = moment(filtro2.hasta1).toDate();
        };

        if (_.isArray(filtro2.bancos) && filtro2.bancos.length) {
          var array = _.clone(filtro2.bancos);
          selector.banco = { $in: array };
        };

        if (_.isArray(filtro2.monedas) && filtro2.monedas.length) {
          var array = _.clone(filtro2.monedas);
          selector.moneda = { $in: array };
        };

        if (_.isArray(filtro2.cuentasBancarias) && filtro2.cuentasBancarias.length) {
          var array = _.clone(filtro2.cuentasBancarias);
          selector.cuentaBancaria = { $in: array };
        };

        if (filtro2.cia)
          selector.cia = filtro2.cia;


        // eliminamos los items, en mongo, que el usuario pueda haber registrado antes ...
        Temp_Bancos_ConciliacionesBancarias_Lista.remove({ user: this.userId });

        // leemos las conciliaciones bancarias que cumplen el criterio (filtro) indicado por el usuario
        let conciliacionesBancarias = ConciliacionesBancarias.find(selector).fetch();

        if (!conciliacionesBancarias || conciliacionesBancarias.length == 0) {
            return 0;
        };

        // ---------------------------------------------------------------------------------------------
        // construimos un array de cuentas bancarios, adecuado para mostrar en la lista en el filtro ...

        // en nuestro programa, el collecion Bancos tiene un array de agencias y, dentro, un array
        // de cuentas bancarias; con la siguiente función, regresamos una lista 'plana' para acceder
        // en forma más fácil las cuentas bancarias
        let cuentasBancariasList = FlattenBancos(ciaContab);

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = conciliacionesBancarias.length;
        let reportarCada = Math.floor(numberOfItems / 25);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;

        EventDDP.matchEmit('bancos_leerBancosConciliacionesBancarias_reportProgress',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosConciliacionesBancarias' },
                            { current: currentProcess, max: numberOfProcess, progress: '0 %',
                              message: `leyendo las conciliaciones bancarias ... ` });
        // -------------------------------------------------------------------------------------------------------------

        conciliacionesBancarias.forEach((conciliacion) => {

            // buscamos la cuenta bancaria en la lista (construida arriba); nótese que viene el banco y la moneda
            let cuentaBancaria = _.find(cuentasBancariasList, (x) => { return x.cuentaInterna === conciliacion.cuentaBancaria; });

            if (!cuentaBancaria || _.isEmpty(cuentaBancaria)) {
                let message = `Error: no hamos podido leer la cuenta bancaria para la conciliación que tiene
                               las siguientes características:
                               período ${moment(conciliacion.desde).format('DD-MMM-YYYY')} al
                               ${moment(conciliacion.hasta).format('DD-MMM-YYYY')};
                               cuenta bancaria: ${conciliacion.cuentaBancaria};
                               observaciones: ${conciliacion.observaciones}.<br />
                               Nota: probablemente Ud. no debe ejecutar el proceso: <em>Copiar catálogos</em>,
                               en <em>Bancos / Generales</em>.
                               `;

                 return { error: true, message: message };
            };

            let conciliacionItem  = {};

            conciliacionItem._id = new Mongo.ObjectID()._str;

            conciliacionItem.conciliacionID = conciliacion._id;
            conciliacionItem.desde = conciliacion.desde;
            conciliacionItem.hasta = conciliacion.hasta;
            conciliacionItem.banco = conciliacion.banco;
            conciliacionItem.nombreBanco = cuentaBancaria.nombreBanco;
            conciliacionItem.moneda = conciliacion.moneda;
            conciliacionItem.simboloMoneda = cuentaBancaria.simboloMoneda;
            conciliacionItem.cuentaBancariaID = conciliacion.cuentaBancaria;
            conciliacionItem.cuentaBancaria = cuentaBancaria.cuentaBancaria;
            conciliacionItem.observaciones = conciliacion.observaciones;
            conciliacionItem.cia = conciliacion.cia;
            conciliacionItem.nombreCia = cuentaBancaria.nombreCia;
            conciliacionItem.user = Meteor.userId();

            Temp_Bancos_ConciliacionesBancarias_Lista.insert(conciliacionItem);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 20) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_leerBancosConciliacionesBancarias_reportProgress',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosConciliacionesBancarias' },
                                    { current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                      message: `leyendo las conciliaciones bancarias ... ` });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_leerBancosConciliacionesBancarias_reportProgress',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosConciliacionesBancarias' },
                                        { current: currentProcess, max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %"),
                                          message: `leyendo las conciliaciones bancarias ... ` });
                    reportar = 0;
                };
            };
            // -------------------------------------------------------------------------------------------------------
        });

        return { error: false, cantidadRecs: cantidadRecs };
    }
});
