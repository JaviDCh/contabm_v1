
import { TimeOffset } from '/globals/globals'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 

Meteor.methods(
{
    bancos_itf_grabarMovimientosITF_ASqlServer: function (ciaContab) {

        // debugger;

        let movimientoBancario = MovimientosBancarios.findOne({ user: this.userId, tipo: 'IT', docState: 1 });


        // ----------------------------------------------------------------------------------------------
        // // primero que nada, validamos que el mes no esté cerrado en Contab ni Bancos
        if (movimientoBancario) {
            let validarMesCerradoEnContab = ContabFunctions.validarMesCerradoEnContab(movimientoBancario.fecha, ciaContab);

            if (validarMesCerradoEnContab.error)
                return { error: true, errMessage: validarMesCerradoEnContab.errMessage };

            let validarMesCerradoEnBancos = BancosFunctions.validarMesCerradoEnBancos(movimientoBancario.fecha, ciaContab);

            if (validarMesCerradoEnBancos.error)
                return { error: true, errMessage: validarMesCerradoEnBancos.errMessage };
        };
        // ----------------------------------------------------------------------------------------------

        // leemos los movimientos que corresponden al usuario y generamos un movimiento itf para cada movimiento ...
        let cantidadMovimientosITFLeidos = 0;
        let cantidadMovimientosITFAgregados = 0;

        let userID = this.userId;
        let usuario = Meteor.users.findOne(userID);

        MovimientosBancarios.find({ user: this.userId, tipo: 'IT' }).forEach( (movimiento) => {

            if (movimiento.docState && movimiento.docState == 1) {

                // preparamos el object para grabar (insert) a sql server ...

                // -----------------------------------------------------------------------------------------
                // para compensar la conversión que ocurre en las fechas al grabar a sql server, restamos
                // 4.3 (ahora 4.0) horas a cada una ...

                let movimientoBancario_sqlServer = {
                    transaccion: movimiento.transaccion,
                    tipo: "IT",
                    fecha: moment(movimiento.fecha).subtract(TimeOffset, 'hours').toDate(),
                    provClte: null,
                    beneficiario: movimiento.beneficiario,
                    concepto: movimiento.concepto,
                    signo: false,
                    montoBase: movimiento.monto,
                    comision: 0,
                    impuestos: 0,
                    monto: movimiento.monto,
                    ingreso: moment(new Date()).subtract(TimeOffset, 'hours').toDate(),
                    ultMod: moment(new Date()).subtract(TimeOffset, 'hours').toDate(),
                    usuario: usuario.emails[0].address,
                    claveUnica: null,                                           // sql server debe agregar y regresar un pk ...
                    claveUnicaChequera: movimiento.claveUnicaChequera,
                    fechaEntregado: null,
                };

                response = Async.runSync(function(done) {
                    MovimientosBancarios_sql.create(movimientoBancario_sqlServer)
                        .then(function(result) { done(null, result); })
                        .catch(function (err) { done(err, null); })
                        .done();
                });

                if (response.error)
                    throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

                cantidadMovimientosITFAgregados++;
            };

            cantidadMovimientosITFLeidos++;
        });

        return {
            cantidadMovimientosITFLeidos: cantidadMovimientosITFLeidos,
            cantidadMovimientosITFAgregados: cantidadMovimientosITFAgregados
        };
    }
});
