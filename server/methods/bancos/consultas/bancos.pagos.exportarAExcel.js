

Meteor.methods(
{
    'bancos.pagos.exportarAExcel': function (ciaSeleccionada)
    {
        let Future = Npm.require('fibers/future');
        let XlsxInjector = Meteor.npmRequire('xlsx-injector');
        let fs = Npm.require('fs');
        let path = Npm.require('path');

        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'bancos', 'bancosConsultaPagos.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'bancosConsultaPagos.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'bancos', outputFileName);

        let query = "";
        let response = null;


        let pagos = Temp_Consulta_Bancos_Pagos.find({ user: this.userId },
                                                    { sort: { fecha: 1, numeroPago: 1, }}).fetch();

        let pagosArray = [];
        let facturasArray = [];

        pagos.forEach((pago) => {
            pagosArray.push({
                compania: pago.nombreCompania,
                numero: pago.numeroPago ? pago.numeroPago : '',
                fecha: moment(pago.fecha).format("DD-MMM-YYYY"),
                moneda: pago.simboloMoneda,
                concepto: pago.concepto,
                miSu: pago.miSuFlag,
                monto: pago.monto,
                grupo: '',
                tipoReg: 0,
            })

            // para cada pago leído, leemos sus facturas asociadas
            query = `Select f.NumeroFactura as numeroFactura, f.NumeroControl as numeroControl,
                     p.NumeroPago as numeroPago,
                     f.FechaEmision as fechaEmision, f.FechaRecepcion as fechaRecepcion, f.Concepto as concepto,
                     f.MontoFacturaSinIva as montoNoImponible, f.MontoFacturaConIva as montoImponible,
                     c.Iva as iva, c.RetencionSobreIva as retencionIva, c.RetencionSobreISLR as retencionIslr,
                     c.TotalCuota as totalAPagar

                     From Pagos p Inner Join dPagos d On p.ClaveUnica = d.ClaveUnicaPago
                     Inner Join CuotasFactura c On d.ClaveUnicaCuotaFactura = c.ClaveUnica
                     Inner Join Facturas f On c.ClaveUnicaFactura = f.ClaveUnica

                     Where p.ClaveUnica = ${pago.claveUnica.toString()}`;

            response = null;
            response = Async.runSync(function(done) {
                sequelize.query(query, { type: sequelize.QueryTypes.SELECT })
                    .then(function(result) { done(null, result); })
                    .catch(function (err) { done(err, null); })
                    .done();
            });

            if (response.error)
                throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());

            response.result.forEach((factura) => {

                facturasArray.push({
                    numero: factura.numeroFactura,
                    control: factura.numeroControl,
                    numeroPago: factura.numeroPago ? factura.numeroPago : '',
                    fechaEmision: moment(factura.fechaEmision).format("DD-MMM-YYYY"),
                    fechaRecepcion: moment(factura.fechaRecepcion).format("DD-MMM-YYYY"),
                    concepto: factura.concepto,
                    montoNoImponible: factura.montoNoImponible ? factura.montoNoImponible : 0,
                    montoImponible: factura.montoImponible ? factura.montoImponible : 0,
                    iva: factura.iva ? factura.iva : 0,
                    retencionIva: factura.retencionIva ? factura.retencionIva : 0,
                    retencionIslr: factura.retencionIslr ? factura.retencionIslr : 0,
                    montoAPagar: factura.totalAPagar ? factura.totalAPagar : 0,
                    grupo: '',
                    tipoReg: 0,
                });
            })
        })

        // agregamos una linea de total de pagos
        let totalPagos = lodash.sumBy(pagosArray, 'monto');

        pagosArray.push({
            compania: '',
            numero: '',
            fecha: '',
            moneda: '',
            concepto: `Total (${pagosArray.length.toString()} pagos):`,
            miSu: '',
            monto: totalPagos,
            grupo: '*',
            tipoReg: 1,
        })

        // agregamos una linea de total de facturas
        let totalMontoNoImponible = lodash.sumBy(facturasArray, 'montoNoImponible');
        let totalMontoImponible = lodash.sumBy(facturasArray, 'montoImponible');
        let totalIva = lodash.sumBy(facturasArray, 'iva');
        let totalRetencionIva = lodash.sumBy(facturasArray, 'retencionIva');
        let totalRetencionIslr = lodash.sumBy(facturasArray, 'retencionIslr');
        let totalTotalAPagar = lodash.sumBy(facturasArray, 'montoAPagar');

        facturasArray.push({
            numero: '',
            control: '',
            numeroPago: '',
            fechaEmision: '',
            fechaRecepcion: '',
            concepto: `Total (${facturasArray.length.toString()} facturas):`,
            montoNoImponible: totalMontoNoImponible ? totalMontoNoImponible : 0,
            montoImponible: totalMontoImponible ? totalMontoImponible : 0,
            iva: totalIva ? totalIva : 0,
            retencionIva: totalRetencionIva ? totalRetencionIva : 0,
            retencionIslr: totalRetencionIslr ? totalRetencionIslr : 0,
            montoAPagar: totalTotalAPagar ? totalTotalAPagar : 0,
            grupo: '*',
            tipoReg: 1,
        })

        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            pagos: pagosArray,
            facturas: facturasArray,
        }

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);
        // Save the workbook
        workbook.writeFile(outputPath);

        let future = new Future();

        // Load an XLSX file into memory
        fs.readFile(outputPath, Meteor.bindEnvironment(function(err, content) {

            if(err)
                throw new Meteor.Error('error-leer-plantilla-excel',
                    `Error: se ha producido un error al intentar leer el <em>archivo resultado</em> de este
                     proceso en el servidor.
                     El nombre del archivo que se ha intentado leer es: ${outputPath}.
                     El mensaje de error recibido es: ${err.toString()}.
                    `);

            // el método regresa *antes* que la ejecución de este código que es asyncrono. Usamos Future para
            // que el método espere a que todo termine para regresar ...
            let newFile = new FS.File();
            let data2 = new Buffer(content);

            newFile.attachData( data2, {type: 'xlsx'}, Meteor.bindEnvironment(function( err ) {
                if(err) { 
                    throw new Meteor.Error('error-grabar-archivo-collectionFS',
                        `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                         El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                         El mensaje de error recibido es: ${err.toString()}.
                        `); 
                }
                    

                newFile.name(outputFileName);
                // Collections.Builds.insert( file );

                // agregamos algunos valores al file que vamos a registrar con collectionFS
                newFile.metadata = {
                    user: Meteor.user().emails[0].address,
                    nombreArchivo: outputFileName,
                    aplicacion: 'bancos',
                    cia: ciaSeleccionada._id,
                }

                // intentamos eliminar el archivo antes de agregarlo nuevamente ...
                Files_CollectionFS_tempFiles.remove({ 'metadata.nombreArchivo': outputFileName });

                Files_CollectionFS_tempFiles.insert(newFile, Meteor.bindEnvironment(function (err, fileObj) {
                    // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                    if (err) {
                        throw new Meteor.Error('error-grabar-archivo-collectionFS',
                            `Error: se ha producido un error al intentar grabar el archivo a un directorio en el servidor.
                             El nombre del directorio en el servidor es: ${Meteor.settings.public.collectionFS_path_tempFiles}.
                             El mensaje de error recibido es: ${err.toString()}.
                            `);
                    }

                    // tenemos que esperar que el file efectivamente se guarde, para poder acceder su url ...
                    // nótese como Meteor indica que debemos agregar un 'fiber' para correr el callback, pues
                    // su naturaleza es asynchrona ...
                    Files_CollectionFS_tempFiles.on("stored", Meteor.bindEnvironment(function (fileObj, storeName) {
                        const url = fileObj.url({store: storeName});
                        let result = {
                            linkToFile: url
                        };
                        future['return'](result);
                    }))
                }))
            }))
        }))

        return future.wait();
    }
})
