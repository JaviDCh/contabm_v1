

// recibimos un contenido a grabar a un file (con collectionFS); intentamos grabar y, al final, regresar el url del file,
// para poder hacer un download en el client con el mismo (url) ...

// nótese que este código es ejecutado como un promise desde un meteor method; el promise es resuelto en el server *antes* de
// que meteor regrese el method. En realidad, el method no regresa el promise (object), sino el resultado del mismo ...
export const grabarDatosACollectionFS_regresarUrl = (buf, nombreArchivo, tipoArchivo, aplicacion, ciaContab, meteorUser, fileExtension) => {

  return new Promise((resolve, reject) => {

    var newFile = new FS.File();
    newFile.attachData( buf, { type: fileExtension }, function( err ) {

        if(err) {
          reject({ error: 'error-grabar-archivo-collectionFS',
                  reason: `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                           El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                           El mensaje de error recibido es: ${err.toString()}.
                          ` });
        }


        newFile.name(nombreArchivo);
        // Collections.Builds.insert( file );

        // agregamos algunos valores al file que vamos a registrar con collectionFS
        newFile.metadata = {
            user: meteorUser.emails[0].address,
            fecha: new Date(),
            tipo: tipoArchivo,
            nombreArchivo: nombreArchivo,
            aplicacion: aplicacion,
            cia: ciaContab._id,
        };

        Files_CollectionFS_tempFiles.insert(newFile, function (err, fileObj) {
            // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP
            if(err) {
              reject({ error: 'error-grabar-archivo-collectionFS',
                      reason: `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                       El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                       El mensaje de error recibido es: ${err.toString()}.
                              ` });
            }

            // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
            // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
            // su naturaleza es asynchrona ...
            Files_CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
                const url = fileObj.url({store: storeName});
                resolve(url);
            }))
        })
    })

  })
}
