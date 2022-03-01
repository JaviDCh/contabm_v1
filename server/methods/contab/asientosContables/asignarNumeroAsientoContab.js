
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import { AsientosContables } from '/imports/collections/contab/asientosContables'; 

Meteor.methods(
{
    contab_asignarNumeroAsientoContab: function (numeroAutomatico) {

        // debugger;

        // recibimos el pk de un asiento, asignamos un número Contab y actualizamos en mongo y en sql server ...

        check(numeroAutomatico, Number);

        let asientoContable = AsientosContables.findOne({ numeroAutomatico: numeroAutomatico });

        if (!asientoContable)
            throw new Meteor.Error("Asiento-no-encontrado",
                                   `Error inesperado: el asiento contable, cuyo número automático es
                                   '${numeroAutomatico.toString()}', no pudo ser leído en mongo (???)`);

        if (asientoContable.numero >= 0)
            throw new Meteor.Error("Asiento-con-numeroAsignado",
                                   `Error: el asiento contable, ya tiene un <em>número de asiento Contab</em>.`);


        let numeroAsientoContab = ContabFunctions.determinarNumeroAsientoContab(asientoContable.fecha,
                                                                                asientoContable.tipo,
                                                                                asientoContable.cia);

        if (numeroAsientoContab.error) {
            throw new Meteor.Error("Error-asignar-numeroContab",
                                   `Error: ha ocurrido un error al intentar obtener un número de asiento Contab. <br />
                                   El mensaje específico del error es: <br />
                                   ${numeroAsientoContab.errMessage}`);

        };

        // -----------------------------------------------------------------------
        // primero, actualizamos el asiento en mongo ...
        AsientosContables.update({ numeroAutomatico: numeroAutomatico }, { $set: { numero: numeroAsientoContab.numeroAsientoContab }});

        // -----------------------------------------------------------------------
        // finalmente, debemos actualizar el asiento en sql server
        query = `Update Asientos Set Numero = ? Where NumeroAutomatico = ?`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { replacements: [ numeroAsientoContab.numeroAsientoContab, numeroAutomatico ],
                                     type: sequelize.QueryTypes.UPDATE })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        return `Ok, hemos asignado el número <b>${numeroAsientoContab.numeroAsientoContab.toString()}</b> al asiento contable.`;
    }
});
