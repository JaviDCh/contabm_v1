
import moment from 'moment';
import numeral from 'numeral';
import lodash from 'lodash'; 
import JSZip from 'jszip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import SimpleSchema from 'simpl-schema';
import { TimeOffset } from '/globals/globals'; 
import { montoEscrito } from '/imports/general/montoEnLetras';

import { Proveedores_sql } from '/server/imports/sqlModels/bancos/proveedores'; 
import { CuentasBancarias_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { MovimientosBancarios_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Bancos } from '/imports/collections/bancos/bancos';
import { Chequeras_sql } from '/server/imports/sqlModels/bancos/movimientosBancarios'; 
import { Monedas_sql } from '/server/imports/sqlModels/monedas'; 

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    'bancos.obtenerChequeImpreso': function (fileID,
                                             tipoArchivo,
                                             ciaSeleccionada,
                                             userID,
                                             movimientoBancarioID,
                                             nombreArchivo) {

        new SimpleSchema({
            fileID: { type: String, optional: false, },
            tipoArchivo: { type: String, optional: false, },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false, },
            userID: { type: String, optional: false, },
            movimientoBancarioID: { type: SimpleSchema.Integer, optional: false, },
            nombreArchivo: { type: String, optional: false, },
        }).validate({ fileID, tipoArchivo, ciaSeleccionada, userID, movimientoBancarioID, nombreArchivo, });


        // el template debe ser siempre un documento word ...
        if (!nombreArchivo || !nombreArchivo.endsWith('.docx')) { 
            throw new Meteor.Error('archivo-debe-ser-word-doc', 'El archivo debe ser un documento Word (.docx).');
        }
            
        // antes que nada, leemos el movimientoBancario
        let response = null;
        response = Async.runSync(function(done) {
            MovimientosBancarios_sql.findAll({ where: { claveUnica: movimientoBancarioID },
                include: [
                    { model: Chequeras_sql, as: 'chequera', include: [
                        { model: CuentasBancarias_sql, as: 'cuentaBancaria', },
                    ],},
                ],
                // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result.length) { 
            throw new Meteor.Error('db-registro-no-encontrado',  
                                   'Error inesperado: no pudimos leer el movimiento bancario en la base de datos.');
        }
            
        let movimientoBancario = response.result[0].dataValues;
        
        movimientoBancario.fecha = movimientoBancario.fecha ? moment(movimientoBancario.fecha).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.fechaEntregado = movimientoBancario.fechaEntregado ? moment(movimientoBancario.fechaEntregado).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ingreso = movimientoBancario.ingreso ? moment(movimientoBancario.ingreso).add(TimeOffset, 'hours').toDate() : null;
        movimientoBancario.ultMod = movimientoBancario.ultMod ? moment(movimientoBancario.ultMod).add(TimeOffset, 'hours').toDate() : null;

        // con la cuenta bancaria, obtenemos el banco en mongo ...
        let cuentaBancaria = Array.isArray(response.result) &&
                             response.result[0] &&
                             response.result[0].chequera &&
                             response.result[0].chequera.cuentaBancaria &&
                             response.result[0].chequera.cuentaBancaria.dataValues;

        let banco = Bancos.findOne({ 'agencias.cuentasBancarias.cuentaBancaria': 
                                     (cuentaBancaria.cuentaBancaria ? cuentaBancaria.cuentaBancaria : 'Indefinida') });

        let nombreBanco = "Indefinido";
        let bancoNombreCompleto = "Indefinido"; 
        if (banco) {
            nombreBanco = banco.abreviatura;
            bancoNombreCompleto = banco.nombre; 
        }

        // ahora leemos el asiento contable asociado al movimiento bancario; nótese que puede haber más de uno, cuando el 
        // asiento contable es convertido a otra moneda ... 
        response = null;
        response = Async.runSync(function(done) {
            AsientosContables_sql.findAll({
                where: { provieneDe: 'Bancos', provieneDe_ID: movimientoBancario.claveUnica, cia: ciaSeleccionada.numero, },
                raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result.length) {
            throw new Meteor.Error('db-registro-no-encontrado',
                                    `Error inesperado: no pudimos leer un asiento contable para el movimiento bancario indicado.<br />
                                    El movimiento bancario debe tener un asiento contable asociado.`);
        }

        let asientosContables = []; 

        for (let asientoContable of response.result) {

            // ahora que tenemos el asiento, leemos sus partidas
            let response2 = null;
            response2 = Async.runSync(function (done) {
                dAsientosContables_sql.findAll({
                    where: { numeroAutomatico: asientoContable.numeroAutomatico, },
                    raw: true
                })
                    .then(function (result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            })

            if (response2.error) {
                throw new Meteor.Error(response2.error && response2.error.message ? response2.error.message : response2.error.toString());
            }

            let partidasAsientoContable = response2.result;

            // preparamos un array que debemos pasar para combinar con Word ...
            let partidas = [];

            partidasAsientoContable.forEach((x) => {
                // buscamos la cuenta contable; debe existir en mongo ...
                let cuentaContable = CuentasContables.findOne({ id: x.cuentaContableID });

                let p = {
                    cuentaContable: cuentaContable ? cuentaContable.cuentaEditada : 'Indefinida',
                    descripcionPartida: x.descripcion,
                    montoPartida: numeral(x.haber != 0 ? (x.haber * -1) : x.debe).format("(0,0.00)"),
                    montoPartidaDebe: numeral(x.haber != 0 ? 0 : x.debe).format("0,0.00"),
                    montoPartidaHaber: numeral(x.haber != 0 ? Math.abs(x.haber) : 0).format("0,0.00"),
                    debe: x.debe, 
                    haber: x.haber, 
                };

                partidas.push(p);
            })

            asientoContable.partidas = partidas; 
            asientosContables.push(asientoContable); 
        }


        // ------------------------------------------------------------------------------------------------------
        // con la cuenta bancaria, obtenemos la moneda; la idea es saber si la moneda es nacional o extranjera 
        response = null;
        response = Async.runSync(function(done) {
            Monedas_sql.findAll({ where: { moneda: cuentaBancaria.moneda }, raw: true, })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (!response.result.length) { 
            throw new Meteor.Error('db-registro-no-encontrado',  
                                   'Error inesperado: no pudimos leer el la moneda, que corresponde a la cuenta bancaria, en la base de datos.');
        }

        let moneda = response.result[0]; 


        // ------------------------------------------------------------------------------------------------------
        // leemos el proveedor para obener algunos datos más 
        let proveedorNombreContacto1 = ""; 
        let proveedorNombreContacto2 = ""; 
        let proveedorRif = ""; 
        let proveedorNit = ""; 

        // ahora leemos la compañía (prov/clte) asociada al movimiento bancario
        response = null;
        response = Async.runSync(function(done) {
            Proveedores_sql.findAll({
                where: { proveedor: movimientoBancario.provClte ? movimientoBancario.provClte : 0, },
                attributes: [ "nit", "rif", "contacto1", "contacto2", ], 
                raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        })

        if (response.error) { 
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
        }
            
        if (response.result.length) {
            let proveedor = response.result[0]; 
            proveedorNombreContacto1 = proveedor.contacto1 ? proveedor.contacto1 : ""; 
            proveedorNombreContacto2 = proveedor.contacto2 ? proveedor.contacto2 : ""; 
            proveedorRif = proveedor.rif ? proveedor.rif : ""; 
            proveedorNit = proveedor.nit ? proveedor.nit : ""; 
        }

        // ----------------------------------------------------------------------------------------------------
        // collectionFS asigna un nombre diferente a cada archivo que guarda en el server; debemos
        // leer el item en el collection, para obtener el nombre 'verdadero' del archivo en el disco

        let collectionFS_file = Files_CollectionFS_Templates.findOne(fileID);

        if (!collectionFS_file) { 
            throw new Meteor.Error('collectionFS-no-encontrada',
            'Error inesperado: no pudimos leer el item en collectionFS, que corresponda al archivo indicado.');
        }
            
        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        let filePath = Meteor.settings.public.collectionFS_path_templates;
        // nótese que el nombre 'real' que asigna collectionFS cuando el usuario hace el download del archivo,
        // lo encontramos en el item en collectionFS
        let fileNameWithPath = filePath + "/" + collectionFS_file.copies.files_collectionFS_templates.key;

        // ----------------------------------------------------------------------------------------------------
        // ahora intentamos abrir el archivo con fs (node file system)
        // leemos el contenido del archivo (plantilla) en el server ...
        let content = fs.readFileSync(fileNameWithPath, "binary");

        // ----------------------------------------------------------------------------------------------------
        // leemos la tabla de configuración de este proceso para obtener los nombres de las personas
        let configuracionChequeImpreso = ConfiguracionChequeImpreso.findOne({ cia: ciaSeleccionada._id });

        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

        let montoBase = movimientoBancario.montoBase ? Math.abs(movimientoBancario.montoBase) : 0; 
        let comision = movimientoBancario.comision ? Math.abs(movimientoBancario.comision) : 0; 
        let impuestos = movimientoBancario.impuestos ? Math.abs(movimientoBancario.impuestos) : 0; 
        let monto = movimientoBancario.monto ? Math.abs(movimientoBancario.monto) : 0; 

        // preparamos el array que vamos a pasar a setData; agregamos un movimiento (el mismo) para cada asiento contable. 
        // la idea es poder mostrar una página en Word para cada asiento contable. Normalmente, habrá solo un asiento, pero 
        // puede haber más de uno para asientos convertidos a otras monedas 
        let items = []; 

        for (let asientoContable of asientosContables) { 
            let item = { 
                monedaNombre: moneda.descripcion, 
                monedaSimbolo: moneda.simbolo, 
                // nótese como permitimos agregar a la plantilla todos los montos (com, imp, ...); además, también 
                // agregamos montoEscrito para cada uno de ellos 

                montoBase: numeral(montoBase).format("0,0.00"),
                montoBase_enLetras: montoEscrito(montoBase), 

                comision: numeral(comision).format("0,0.00"),
                comision_enLetras: montoEscrito(comision), 

                impuestos: numeral(impuestos).format("0,0.00"),
                impuestos_enLetras: montoEscrito(impuestos), 

                monto: numeral(monto).format("0,0.00"),
                monto_enLetras: montoEscrito(monto), 

                beneficiario: movimientoBancario.beneficiario,
                fechaEscrita: moment(movimientoBancario.fecha).format("DD [de] MMMM"),
                año: numeral(parseInt(moment(movimientoBancario.fecha).format("YYYY"))).format("0,0"),
                añoSinFormato: numeral(parseInt(moment(movimientoBancario.fecha).format("YYYY"))).format("0"),

                concepto: movimientoBancario.concepto,
                numeroComprobante: asientoContable ? asientoContable.numero : '',

                numeroCheque: movimientoBancario.transaccion,

                cuentaBancaria: cuentaBancaria.cuentaBancaria,
                banco: nombreBanco,
                bancoNombreCompleto: bancoNombreCompleto, 

                proveedorNombreContacto1: proveedorNombreContacto1, 
                proveedorNombreContacto2: proveedorNombreContacto2, 
                proveedorRif: proveedorRif, 
                proveedorNit: proveedorNit, 

                p: asientoContable.partidas,

                totalMonto: numeral(lodash.sumBy(asientoContable.partidas, "debe") - lodash.sumBy(asientoContable.partidas, "haber")).format("0,0.00"), 
                totalDebe: numeral(lodash.sumBy(asientoContable.partidas, "debe")).format("0,0.00"),  
                totalHaber: numeral(lodash.sumBy(asientoContable.partidas, "haber")).format("0,0.00"),  

                elaboradoPor: configuracionChequeImpreso && configuracionChequeImpreso.elaboradoPor ? configuracionChequeImpreso.elaboradoPor : ' ',
                revisadoPor: configuracionChequeImpreso && configuracionChequeImpreso.revisadoPor ? configuracionChequeImpreso.revisadoPor : ' ',
                aprobadoPor: configuracionChequeImpreso && configuracionChequeImpreso.aprobadoPor ? configuracionChequeImpreso.aprobadoPor : ' ',
                contabilizadoPor: configuracionChequeImpreso && configuracionChequeImpreso.contabilizadoPor ? configuracionChequeImpreso.contabilizadoPor : ' ',
                nombreCompania: ciaSeleccionada.nombre,
            }

            if (!moneda.nacionalFlag) { 
                // si la moneda no es nacional, cambiamos la palabra 'céntimo' por 'centavo' en la descripción de los montos 
                item.montoBase_enLetras = item.montoBase_enLetras.replace("céntimo", "centavo"); 
                item.comision_enLetras = item.comision_enLetras.replace("céntimo", "centavo"); 
                item.impuestos_enLetras = item.impuestos_enLetras.replace("céntimo", "centavo"); 
                item.monto_enLetras = item.monto_enLetras.replace("céntimo", "centavo"); 
            }

            items.push(item); 
        }

        doc.setData({
            items: items, 
        })

        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render();
        }
        catch (error) {
            var e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties,
            }
            throw new Meteor.Error('error-render-Docxtemplater',
                `Error: se ha producido un error al intentar generar un documento docx usando DocxTemplater.
                 El mensaje de error recibido es: ${JSON.stringify({error: e})}.
                `);
        }

        let buf = doc.getZip().generate({ type:"nodebuffer" });

        // agregamos un nombre del archivo al 'metadata' en collectionFS; así, identificamos este archivo
        // en particular, y lo podemos eliminar en un futuro, antes de volver a registrarlo ...
        let userID2 = userID.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let nombreArchivo2 = nombreArchivo.replace('.docx', `_${userID2}.docx`);

        let removedFiles = Files_CollectionFS_tempFiles.remove({ 'metadata.nombreArchivo': nombreArchivo2 });

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...
        return grabarDatosACollectionFS_regresarUrl(buf, nombreArchivo2, tipoArchivo, 'bancos', ciaSeleccionada, Meteor.user(), 'docx');
    }
})
