

import SimpleSchema from 'simpl-schema';
import { sequelize } from 'server/sqlModels/_globals/_loadThisFirst/_globals';

import { UnidadTributaria } from 'imports/collections/bancos/unidadTributaria';
import { Proveedores_sql } from '../../../imports/sqlModels/bancos/proveedores'; 

Meteor.methods(
    {
        'bancos.facturas.leerRetencionIslr': function (fechaRecepcion, proveedorID) {

            // leemos la unidad tributaria más reciente y el registro en categorías de retención más reciente. 
            // Ambos, más recientes con respecto a la fecha de recepción de la factura. 
            // Para leer el registro en catagorías de retención, leemos del proveedor su: categoría y tipo de persona (nat, jur)
    
            new SimpleSchema({
                fechaRecepcion: { type: Date, optional: false },
                proveedorID: { type: Number, optional: false },
            }).validate({ fechaRecepcion, proveedorID, });

            let response: any = null;
            response = Async.runSync(function(done) {
                Proveedores_sql.findAll({ where: { proveedor: proveedorID }, raw: true, })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }

            if (!Array.isArray(response.result) || !response.result.length) {
                return { 
                    error: true, 
                    message: `Error inesperado: no hemos podido leer el proveedor en la base de datos. Por favor revise.`
                }; 
            }
                
            let proveedor = {} as any;

            if (response && response.result && response.result.length) {
                proveedor = response.result[0];
            }

            // primero leemos la unidad tributaria más reciente a la fecha de recepción de la factura 
            let unidadTributaria = UnidadTributaria.findOne({ fecha: { $lte: fechaRecepcion }}, { sort: { fecha: -1 }}); 

            if (!unidadTributaria) { 
                let message = `Error: no hemos podido leer un monto de unidad tributaria que corresponda a una fecha <b>anterior o igual</b> a 
                               la fecha de recepción indicada para la factura.<br />
                               Por favor revise estos registros en el catálogo: <em>bancos/catálogos/unidad tributaria</em>.
                              `; 

                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 
                
                return { 
                    error: true, 
                    message: message
                }; 
            }

            // ahora leemos el registro para la categoría de retención ... 
            // TODO: falta usar el tipo de persona y la categoría en el query ... 
            let query = `Select Top 1 CodigoIslr as codigoIslr, PorcentajeRetencion as porcentajeRetencion, 
                         AplicaSustraendo as aplicaSustraendo, Minimo as minimo    
                         From CategoriasRetencion 
                         Where Categoria = ? And TipoPersona = ? And FechaAplicacion <= ? 
                         Order By FechaAplicacion Desc
                        `;

            query = query.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

            let tipoPersona = "PJ"; 
            if (proveedor.natJurFlag === 1) { 
                tipoPersona = "PN"; 
            }

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, 
                    { 
                        replacements: [ proveedor.categoriaProveedor, tipoPersona, fechaRecepcion ], 
                        type: sequelize.QueryTypes.SELECT, 
                     })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });
        
            if (response.error) { 
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
            }
                
            if (response.result.length == 0) {
                let message = `Error: no hemos podido leer un registro de categoría de retención que corresponda a una fecha <b>anterior o igual</b> a 
                               la fecha de recepción indicada para la factura; además, que correponda a la categoría de retención y 
                               tipo de persona (nat/jur) indicados para el proveedor en la tabla de proveedores.<br />
                               Por favor revise estos registros en el catálogo: <em>bancos/catálogos/categorías de retención</em>.
                                `; 

                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                return { 
                    error: true, 
                    message: message
                }; 
            }
        
            let categoriaRetencion = response.result[0];

            if (!unidadTributaria.monto || !unidadTributaria.factor || !categoriaRetencion.porcentajeRetencion || !categoriaRetencion.codigoIslr) { 
                let message = `Error: aunque pudimos leer registros para <em>unidad tributaria</em> y <em>categoría de retención</em>, 
                               pareciera que 
                               estos registros no se han registrado en forma completa, para poder calcular la retención de Islr 
                               con sus valores.<br /><br />
                               Por favor revise estos registros en los catálogo: <em>bancos/catálogos/categorías de retención</em> y 
                               <em>bancos/catálogos/unidad tributaria</em> y complételos antes de intentar continuar y determinar 
                               esta retención (Islr). 
                                `; 

                message = message.replace(/\/\//g, '');     // quitamos '//' del query; typescript agrega estos caracteres??? 

                return { 
                    error: true, 
                    message: message
                }; 
            }
    
            return { 
                error: false, 
                message: `Ok, leímos la U.T. y el registro en categorías de retención en forma satisfactoria.`, 
                unidadTributaria: unidadTributaria, 
                categoriaRetencion: categoriaRetencion, 
            }; 
        }
    })