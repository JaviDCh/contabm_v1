
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import moment from 'moment'; 

let verificarAsientosDescuadradosEnPeriodo = (desde, hasta, ciaContab) => {

    // debugger;
      query = `Select Count(*) As cantOfAsientos, Sum(Debe - Haber) As sumOfAsientos
               From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
               Where a.Fecha Between ? And ? And a.Cia = ?`;

     let response = null;
     response = Async.runSync(function(done) {
         sequelize.query(query, {
                                   replacements: [
                                       moment(desde).format("YYYY-MM-DD"),
                                       moment(hasta).format("YYYY-MM-DD"),
                                       ciaContab.numero
                                   ],
                                   type: sequelize.QueryTypes.SELECT
                               })
             .then(function(result) { done(null, result); })
             .catch(function (err) { done(err, null); })
             .done();
     });

     if (response.error)
         throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

     if (response.result[0].cantOfAsientos > 0 && response.result[0].sumOfAsientos != 0) {
         return { error: true };
     };

    return { error: false };
};

ContabFunctions.verificarAsientosDescuadradosEnPeriodo = verificarAsientosDescuadradosEnPeriodo;
