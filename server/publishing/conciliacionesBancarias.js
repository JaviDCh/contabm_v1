

import { ConciliacionesBancarias, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from '/imports/collections/bancos/conciliacionesBancarias'; 

Meteor.publish("conciliacionesBancarias", function (filtro) {

    var filtro = JSON.parse(filtro);
    var selector = {};

    if (filtro._id)
        selector._id = filtro._id;

    // nótese como los 'dates' vienen como strings y deben ser convertidos ...
    if (filtro.desde1 && moment(filtro.desde1).isValid()) {
        if (filtro.desde2 && moment(filtro.desde2).isValid())
            selector.desde = { $gte: moment(filtro.desde1).toDate(), $lte: moment(filtro.desde2).toDate() };
        else
            selector.desde = moment(filtro.desde1).toDate();
    };

    if (filtro.hasta1 && moment(filtro.hasta1).isValid()) {
        if (filtro.hasta2 && moment(filtro.hasta2).isValid())
            selector.hasta = { $gte: moment(filtro.hasta1).toDate(), $lte: moment(filtro.hasta2).toDate() };
        else
            selector.hasta = moment(filtro.hasta1).toDate();
    };

    if (filtro.bancos && filtro.bancos.length) {
      var array = _.clone(filtro.bancos);
      selector.banco = { $in: array };
    };

    if (filtro.monedas && filtro.monedas.length) {
      var array = _.clone(filtro.monedas);
      selector.moneda = { $in: array };
    };

    if (filtro.cuentasBancarias && filtro.cuentasBancarias.length) {
      var array = _.clone(filtro.cuentasBancarias);
      selector.cuentaBancaria = { $in: array };
    };

    if (filtro.cia)
      selector.cia = filtro.cia;

    let filtroConciliacionesLeidas = [ "-xyz-xyz" ]

    // construimos un filtro para leer items en collections relacionadas (movimientos propios y mov del banco)
    ConciliacionesBancarias.find(selector, { fields: { _id: 1, }}).forEach((x) => {
        filtroConciliacionesLeidas.push(x._id);
    });

    // leemos las conciliaciones que cumplen el filtro y sus registros asociados (movimientos propios y mov del banco)
    return [
        ConciliacionesBancarias.find(selector),
        ConciliacionesBancarias_movimientosPropios.find({ conciliacionID: { $in: filtroConciliacionesLeidas }}),
        ConciliacionesBancarias_movimientosBanco.find({ conciliacionID: { $in: filtroConciliacionesLeidas }}),
        ConciliacionesBancarias_movimientosCuentaContable.find({ conciliacionID: { $in: filtroConciliacionesLeidas }}),
    ];
});
