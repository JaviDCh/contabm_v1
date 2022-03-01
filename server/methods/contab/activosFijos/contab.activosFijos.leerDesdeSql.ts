


import { sequelize } from '../../../../server/sqlModels/_globals/_loadThisFirst/_globals'; 
import * as numeral from 'numeral';
import * as lodash from 'lodash';
import * as moment from 'moment';
import SimpleSchema from 'simpl-schema';

import { TimeOffset } from '../../../../globals/globals';
import '../../../../imports/globals/tsDeclares';

import { Temp_Consulta_Contab_ActivosFijos } from '../../../../imports/collections/contab/temp.contab.consulta.activosFijos'; 

Meteor.methods(
{
    'contab.activosFijos.LeerDesdeSql': function (filtro, ciaContab) {

        let filtro2 = JSON.parse(filtro);

        new SimpleSchema({
            filtro2: { type: Object, blackbox: true, optional: false, },
            ciaContab: { type: Number, optional: false, },
        }).validate({ filtro2, ciaContab, });


        let where = "";

        if (filtro2.fechaCompra1) {
            if (filtro2.fechaCompra2) {
                where = `(af.FechaCompra Between '${moment(filtro2.fechaCompra1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaCompra2).format('YYYY-MM-DD')}')`;
            }
            else { 
                where = `(af.FechaCompra = '${moment(filtro2.fechaCompra1).format('YYYY-MM-DD')}')`;
            }  
        }

        if (filtro2.fechaDesincorporacion1) {
            if (filtro2.fechaDesincorporacion2) {
                where = `(af.FechaDesincorporacion Between '${moment(filtro2.fechaDesincorporacion1).format('YYYY-MM-DD')}' And '${moment(filtro2.fechaDesincorporacion2).format('YYYY-MM-DD')}')`;
            }
            else { 
                where = `(af.FechaDesincorporacion = '${moment(filtro2.fechaDesincorporacion1).format('YYYY-MM-DD')}')`;
            }  
        }

        // descripcion 
        if (filtro2.descripcion) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.descripcion.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(af.Descripcion Like '${criteria}')`;
        }

        // modelo 
        if (filtro2.modelo) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.modelo.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(af.Modelo Like '${criteria}')`;
        }

        // serial 
        if (filtro2.serial) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.serial.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(af.Serial Like '${criteria}')`;
        }

        // placa 
        if (filtro2.placa) {
            if (where) { 
                where += " And ";
            }
            else { 
                where += "(1 = 1) And ";
            }

            // hacemos que la busqueda sea siempre genérica ... nótese como quitamos algunos '*'
            // que el usuario haya agregado
            let criteria = filtro2.placa.replace(/\*/g, '');
            criteria = `%${criteria}%`;

            where += `(af.Placa Like '${criteria}')`;
        }



        if (where) { 
            where += " And ";
        }  
        else { 
            where = "(1 = 1) And ";
        }
            
        where += `(af.Cia = ${ciaContab.toString()})`;

        // ---------------------------------------------------------------------------------------------------
        // leemos los activos fijos, desde sql server, que cumplan el criterio indicado
        let query = `Select af.ClaveUnica as claveUnica, af.Descripcion as descripcion, 
                     d.Descripcion as departamento, tp.Descripcion as tipoProducto, 
                     pr.Abreviatura as proveedor, af.FechaCompra as fechaCompra, af.Serial as serial, 
                     af.Modelo as modelo, af.Placa as placa, af.CostoTotal as costoTotal, 
                     af.ValorResidual as valorResidual, af.MontoADepreciar as montoADepreciar, 
                     af.DesincorporadoFlag as desincorporadoFlag, af.FechaDesincorporacion as fechaDesincorporacion 
                     From InventarioActivosFijos af Left Outer Join tDepartamentos d 
                     On af.Departamento = d.Departamento  
                     Left Outer Join Proveedores pr On af.Proveedor = pr.Proveedor 
                     Left Outer Join TiposDeProducto tp On af.Tipo = tp.Tipo 
                     Where ${where} 
                    `;

        // eliminamos '//'; parece que ts lo agrega cuando encuentra un string con algunos caracteres especiales, como new line ... 
        query = query.replace(/\/\//gi, "");

        let response: any = null;
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
        Temp_Consulta_Contab_ActivosFijos.remove({ user: this.userId });


        if (response.result.length == 0) {
            return "Cero registros han sido leídos desde la base de datos (sql server).";
        }

        // -------------------------------------------------------------------------------------------------------------
        // para reportar progreso solo 20 veces; si hay menos de 20 registros, reportamos siempre ...
        let numberOfItems = response.result.length;
        let reportarCada = Math.floor(numberOfItems / 30);
        let reportar = 0;
        let cantidadRecs = 0;
        let numberOfProcess = 1;
        let currentProcess = 1;
        EventDDP.matchEmit('contab_activosFijos_reportProgressDesdeSqlServer',
                            { myuserId: this.userId, app: 'contab', process: 'leerContabActivosFijosDesdeSqlServer' },
                            { current: 1, max: numberOfProcess, progress: '0 %' });
        // -------------------------------------------------------------------------------------------------------------

        response.result.forEach((item) => {

            // nótese como los 'registros' en sql y mongo son idénticos, salvo algunos fields
            // adicionales que existen en mongo ...
            let activosFijos = lodash.clone(item);

            activosFijos._id = new Mongo.ObjectID()._str;
            activosFijos.user = Meteor.userId();

            // al leer de sql, debemos sumar 4:0, para compensar la conversión que intenta hacer sequelize
            // (desde utc a local);
            // ahora tenemos una variable 'global' que sirve de 'offset' ...
            activosFijos.fechaCompra = activosFijos.fechaCompra ? moment(activosFijos.fechaCompra).add(TimeOffset, 'hours').toDate() : null;
            activosFijos.fechaDesincorporacion = activosFijos.fechaDesincorporacion ? moment(activosFijos.fechaDesincorporacion).add(TimeOffset, 'hours').toDate() : null;
            
            Temp_Consulta_Contab_ActivosFijos.insert(activosFijos);

            // -------------------------------------------------------------------------------------------------------
            // vamos a reportar progreso al cliente; solo 20 veces ...
            cantidadRecs++;
            if (numberOfItems <= 30) {
                // hay menos de 20 registros; reportamos siempre ...
                EventDDP.matchEmit('contab_activosFijos_reportProgressDesdeSqlServer',
                                    { myuserId: this.userId, app: 'contab', process: 'leerContabActivosFijosDesdeSqlServer' },
                                    { current: currentProcess, max: numberOfProcess,
                                      progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
            }
            else {
                reportar++;
                if (reportar === reportarCada) {
                    EventDDP.matchEmit('contab_activosFijos_reportProgressDesdeSqlServer',
                                        { myuserId: this.userId, app: 'contab', process: 'leerContabActivosFijosDesdeSqlServer' },
                                        { current: currentProcess, max: numberOfProcess,
                                          progress: numeral(cantidadRecs / numberOfItems).format("0 %") });
                    reportar = 0;
                }
            }
            // -------------------------------------------------------------------------------------------------------
        })

        return "Ok, los proveedores y clientes han sido leídos desde sql server.";
    }
})