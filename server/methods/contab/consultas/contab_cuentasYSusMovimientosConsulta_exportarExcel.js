
import moment from 'moment';
import lodash from 'lodash';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';
import { Monedas } from '/imports/collections/monedas';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    contab_cuentasYSusMovimientosConsulta_exportarExcel: function (desde, hasta, ciaSeleccionada, soloInfoResumen)
    {
        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'contab', 'contabConsultaCuentasYSusMovimientos.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'contabConsultaCuentasYSusMovimientos.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'contab', outputFileName);



        // leemos las cuentas contables que se registraron para la consulta ...
        let cuentasContables = Temp_Consulta_Contab_CuentasYSusMovimientos.find({ user: this.userId }).fetch();

        // agrupamos por moneda
        let movtosAgrupadosPorMoneda = lodash(cuentasContables).
                                       groupBy('simboloMoneda').
                                       orderBy(['moneda'], ['asc']).
                                       value();

        let movimientosExcel = [];
        let movimientoExcel = {};
        let cantidadMovimientos = 0;

        for (let moneda in movtosAgrupadosPorMoneda) {

            let firstItemInList = movtosAgrupadosPorMoneda[moneda][0];
            let monedaDoc = Monedas.findOne({ moneda: firstItemInList.monedaID });

            let cantidadMovimientos = _.sumBy(movtosAgrupadosPorMoneda[moneda], 'cantidadMovimientos');

            // calculamos los totales para todas las cuentas de la moneda, para mostrarlos con el encabezado
            // para la misma ...

            let sumSaldoInicial = lodash.sumBy(movtosAgrupadosPorMoneda[moneda], 'saldoInicial');
            let sumDebe = lodash.sumBy(movtosAgrupadosPorMoneda[moneda], 'debe');
            let sumHaber = lodash.sumBy(movtosAgrupadosPorMoneda[moneda], 'haber');
            let sumSaldoFinal = lodash.sumBy(movtosAgrupadosPorMoneda[moneda], 'saldoFinal');

            movimientoExcel = {
                moneda: monedaDoc ? monedaDoc.simbolo : `Moneda no definida (${moneda})`,
                cuentaContable: "",
                fecha: "",
                numero: "",

                monOrig: "",
                descripcion: monedaDoc ? monedaDoc.descripcion : `Moneda no definida (${moneda})`,
                tipo: "",
                referencia: "",
                cierreAnual: "",
                saldoInicial: sumSaldoInicial,
                debe: sumDebe,
                haber: sumHaber,
                saldoFinal: sumSaldoFinal,
                cantidadMovimientos: cantidadMovimientos,
                tipoReg: 2,
            };
            movimientosExcel.push(movimientoExcel);         // mostramos la moneda, cada vez que ésta rompe

            lodash.orderBy(movtosAgrupadosPorMoneda[moneda], ['cuentaContable'], ['asc']).forEach((cuentaContable) => {

                movimientoExcel = {
                    moneda: monedaDoc ? monedaDoc.simbolo : `Moneda no definida (${moneda})`,
                    cuentaContable: cuentaContable.cuentaContable,
                    fecha: "",
                    numero: "",

                    monOrig: "",
                    descripcion: cuentaContable.nombreCuentaContable,
                    tipo: "",
                    referencia: "",
                    cierreAnual: "",
                    saldoInicial: cuentaContable.saldoInicial,
                    debe: cuentaContable.debe,
                    haber: cuentaContable.haber,
                    saldoFinal: cuentaContable.saldoFinal,
                    cantidadMovimientos: cuentaContable.cantidadMovimientos,
                    tipoReg: 1,
                };
                movimientosExcel.push(movimientoExcel);         // mostramos la moneda, cada vez que ésta rompe

                // leemos los movimientos que corresponden a la cuenta contable específica ...
                let movimientos = Temp_Consulta_Contab_CuentasYSusMovimientos2.find(
                    { user: this.userId, registroCuentaContableID: cuentaContable._id, }).fetch();

                lodash(movimientos).orderBy(['fecha', 'numeroAsiento'], ['asc', 'asc']).
                    forEach((movimiento) => {
                    // mostramos cada movimiento de la cuenta contable ...
                    movimientoExcel = {
                        moneda: monedaDoc ? monedaDoc.simbolo : `Moneda no definida (${moneda})`,
                        cuentaContable: cuentaContable.cuentaContable,
                        fecha: moment(movimiento.fecha).format("DD-MM-YYYY"),
                        numero: movimiento.numeroAsiento,
                        monOrig: movimiento.simboloMonedaOriginal,
                        descripcion: movimiento.descripcion,
                        tipo: movimiento.tipoAsiento,
                        referencia: movimiento.referencia ? movimiento.referencia : '',
                        cierreAnual: movimiento.asientoTipoCierreAnualFlag ? 'si' : '',
                        saldoInicial: "",
                        debe: movimiento.debe,
                        haber: movimiento.haber,
                        saldoFinal: "",
                        cantidadMovimientos: 0,
                        tipoReg: 0,
                    };
                    movimientosExcel.push(movimientoExcel);
                });
            });
        };


        // Object containing attributes that match the placeholder tokens in the template
        // combinamos los registros para forma la primera página en el documento Excel

        let values = {};

        // el usuario puede indicar que no desea producir esta página
        if (soloInfoResumen) {
            movimientoExcel = {};
            movimientoExcel = {
                moneda: "",
                cuentaContable: "",
                fecha: "",
                numero: "",
                monOrig: "",
                descripcion: "",
                tipo: "",
                referencia: "",
                cierreAnual: "",
                saldoInicial: "",
                debe: "",
                haber: "",
                saldoFinal: "",
                tipoReg: 0,
            };

            let blankArray = [];
            blankArray.push(movimientoExcel);

            values = {
                fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
                nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
                fechaInicialPeriodo: desde,
                fechaFinalPeriodo: hasta,
                movtos: blankArray,
            };
        } else {
            values = {
                fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
                nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
                fechaInicialPeriodo: desde,
                fechaFinalPeriodo: hasta,
                movtos: movimientosExcel,
            };
        };

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        // ahora combinamos para formar la 2da. página en el documento Excel; nótese que el contenido es
        // el mismo, pero sin las lineas de detalle (ie: solo las cuentas sin sus movimientos)
        lodash.remove(movimientosExcel, (x) => { return x.tipoReg === 0; });

        let values2 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            fechaInicialPeriodo: desde,
            fechaFinalPeriodo: hasta,
            movtos: movimientosExcel,
        };

        sheetNumber = 2;
        workbook.substitute(sheetNumber, values2);

        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'contab', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
});
