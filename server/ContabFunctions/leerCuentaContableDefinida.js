

import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import SimpleSchema from 'simpl-schema';


let leerCuentaContableDefinida = (concepto,
                                  compania,
                                  rubro,
                                  moneda,
                                  ciaContab,
                                  concepto2) => {

    // ahora la Cia Contab es requerida en DefinicionCuentasContables; es decir, esta columna nunca
    // será null en rows en esta tabla ...

    // agregamos una nueva forma de definir cuentas contables, cuyos conceptos *no son fijos*, como el Iva, ISLR,
    // Compras, CxP, etc. Todos los conceptos anteriores son fijos; es decir, tienen un número (concepto)
    // *predefinido* (1, 2, 3, 4, ...).
    // La nueva definición, permite al usuario registrar los conceptos en una tabla. La primera de estas definiciones,
    // corresponden a los
    // Impuestos (o retenciones) varias (#13) y se defininen en la tabla ImpuestosRetencionesDefinicion.
    // Para definir la cuenta para alguno de
    // estos nuevos rubros, el usuario debe indicr el concepto (13: otros impuestos) y el concepto2
    // (ID del registro en la tabla)

    // nos aseguramos que el concepto y la compañía (en parámetros) vengan con un valor
    if (!concepto || !ciaContab) {
        return {
            error: true,
            message: `Error (en <em>leerCuentaContableDefinida</em>):
                      los valores para obtener la cuenta contable definida, en el catálogo
                      de <em>definición de cuentas contables</em>
                      (<em>Bancos / Catálogos / Definición de cuentas contables</em>),
                      no pueden ser null para la <em>compañía Contab seleccionada</em>  o el <em>concepto</em> .`
        };
    };


    new SimpleSchema({
        concepto: { type: SimpleSchema.Integer, optional: false, },
        compania: { type: SimpleSchema.Integer, optional: true, },
        rubro: { type: SimpleSchema.Integer, optional: true, },
        moneda: { type: SimpleSchema.Integer, optional: true, },
        ciaContab: { type: SimpleSchema.Integer, optional: false, },
        concepto2: { type: SimpleSchema.Integer, optional: true, },
    }).validate({ concepto, compania, rubro, moneda, ciaContab, concepto2, });


      let errorMessage = "";
      let where = "";

      if (concepto) {
          // el concepto siempre vendrá
          if (where)
              where += " And ";
          else
              where = "(1 = 1) And ";

          where += `(d.Concepto = ${concepto.toString()})`;
      };

      if (ciaContab) {
          // la cia Contab siempre vendrá
          if (where)
              where += " And ";
          else
              where = "(1 = 1) And ";

          where += `(c.Cia = ${ciaContab.toString()})`;
      };


      // en adelante, si viene un criterio (ej: compañía) lo aplicamos, o buscamos donde la columna sea null
      where += ` And ( (d.Compania = ${compania ? compania.toString() : -9999}) Or (d.Compania Is Null) )`;
      where += ` And ( (d.Moneda = ${moneda ? moneda.toString() : -9999}) Or (d.Moneda Is Null) )`;
      where += ` And ( (d.Rubro = ${rubro ? rubro.toString() : -9999}) Or (d.Rubro Is Null) )`;



      // para la columna Concepto2, el criterio de aplicación es tradicional; si viene lo aplicamos si no viene
      // lo ignoramos ...
      if (concepto2) {
          if (where)
              where += " And ";
          else
              where = "(1 = 1) And ";

          where += `(c.Concepto2 = ${concepto2.toString()})`;
      };



      let query = `Select d.CuentaContableID From
                    DefinicionCuentasContables d Inner Join CuentasContables c
                    On d.CuentaContableID = c.ID
                    Where ${where} Order by d.Compania desc, d.Moneda desc, d.Rubro desc`;

      let response = null;
      response = Async.runSync(function(done) {
          sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
              .then(function(result) { done(null, result); })
              .catch(function (err) { done(err, null); })
              .done();
      });


      if (response.error)
          throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

      let cuentaContableID = 0;
      if (_.isArray(response.result) && response.result.length) {
          // los rows vienen como un array en response.result

          // nota: aparentente, como usamos un raw query, aunque indicamos el modelo, el query regresa un objeto con los nombres originales
          // de las columnas en sql (ie: en vez de 'cambio', 'Cambio') ...
          cuentaContableID = response.result[0].CuentaContableID;

          return { error: false, cuentaContableID: cuentaContableID, };
      } else {
          return {
              error: true,
              message: `Error: no hemos podido leer una cuenta contable definida en la tabla
                        <em>Definicion de cuentas contables</em>, para el criterio indicado (${where}).`
          };
      };
};

ContabFunctions.leerCuentaContableDefinida = leerCuentaContableDefinida;
