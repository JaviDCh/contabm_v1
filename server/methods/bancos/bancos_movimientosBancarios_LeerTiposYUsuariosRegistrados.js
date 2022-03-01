
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import lodash from 'lodash'; 

Meteor.methods(
{
    bancos_movimientosBancarios_LeerTiposYUsuariosRegistrados: function () {

        let query = "";

        query = `Select Distinct Usuario as usuario From MovimientosBancarios`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let usuarios = lodash.clone(response.result);

        // ------------------------------------------------------------------------------------------------------

        query = `Select Distinct Tipo as tipo From MovimientosBancarios`;

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let tipos = lodash.clone(response.result);

        return {
            usuarios: usuarios,
            tipos: tipos,
        };
    }
});
