
import lodash from 'lodash';
import moment from 'moment';

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
    contab_codificacionesContablesConsulta_exportarExcel: function (subTituloConsulta,
                                                                    codificacionContable,
                                                                    ciaSeleccionada)
    {
        check(ciaSeleccionada, Object);

        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'contab', 'contabConsultaCodificacionesContables.xlsx');

        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'contabConsultaCodificacionesContables.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'contab', outputFileName);

        // leemos los saldos que el usuario acaba de filtrar ...
        let codificacionesContables = CodificacionesContables_movimientos.find(
            {
                codificacionContable_ID: codificacionContable._id,
                user: this.userId,
            }).fetch();


        // agregamos los niveles 'previos' (grupos) al collection; ejemplo: si un código es:
        // 2 01 01 001, agregamos: 2, 2 01 y 2 01 01. Estos son los niveles 'previos' al código
        // y deben formar parte del registro para agrupar por ellos ...

        codificacionesContables.forEach((x) => {
            let niveles = x.codigoContable.split(' ');
            // grabamos hasta el penúltimo
            let nivelAnterior = "";
            let cantidadNiveles = 0;
            for (let i = 0; i <= niveles.length - 2; i++) {
                let nivel = i + 1;
                // cada nivel se forma agregando a él mismo los anteriores (ej: 2, 2 01, 2 01 01, 2 01 01 01, ...)
                x[`nivel_${nivel.toString()}`] = nivelAnterior ? nivelAnterior + " " + niveles[i].toString() :
                                                                niveles[i].toString();
                nivelAnterior = x[`nivel_${nivel.toString()}`];
                cantidadNiveles++;
            };

            // para cada item en el array, completamos niveles 'parent' hasta que hayan 5
            for (let i = cantidadNiveles + 1; i <= 5; i++) {
                x[`nivel_${i.toString()}`] = "*xyzxyz*";        // no existe el nivel, lo agregamos (siempre hasta 5)
            };
        });

        // ahora que agregamos los 'niveles previos' (de grupo) al collection, construimos un array de 'keys'
        // para agrupar por ellas ...
        let keysArray = ['simboloMoneda'];

        for (let i = 1; i <= 5; i++) {
            keysArray.push(`nivel_${i.toString()}`);
        };

        // agregamos el resto de los keys ...
        keysArray.push('codigoContable');
        keysArray.push('cuentaContable');

        // finalmente, agrupamos todo el array de acuerdo a sus claves (keys)
        let groupByArray = Global_Methods.groupByMulti(codificacionesContables, keysArray);

        let items = [];
        let numeroGrupo = 0;

        // recorremos el objeto que resultó de agrupar por todas las claves arriba ...
        for (let moneda in lodash(groupByArray).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
            let itemsBy_Moneda = groupByArray[moneda];
            agregarResumen_moneda(items, codificacionesContables, moneda);

            for (let nivel_1 in lodash(itemsBy_Moneda).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                let itemsBy_MonedaN1 = itemsBy_Moneda[nivel_1];      // siempre existirá un nivel 1 (total)
                agregarResumen_nivelTotal1(items, codificacionesContables, moneda, nivel_1)

                for (let nivel_2 in lodash(itemsBy_MonedaN1).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                    let itemsBy_MonedaN1N2 = itemsBy_MonedaN1[nivel_2];
                    if (nivel_2 != "*xyzxyz*") {
                        agregarResumen_nivelTotal2(items, codificacionesContables, moneda, nivel_1, nivel_2);
                    };

                    for (let nivel_3 in lodash(itemsBy_MonedaN1N2).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                        let itemsBy_MonedaN1N2N3 = itemsBy_MonedaN1N2[nivel_3];
                        if (nivel_3 != "*xyzxyz*") {
                            agregarResumen_nivelTotal3(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3);
                        };

                        for (let nivel_4 in lodash(itemsBy_MonedaN1N2N3).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                            let itemsBy_MonedaN1N2N3N4 = itemsBy_MonedaN1N2N3[nivel_4];
                            if (nivel_4 != "*xyzxyz*") {
                                agregarResumen_nivelTotal4(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4);
                            };

                            for (let nivel_5 in lodash(itemsBy_MonedaN1N2N3N4).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                let itemsBy_MonedaN1N2N3N4N5 = itemsBy_MonedaN1N2N3N4[nivel_5];
                                if (nivel_5 != "*xyzxyz*") {
                                    agregarResumen_nivelTotal5(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4, nivel_5);
                                };

                                for (let codigo in lodash(itemsBy_MonedaN1N2N3N4N5).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                    let itemsBy_MonedaN1N2N3N4N5Codigo = itemsBy_MonedaN1N2N3N4N5[codigo];
                                    agregarResumen_codigoContable(items, codificacionesContables, moneda, nivel_1, nivel_2, nivel_3, nivel_4, nivel_5, codigo);

                                    for (let cuenta in lodash(itemsBy_MonedaN1N2N3N4N5Codigo).map((v, k) => [k, v]).sortBy(0).fromPairs().value()) {
                                        let itemsBy_MonedaN1N2N3N4N5CodigoCuenta = itemsBy_MonedaN1N2N3N4N5Codigo[cuenta];
                                        agregarResumen_cuentaContable(items, itemsBy_MonedaN1N2N3N4N5CodigoCuenta);
                                    };
                                };
                            };
                        };
                    };
                };
            };
        };


        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        // Open a workbook
        let workbook = new XlsxInjector(templatePath);
        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        // existen 3 hojas; eliminamos movimientos (asientos) para la 2da. y cuentas contables para la 3ra.
        // sheet #2
        lodash.remove(items, (x) => { return x.tipoReg == 0; });    // eliminamos los movimientos (asientos)
        values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        sheetNumber = 2;
        workbook.substitute(sheetNumber, values);

        // sheet #3
        lodash.remove(items, (x) => { return x.tipoReg == 1; });        // eliminamos las cuentas contables
        values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            subTitulo: subTituloConsulta,
            items: items,
        };

        sheetNumber = 3;
        workbook.substitute(sheetNumber, values);


        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recive el resultado del
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'contab', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
})


