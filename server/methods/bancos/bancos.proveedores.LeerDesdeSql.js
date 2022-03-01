
import { sequelize } from '/server/sqlModels/_globals/_loadThisFirst/_globals';
import numeral from 'numeral';
import lodash from 'lodash';
import moment from 'moment';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 

Meteor.methods(
{
    'bancos.proveedores.LeerDesdeSql': function (filtro) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
        }).validate({ filtro2, });

        let where = "";

        if (filtro2.nombreProveedor) {
            if (where)
                where += " And ";
            else
                where = "(1 = 1) And ";

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.nombreProveedor.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(p.Nombre Like '${criteria}')`;
        };

        if (!where)
            where = "1 = 1";

        // ---------------------------------------------------------------------------------------------------
        // leemos los pagos desde sql server, que cumplan el criterio indicado
        let query = `Select p.Proveedor as proveedor, p.Nombre as nombre, c.Descripcion as ciudad,
                     Case p.ProveedorClienteFlag When 1 Then 'Proveedor' When 2 Then 'Cliente' When 3 Then 'Ambos' When 4 Then 'Relacionado' Else 'Indefinido' End as proveedorCliente,
                     t.Descripcion as tipoProveedor, p.Rif as rif,
                     Case p.NacionalExtranjeroFlag When 1 Then 'Nacional' When 2 Then 'Extranjero' Else 'Indefinido' End as nacionalExtranjero,
                     Case p.NatJurFlag When 1 Then 'Natural' When 2 Then 'Juridico' Else 'Indefinido' End as naturalJuridico,
                     f.Descripcion as formaPago, p.Ingreso as ingreso, p.UltAct as ultAct, p.Usuario as usuario, p.Lote as numeroLote
                     From Proveedores p
                     Left Outer Join tCiudades c On p.Ciudad = c.Ciudad
                     Left Outer Join FormasDePago f On p.FormaDePagoDefault = f.FormaDePago
                     Inner Join TiposProveedor t On p.Tipo = t.Tipo
                     Where ${where}
                    `;

        if (filtro2.companiasSinDatosAsociados) {
            // intentamos leer solo proveedores sin datos asociados: facturas, pagos, etc. Para hacerlo, agregamos 'subqueries' al select ...
            query += ` And p.Proveedor Not In (Select Proveedor From OrdenesPago)
                       And p.Proveedor Not In (Select ProvClte From MovimientosBancarios)
                       And p.Proveedor Not In (Select Proveedor From Pagos)
                       And p.Proveedor Not In (Select Proveedor From Facturas)
                       And p.Proveedor Not In (Select Proveedor From InventarioActivosFijos)
                     `;
        }

        response = null;
        response = Async.runSync(function(done) {
            sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) {
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }


        // eliminamos los registros que el usuario pueda haber registrado antes (en mongo) ...
        Temp_Consulta_Bancos_Proveedores.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde sql server.";
        };

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;
        EventDDP.matchEmit('bancos_proveedores_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'bancos', process: 'leerBancosProveedoresDesdeSqlServer' },
                            { current: 1, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let proveedor = lodash.clone(item);

            proveedor._id = new Mongo.ObjectID()._str;
            proveedor.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            proveedor.ingreso = proveedor.ingreso ? moment(proveedor.ingreso).add(TimeOffset, 'hours').toDate() : null;
            proveedor.ultAct = proveedor.ultAct ? moment(proveedor.ultAct).add(TimeOffset, 'hours').toDate() : null;

            Temp_Consulta_Bancos_Proveedores.insert(proveedor);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('bancos_proveedores_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'bancos', process: 'leerBancosProveedoresDesdeSqlServer' },
                                    { current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('bancos_proveedores_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'bancos', process: 'leerBancosProveedoresDesdeSqlServer' },
                                        { current: currentProcess, max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, los proveedores y clientes han sido leídos desde sql server.";
    }
});
