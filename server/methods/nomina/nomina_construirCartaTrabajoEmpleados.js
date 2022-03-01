

import lodash from 'lodash';
import moment from 'moment';
import numeral from 'numeral';
import { TimeOffset } from '/globals/globals'; 
import { Departamentos_sql } from '/server/imports/sqlModels/nomina/catalogos/departamentos';

Meteor.methods(
{
    nomina_construirCartaTrabajoEmpleados: function (fileID,
                                                     tipoArchivo,
                                                     ciaSeleccionada,
                                                     userID,
                                                     empleadoID,
                                                     nombreArchivo) {

        // debugger;
        let Future = Npm.require('fibers/future');

        check(fileID, String);
        check(tipoArchivo, String);
        check(ciaSeleccionada, Object);
        check(userID, String);
        check(empleadoID, Number);
        check(nombreArchivo, String);

        let JSZip = Meteor.npmRequire('jszip');
        let Docxtemplater = Meteor.npmRequire('docxtemplater');

        let fs = Npm.require('fs');
        let path = Npm.require('path');
        // Docxtemplater = require('docxtemplater');

        // el template debe ser siempre un documento word ...
        if (!nombreArchivo || !nombreArchivo.endsWith('.docx'))
            throw new Meteor.Error('archivo-debe-ser-word-doc', 'El archivo debe ser un documento Word (.docx).');

        // antes que nada, leemos el empleado
        let response = null;
        response = Async.runSync(function(done) {
            Empleados_sql.findAll({ where: { empleado: empleadoID },
                include: [
                    { model: EmpleadosSueldo_sql, as: 'sueldos', },
                    { model: Departamentos_sql, as: 'departamento', },
                    { model: Cargos_sql, as: 'cargo', }
                ],
                // raw: true,       // aparentemente, cuando hay Includes, el 'raw' no funciona del todo bien ...
                })
                .then(function(result) { done(null, result); })
                .catch(function (err) { done(err, null); })
                .done();
        });

        if (response.error)
            throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

        let empleado = response.result[0].dataValues;

        empleado.fechaNacimiento = empleado.fechaNacimiento ? moment(empleado.fechaNacimiento).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaIngreso = empleado.fechaIngreso ? moment(empleado.fechaIngreso).add(TimeOffset, 'hours').toDate() : null;
        empleado.fechaRetiro = empleado.fechaRetiro ? moment(empleado.fechaRetiro).add(TimeOffset, 'hours').toDate() : null;

        // ----------------------------------------------------------------------------------------------------
        // collectionFS asigna un nombre diferente a cada archivo que guarda en el server; debemos
        // leer el item en el collection, para obtener el nombre 'verdadero' del archivo en el disco

        let collectionFS_file = Files_CollectionFS_Templates.findOne(fileID);

        if (!collectionFS_file)
            throw new Meteor.Error('collectionFS-no-encontrada',
            'Error inesperado: no pudimos leer el item en collectionFS, que corresponda al archivo indicado.');


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
        // leemos el contenido del archivo (word template), hacemos los cambios y guardamos en otro archivo
        let zip = new JSZip(content);
        let doc = new Docxtemplater();
        doc.loadZip(zip);

        let sueldo = empleado.sueldos && _.isArray(empleado.sueldos) && !_.isEmpty(empleado.sueldos) ?
                     lodash.orderBy(empleado.sueldos, [ 'desde' ], [ 'desc' ])[0].sueldo :
                     '--Indefinido--';

        //set the templateVariables
        doc.setData({
            nombre: empleado.nombre,
            cedula: empleado.cedula,
            fechaIngreso: moment(empleado.fechaIngreso).format("DD-MMM-YYYY"),
            fechaRetiro: empleado.fechaRetiro ? moment(empleado.fechaRetiro).format("DD-MMM-YYYY") : '--Indefinido--',

            cargo: empleado.cargo.descripcion,
            departamento: empleado.departamento.descripcion,

            salarioMonto: lodash.isNumber(sueldo) ? numeral(sueldo).format('0,0.00') : '--Indefinido--',
            // salarioLetras: "???",

            diaFechaHoy: moment(new Date()).format("DD"),
            mesFechaHoy: moment(new Date()).format("MMMM"),
            "añoFechaHoy": numeral(moment(new Date()).format("YYYY")).format('0,0'),
        });

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


        // el método regresa *antes* que la ejecución de este código que es asyncrono. Usamos Future para
        // que el método espere a que todo termine para regresar ...

        let future = new Future();

        var newFile = new FS.File();
        newFile.attachData( buf, {type: 'docx'}, function( err )
        {
            if(err)
                throw new Meteor.Error('error-grabar-archivo-collectionFS',
                    `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                     El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                     El mensaje de error recibido es: ${err.toString()}.
                    `);

            newFile.name(nombreArchivo2);
            // Collections.Builds.insert( file );

            // agregamos algunos valores al file que vamos a registrar con collectionFS
            newFile.metadata = {
                user: Meteor.user().emails[0].address,
                fecha: new Date(),
                tipo: tipoArchivo,
                nombreArchivo: nombreArchivo2,
                aplicacion: 'nomina',
                cia: ciaSeleccionada._id,
            };

            Files_CollectionFS_tempFiles.insert(newFile, function (err, fileObj) {
                // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                if (err) {
                    throw new Meteor.Error('error-grabar-archivo-collectionFS',
                        `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                         El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                         El mensaje de error recibido es: ${err.toString()}.
                        `);
                };

                // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
                // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
                // su naturaleza es asynchrona ...
                Files_CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
                    const url = fileObj.url({store: storeName});
                    future['return'](url);
                }));
            });
        });

        // Wait for async to finish before returning the result
        return future.wait();
    }
});
