

import * as moment from 'moment';
import { TimeOffset } from '../../../../globals/globals'; 
import SimpleSchema from 'simpl-schema';
import { sequelize } from '../../../sqlModels/_globals/_loadThisFirst/_globals';

import { CajaChica_Reposiciones_sql, CajaChica_Reposiciones_Gastos_sql } from '../../../imports/sqlModels/bancos/cajasChicas'
import { Temp_Bancos_CajaChica_webReport } from '../../../../imports/collections/temp/bancos.cajaChica.webReport'; 
import { Meteor } from 'meteor/meteor';

Meteor.methods(
{
    'reposicionesCajaChica.leerByID.desdeSql': function (pk) {

        new SimpleSchema({
            pk: { type: Number, optional: false, },
        }).validate({ pk });

        let response: any = null;
        response = Async.runSync(function(done) {
            CajaChica_Reposiciones_sql.findAll({ where: { reposicion: pk },
                include: [
                    { 
                        model: CajaChica_Reposiciones_Gastos_sql, as: 'cajaChica_reposicion_gastos', 
                    },
                ],
                    // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let reposicion = {} as any;

        if (response && response.result && response.result.length) {
            reposicion = response.result[0].dataValues;

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            reposicion.fecha = reposicion.fecha ? moment(reposicion.fecha).add(TimeOffset, 'hours').toDate() : null;
            
            if (reposicion.cajaChica_reposicion_gastos) {
                reposicion.cajaChica_reposicion_gastos.forEach((r) => {
                    r.fechaDocumento = r.fechaDocumento ? moment(r.fechaDocumento).add(TimeOffset, 'hours').toDate() : null;
                });
            }
        }

        // antes de regresar, grabamos la reposición a un collecion en mongo para que esté disponible si el usuario 
        // desea imprimirla ... 
        Temp_Bancos_CajaChica_webReport.remove({ user: Meteor.user()._id }); 

        // volvemos a leer la reposicion, pues queremos leer todos sus 'catálogos': caja chica, rubro, proveedor ... la idea 
        // es no enviar todas estas descripciones al client ... 
        response = null;
        response = Async.runSync(function(done) {
            CajaChica_Reposiciones_sql.findAll({ where: { reposicion: pk },
                include: [
                    { 
                        model: CajaChica_Reposiciones_Gastos_sql, as: 'cajaChica_reposicion_gastos', 
                    },
                ],
                    // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        let reposicion_webReport = {} as any;
        let query: string = ""; 

        if (response && response.result && response.result.length) {
            let cajaChica = response.result[0].dataValues;

            // leemos la descripción para la caja chica 
            query = `Select Descripcion as descripcion, CiaContab as ciaContab from CajaChica_CajasChicas cc Where cc.CajaChica = ?`;
            let datosCajaChica = leerCatalogoEnSqlServer(query, cajaChica.cajaChica); 
            
                
            reposicion_webReport = { 
                _id: new Mongo.ObjectID()._str, 
                reposicion: cajaChica.reposicion, 
                fecha: moment(cajaChica.fecha).add(TimeOffset, 'hours').toDate(), 
                cajaChica: datosCajaChica.descripcion, 
                observaciones: cajaChica.observaciones ? cajaChica.observaciones : null, 
                estadoActual: cajaChica.estadoActual, 
                gastos: [], 
                user: Meteor.user()._id,  
            }

            
            if (cajaChica.cajaChica_reposicion_gastos) {
                cajaChica.cajaChica_reposicion_gastos.forEach((r) => {
                    r = r.dataValues; 

                    r._id = new Mongo.ObjectID()._str; 
                    r.gastoID = r.id; 
                    r.fechaDocumento = r.fechaDocumento ? moment(r.fechaDocumento).add(TimeOffset, 'hours').toDate() : null; 
                    delete r.id; 

                    // leemos la descripcion del rubro 
                    query = `Select Descripcion as descripcion from CajaChica_Rubros r Where r.Rubro = ?`;
                    let rubroCajaChica = leerCatalogoEnSqlServer(query, r.rubro).descripcion; 
 
                    r.nombreRubro = rubroCajaChica; 

                    // leemos el nombre del proveedor
                    if (r.proveedor) { 
                        query = `Select Abreviatura as abreviatura from Proveedores p Where p.Proveedor = ?`;
                        let proveedor = leerCatalogoEnSqlServer(query, r.proveedor).abreviatura; 

                        r.proveedor = proveedor; 
                    }

                    // leemos la cuenta contable asociada al rubro 
                    query = `Select c.Cuenta as cuenta 
                             From CajaChica_RubrosCuentasContables r Inner Join CuentasContables c 
                             On r.CuentaContableID = c.ID 
                             Where r.Rubro = ? And c.Cia = ${datosCajaChica.ciaContab}`
                    let cuentaContable = leerCatalogoEnSqlServer(query, r.rubro);

                    r.cuentaContable = cuentaContable && cuentaContable.cuenta ? cuentaContable.cuenta : null; 
                    
                    reposicion_webReport.gastos.push(r); 
                });
            }
        }

        Temp_Bancos_CajaChica_webReport.insert(reposicion_webReport); 
        
        return JSON.stringify(reposicion);
    }
})

function leerCatalogoEnSqlServer(query: string, pk: number) { 
    // para leer algún catálogo en sql server; ejemplo: rubro de caja chica, proveedor, caja chica, etc. 
    // nótese que, en estos casos, siempre hay una clave simple y de tipo numérica ... 

    query = query.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

    let response: any = null;
    response = Async.runSync(function(done) {
        sequelize.query(query, { replacements: [ pk ], type: sequelize.QueryTypes.SELECT })
            .then(function(result) { done(null, result); })
            .catch(function (err) { done(err, null); })
            .done();
    });

    if (response.error) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }

    return Array.isArray(response.result) && response.result.length ? response.result[0] : null; 
}
