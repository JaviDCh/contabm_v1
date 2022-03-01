


let  determinarNumeroNegativoAsiento = (fechaAsiento, ciaContab) => {

     let errorMessage = "";
     let numeroNegativoAsiento = 0;

     let mesCalendario = fechaAsiento.getMonth() + 1;
     let anoCalendario = fechaAsiento.getFullYear();

     let response = null;
     response = Async.runSync(function(done) {
         AsientosNegativosID_sql.findAndCountAll({
             where: { mes: mesCalendario, ano: anoCalendario, cia: ciaContab },
         })
             .then(function(result) { done(null, result); })
             .catch(function (err) { done(err, null); })
             .done();
     });

     if (response.error)
         throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

     let numeroNegativo;

     if (response.result.count == 0)
     {
         // no existe un registro para el mes y ano en la tabla; agregamos uno

         numeroNegativo = AsientosNegativosID_sql.build({
            mes: mesCalendario,
            ano: anoCalendario,
            cia: ciaContab,
            numero: 2,
         });

         numeroNegativoAsiento = -1;

         response = Async.runSync(function(done) {
             numeroNegativo.save()
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });
     }
     else
     {
         // primero creamos una instancia del registro que acabamos de leer
         numeroNegativo = response.result.rows[0].dataValues;

         numeroNegativoAsiento = numeroNegativo.numero * -1;

         // aunque pasamos todos los datos, el Update será hecho solo para el 'número' ...
         response = Async.runSync(function(done) {
             AsientosNegativosID_sql.update({ numero: numeroNegativo.numero + 1 },
                                            { where: { mes: mesCalendario, ano: anoCalendario, cia: ciaContab }})
                 .then(function(result) { done(null, result); })
                 .catch(function (err) { done(err, null); })
                 .done();
         });
     };

     if (response.error)
         throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

     return {
         error: false,
         errorMessage: '',
         numeroNegativoAsiento: numeroNegativoAsiento,
     };
 };

 ContabFunctions.determinarNumeroNegativoAsiento = determinarNumeroNegativoAsiento;
