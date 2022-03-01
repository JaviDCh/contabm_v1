
import moment from 'moment';
import lodash from 'lodash';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';

// para grabar el contenido (doc word creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    bancos_movimientosBancarios_exportarExcel: function (ciaSeleccionada)
    {
        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'bancos', 'bancosMovimientosBancarios.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'bancosMovimientosBancarios.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'bancos', outputFileName);

        // leemos los saldos que el usuario acaba de filtrar ...
        let movimientosBancarios = Temp_Consulta_Bancos_MovimientosBancarios.find({ user: this.userId }).fetch();

        let items = [];
        let item = {};

        // agrupamos por moneda ...
        let itemsGroupByMoneda = lodash.groupBy(movimientosBancarios, 'moneda');

        // nótese como ordenamos el objeto por su (unica) key ...
        for (let moneda in lodash(itemsGroupByMoneda).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

            let itemsByMoneda = itemsGroupByMoneda[moneda];

            // TODO: totalizamos la moneda y escribimos un row a excel
            item = {
                moneda: moneda,
                banco: "",
                cuenta: "",

                numero: "",
                tipo: "",
                fecha: "",
                beneficiario: "",
                concepto: "",

                monto: lodash.sumBy(itemsByMoneda, 'monto'),
                grupo: '*',
                tipoReg: 3,
            };
            items.push(item);

            // agrupamos por banco ...
            let itemsGroupByMonedaBanco = lodash.groupBy(itemsByMoneda, 'banco');

            // nótese como ordenamos el objeto por su (unica) key ...
            for (let banco in lodash(itemsGroupByMonedaBanco).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

                let itemsByMonedaBanco = itemsGroupByMonedaBanco[banco];

                // TODO: totalizamos por banco y escrimos un row a excel
                item = {
                    moneda: moneda,
                    banco: banco,
                    cuenta: "",

                    numero: "",
                    tipo: "",
                    fecha: "",
                    beneficiario: "",
                    concepto: "",

                    monto: lodash.sumBy(itemsByMonedaBanco, 'monto'),
                    grupo: '**',
                    tipoReg: 2,
                };
                items.push(item);

                // agrupamos por cuenta (bancaria)
                let itemsGroupByMonedaBancoCuenta = lodash.groupBy(itemsByMonedaBanco, 'cuentaBancaria');

                // nótese como ordenamos el objeto por su (unica) key ...
                for (let cuenta in lodash(itemsGroupByMonedaBancoCuenta).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {

                    let itemsByMonedaBancoCuenta = itemsGroupByMonedaBancoCuenta[cuenta];

                    // TODO: totalizamos por cuenta y escrimos un row a excel
                    item = {
                        moneda: moneda,
                        banco: banco,
                        cuenta: cuenta,

                        numero: "",
                        tipo: "",
                        fecha: "",
                        beneficiario: "",
                        concepto: "",

                        monto: lodash.sumBy(itemsByMonedaBancoCuenta, 'monto'),
                        grupo: '***',
                        tipoReg: 1,
                    };
                    items.push(item);



                    lodash.orderBy(itemsByMonedaBancoCuenta, ['fecha', 'transaccion'], ['asc', 'asc']).
                           forEach((movBancario) => {
                        // finalmente, escribimos un row para cada mon/ano/cuenta/monOrig a Excel;
                        // estos son los rows de tipo 'detalle'
                        item = {
                            moneda: moneda,
                            banco: banco,
                            cuenta: cuenta,

                            numero: movBancario.transaccion,
                            tipo: movBancario.tipo,
                            fecha: moment(movBancario.fecha).format("DD-MMM-YYYY"),
                            beneficiario: movBancario.beneficiario,
                            concepto: movBancario.concepto,

                            monto: movBancario.monto,
                            grupo: '',
                            tipoReg: 0,
                        };
                        items.push(item);
                    });
                };
            };
        };


        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: items,
        };

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);
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
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'bancos', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
});