// ------------------------------------------------------------------------------------------
// las funciones que siguen se ejecutan cuando rompe cada grupo; cada una, simplemente,
// agrega un item al array que luego será escrito a Excel. Cada vez que rompe un grupo,
// se agrega un resumen (1 row) a Excel. Cuando llegamos al último grupo, se escriben
// a Excel todos sus items (un row por item)

function agregarResumen_moneda(items, collection, moneda) {

    let subCollection = lodash.filter(collection, (x) => { return x.simboloMoneda == moneda; });
    let firstItem = subCollection[0];
    let descripcion = Monedas.findOne({ simbolo: firstItem.simboloMoneda });

    let item = {
            codigo: firstItem.simboloMoneda,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '********',
            tipoReg: 8,
    };
    items.push(item);
};

function agregarResumen_nivelTotal1(items, collection, moneda, n1) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n1
        });

    let item = {
            codigo: firstItem.nivel_1,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '*******',
            tipoReg: 7,
    };
    items.push(item);
};

function agregarResumen_nivelTotal2(items, collection, moneda, n1, n2) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n2
        });

    let item = {
            codigo: firstItem.nivel_2,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '******',
            tipoReg: 6,
    };
    items.push(item);
};

function agregarResumen_nivelTotal3(items, collection, moneda, n1, n2, n3) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n3
        });

    let item = {
            codigo: firstItem.nivel_3,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '*****',
            tipoReg: 5,
    };
    items.push(item);
};

function agregarResumen_nivelTotal4(items, collection, moneda, n1, n2, n3, n4) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3 && x.nivel_4 == n4;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n4
        });

    let item = {
            codigo: firstItem.nivel_4,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '****',
            tipoReg: 4,
    };
    items.push(item);
};

function agregarResumen_nivelTotal5(items, collection, moneda, n1, n2, n3, n4, n5) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3
                                         && x.nivel_4 == n4 && x.nivel_5 == n5;
    });
    let firstItem = subCollection[0];
    let descripcion = CodificacionesContables_codigos.findOne(
        {
            codificacionContable_ID: firstItem.codificacionContable_ID,
            codigo: n5
        });

    let item = {
            codigo: firstItem.nivel_5,
            nombreCodigo: descripcion ? descripcion.descripcion : "Indefinido",

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '***',
            tipoReg: 3,
    };
    items.push(item);
};

function agregarResumen_codigoContable(items, collection, moneda, n1, n2, n3, n4, n5, codigo) {

    let subCollection = lodash.filter(collection, (x) => {
        return x.simboloMoneda == moneda && x.nivel_1 == n1 && x.nivel_2 == n2 && x.nivel_3 == n3
                                         && x.nivel_4 == n4 && x.nivel_5 == n5 && x.codigoContable == codigo;
    });
    let firstItem = subCollection[0];

    let item = {
            codigo: firstItem.codigoContable,
            nombreCodigo: firstItem.nombreCodigoContable,

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(subCollection, 'saldoInicial'),
            debe: lodash.sumBy(subCollection, 'debe'),
            haber: lodash.sumBy(subCollection, 'haber'),
            saldo: lodash.sumBy(subCollection, 'saldo'),
            cantMovtos: subCollection.length,

            grupo: '**',
            tipoReg: 2,
    };
    items.push(item);
};

function agregarResumen_cuentaContable(items, collection) {
    let firstItem = collection[0];
    let item = {
            codigo: firstItem.cuentaContable,
            nombreCodigo: firstItem.nombreCuentaContable,

            fecha:  "",
            monedaOriginal: "",
            numeroComprobante: "",
            descripcion: "",
            referencia: "",

            saldoInicial: lodash.sumBy(collection, 'saldoInicial'),
            debe: lodash.sumBy(collection, 'debe'),
            haber: lodash.sumBy(collection, 'haber'),
            saldo: lodash.sumBy(collection, 'saldo'),
            cantMovtos: collection.length,

            grupo: '*',
            tipoReg: 1,
    };
    items.push(item);

    lodash.orderBy(collection, ['fecha'], ['asc']).
           forEach((movimiento) => {
        // finalmente, escribimos un row para cada mon/ano/cuenta/monOrig a Excel;
        // estos son los rows de tipo 'detalle'
        item = {
            codigo: "",
            nombreCodigo: "",

            fecha: moment(movimiento.fecha).format("DD-MM-YYYY"),
            monedaOriginal: movimiento.simboloMonedaOriginal,
            numeroComprobante: movimiento.comprobante ? movimiento.comprobante : 0,
            descripcion: movimiento.descripcion,
            referencia: movimiento.referencia ? movimiento.referencia : "",

            saldoInicial: movimiento.saldoInicial,
            debe: movimiento.debe,
            haber: movimiento.haber,
            saldo: movimiento.saldo,
            cantMovtos: 0,
            grupo: '',
            tipoReg: 0,
        };
        items.push(item);
    });
};
