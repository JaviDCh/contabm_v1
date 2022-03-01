
import moment from 'moment';
import lodash from 'lodash';
import numeral from 'numeral';
import JSZip from 'jszip';
import XlsxInjector from 'xlsx-injector';
import fs from 'fs';
import path from 'path';
import SimpleSchema from 'simpl-schema';

import { ConciliacionesBancarias_movimientosPropios, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from '/imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from '/imports/collections/bancos/conciliacionesBancarias'; 

// para grabar el contenido (doc word/excel creado en base al template) a un file (collectionFS) y regresar el url
// para poder hacer un download (usando el url) desde el client ...
import { grabarDatosACollectionFS_regresarUrl } from '/server/imports/general/grabarDatosACollectionFS_regresarUrl';

Meteor.methods(
{
    'bancos.conciliacionBancaria.exportarExcel': function (conciliacionID, 
                                                           movimientosPropiosNoEncontrados,
                                                           movimientosContablesNoEncontrados,
                                                           movimientosBancoNoEncontrados,
                                                           banco, moneda, cuentaBancaria,
                                                           cuentaContable,
                                                           ciaSeleccionada)
    {
        new SimpleSchema({
            conciliacionID: { type: String, optional: false },
            movimientosPropiosNoEncontrados: { type: String, optional: false },
            movimientosContablesNoEncontrados: { type: String, optional: false },
            movimientosBancoNoEncontrados: { type: String, optional: false },
            ciaSeleccionada: { type: Object, blackbox: true, optional: false }
        }).validate({ conciliacionID, movimientosPropiosNoEncontrados, movimientosContablesNoEncontrados, movimientosBancoNoEncontrados, ciaSeleccionada, });

        movimientosPropiosNoEncontrados = JSON.parse(movimientosPropiosNoEncontrados);
        movimientosContablesNoEncontrados = JSON.parse(movimientosContablesNoEncontrados);
        movimientosBancoNoEncontrados = JSON.parse(movimientosBancoNoEncontrados);

        // agregamos una linea de total a cada array
        let movimientosPropiosNoEncontrados2 = [];

        let lineaTotales = {
            fecha: '',
            consecutivo: '',
            numero: banco,
            tipo: moneda,
            beneficiario: cuentaBancaria,
            concepto: `${numeral(movimientosPropiosNoEncontrados.length).format('0,0')} movtos bancarios`,
            monto: lodash.sumBy(movimientosPropiosNoEncontrados, 'monto'),
            tipoReg: 1,
        };

        movimientosPropiosNoEncontrados2.push(lineaTotales);

        // en ambos arrays, las fechas vienen serializadas como strings
        movimientosPropiosNoEncontrados.forEach((x) =>
        {
            x.fecha = moment(x.fecha).format("DD-MMM-YYYY");
            x.tipoReg = 0;
            movimientosPropiosNoEncontrados2.push(x); ;
        });



        // agregamos una linea de total a cada array
        let movimientosContablesNoEncontrados2 = [];

        lineaTotales = {
            fecha: '',
            consecutivo: '',
            numero: '',
            descripcionComprobante: cuentaContable,
            descripcionPartida: `${numeral(movimientosContablesNoEncontrados.length).format('0,0')} asientos contables`,
            referencia: '',
            monto: lodash.sumBy(movimientosContablesNoEncontrados, 'monto'),
            tipoReg: 1,
        };

        movimientosContablesNoEncontrados2.push(lineaTotales);

        // en ambos arrays, las fechas vienen serializadas como strings
        let movimientoContable = {};
        movimientosContablesNoEncontrados.forEach((x) =>
        {
            movimientoContable = {
                fecha: moment(x.fecha).format("DD-MMM-YYYY"),
                consecutivo: x.consecutivo,
                numero: `${x.comprobante.toString()} - ${x.partida.toString()}`,
                descripcionComprobante: x.descripcionComprobante,
                descripcionPartida: x.descripcionPartida,
                referencia: x.referencia,
                monto: x.monto,
                tipoReg: 0,
            };

            movimientosContablesNoEncontrados2.push(movimientoContable); ;
        });



        // agregamos una linea de total a cada array
        let movimientosBancoNoEncontrados2 = [];

        lineaTotales = {
            fecha: '',
            consecutivo: '',
            numero: banco,
            tipo: moneda,
            beneficiario: cuentaBancaria,
            concepto: `${numeral(movimientosBancoNoEncontrados.length).format('0,0')} movtos bancarios`,
            conciliadoBancos: '',
            conciliadoContab: '',
            monto: lodash.sumBy(movimientosBancoNoEncontrados, 'monto'),
            tipoReg: 1,
        };

        movimientosBancoNoEncontrados2.push(lineaTotales);

        // en ambos arrays, las fechas vienen serializadas como strings
        let movimientoBanco = {};
        movimientosBancoNoEncontrados.forEach((x) =>
        {
            movimientoBanco = {};

            movimientoBanco.fecha = moment(x.fecha).format("DD-MMM-YYYY");
            movimientoBanco.tipoReg = 0;

            movimientoBanco.consecutivo = x.consecutivo;
            movimientoBanco.numero = x.numero ? x.numero : "";
            movimientoBanco.tipo = x.tipo ? x.tipo : "";
            movimientoBanco.beneficiario = x.beneficiario ? x.beneficiario : "";
            movimientoBanco.concepto = x.concepto ? x.concepto : "";
            movimientoBanco.conciliadoBancos = x.conciliado;
            movimientoBanco.conciliadoContab = x.conciliadoContab;
            movimientoBanco.monto = x.monto;

            movimientosBancoNoEncontrados2.push(movimientoBanco); ;
            movimientoBanco.concepto = x.concepto ? x.concepto : "";
        });

        // finalmente, producimos un resumen de movimientos no encontrados, de acueerdo a su tipo
        let groupByTipoArray = lodash.groupBy(movimientosPropiosNoEncontrados, 'tipo');
        let resumenPorTipoArray = [];
        let resumenPorTipo = {};

        // primiero agregamos la linea 'resumen'
        for (let key in groupByTipoArray) {
            resumenPorTipo = {
                tipo: key,
                cantidad: groupByTipoArray[key].length,
                monto: lodash.sumBy(groupByTipoArray[key], 'monto'),
                tipoReg: 0,
            };
            resumenPorTipoArray.push(resumenPorTipo);
        };

        // agregamos una linea de totales ...
        resumenPorTipo = {
            tipo: "",
            cantidad: movimientosPropiosNoEncontrados.length,
            monto: lodash.sumBy(movimientosPropiosNoEncontrados, 'monto'),
            tipoReg: 1,
        };
        resumenPorTipoArray.push(resumenPorTipo);


        // ahora producimos el resumen, pero para movimientos contables
        groupByTipoArray = [];
        groupByTipoArray = lodash.groupBy(movimientosContablesNoEncontrados, (x) => { return x.monto >= 0 ? 'DB' : 'CR'; });
        let resumenPorTipo_contab_Array = [];
        resumenPorTipo = {};

        // primiero agregamos la linea 'resumen'
        for (let key in groupByTipoArray) {
            resumenPorTipo = {
                tipo: key,
                cantidad: groupByTipoArray[key].length,
                monto: lodash.sumBy(groupByTipoArray[key], 'monto'),
                tipoReg: 0,
            };
            resumenPorTipo_contab_Array.push(resumenPorTipo);
        };

        // agregamos una linea de totales ...
        resumenPorTipo = {
            tipo: "",
            cantidad: movimientosContablesNoEncontrados.length,
            monto: lodash.sumBy(movimientosContablesNoEncontrados, 'monto'),
            tipoReg: 1,
        };
        resumenPorTipo_contab_Array.push(resumenPorTipo);


        // ----------------------------------------------------------------------------------------------------
        // obtenemos el directorio en el server donde están las plantillas (guardadas por el usuario mediante collectionFS)
        // nótese que usamos un 'setting' en setting.json (que apunta al path donde están las plantillas)
        // nótese que la plantilla (doc excel) no es agregada por el usuario; debe existir siempre con el
        // mismo nombre ...
        let templates_DirPath = Meteor.settings.public.collectionFS_path_templates;
        let temp_DirPath = Meteor.settings.public.collectionFS_path_tempFiles;

        let templatePath = path.join(templates_DirPath, 'bancos', 'bancosConciliacionBancaria.xlsx');
        // ----------------------------------------------------------------------------------------------------
        // nombre del archivo que contendrá los resultados ...
        let userID2 = Meteor.user().emails[0].address.replace(/\./g, "_");
        userID2 = userID2.replace(/\@/g, "_");
        let outputFileName = 'bancosConciliacionBancaria.xlsx'.replace('.xlsx', `_${userID2}.xlsx`);
        let outputPath  = path.join(temp_DirPath, 'bancos', outputFileName);

        // Object containing attributes that match the placeholder tokens in the template
        let values = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: movimientosPropiosNoEncontrados2,
        };

        let values2 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: movimientosBancoNoEncontrados2,
        };

        let values3 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: lodash.orderBy(resumenPorTipoArray, ['tipoReg', 'tipo'], ['desc', 'asc']),
            itemsContab: lodash.orderBy(resumenPorTipo_contab_Array, ['tipoReg', 'tipo'], ['desc', 'asc']),
        };

        let values4 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: lodash.orderBy(movimientosContablesNoEncontrados2, ['consecutivo'], ['asc']),
        };

        let listaMovPropios = ConciliacionesBancarias_movimientosPropios.find({ conciliacionID: conciliacionID }, { sort: { consecutivo: 1 }}).fetch(); 
        for (let item of listaMovPropios) { 
            item.consecutivoMovBanco = item.consecutivoMovBanco ? item.consecutivoMovBanco : ""; 
        }

        let values5 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: listaMovPropios,
        };

        let listaMovContab = ConciliacionesBancarias_movimientosCuentaContable.find({ conciliacionID: conciliacionID }, { sort: { consecutivo: 1 }}).fetch(); 
        for (let item of listaMovContab) { 
            item.consecutivoMovBanco = item.consecutivoMovBanco ? item.consecutivoMovBanco : ""; 
        }

        let values6 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: listaMovContab,
        };

        let listaMovBanco = ConciliacionesBancarias_movimientosBanco.find({ conciliacionID: conciliacionID }, { sort: { consecutivo: 1 }}).fetch(); 
        for (let item of listaMovBanco) { 
            item.numero = item.numero ? item.numero : ""; 
            item.tipo = item.tipo ? item.tipo : ""; 
            item.concepto = item.concepto ? item.concepto : ""; 
            item.beneficiario = item.beneficiario ? item.beneficiario : ""; 

            item.consecutivoMovPropio = item.consecutivoMovPropio ? item.consecutivoMovPropio : ""; 
            item.consecutivoMovContab = item.consecutivoMovContab ? item.consecutivoMovContab : ""; 
        }

        let values7 = {
            fechaHoy: moment(new Date()).format("DD-MMM-YYYY"),
            nombreCiaContabSeleccionada: ciaSeleccionada.nombre,
            items: listaMovBanco,
        };



        // Open a workbook
        let workbook = new XlsxInjector(templatePath);

        let sheetNumber = 1;
        workbook.substitute(sheetNumber, values);

        sheetNumber = 2;
        workbook.substitute(sheetNumber, values2);

        sheetNumber = 3;
        workbook.substitute(sheetNumber, values3);

        sheetNumber = 4;
        workbook.substitute(sheetNumber, values4);

        sheetNumber = 5;
        workbook.substitute(sheetNumber, values5);      // página para mostrar una lista con los movimientos propios 

        sheetNumber = 6;
        workbook.substitute(sheetNumber, values6);      // página para mostrar una lista con los movimientos contables 

        sheetNumber = 7;
        workbook.substitute(sheetNumber, values7);      // página para mostrar una lista con los movimientos recibidos desde el banco  

        // Save the workbook
        workbook.writeFile(outputPath);

        // leemos el archivo que resulta de la instrucción anterior; la idea es pasar este 'nodebuffer' a la función que sigue para:
        // 1) grabar el archivo a collectionFS; 2) regresar su url (para hacer un download desde el client) ...
        let buf = fs.readFileSync(outputPath);      // no pasamos 'utf8' como 2do. parámetro; readFile regresa un buffer

        // el meteor method *siempre* resuelve el promise *antes* de regresar al client; el client recibe el resultado del
        // promise y no el promise object; en este caso, el url del archivo que se ha recién grabado (a collectionFS) ...

        // nótese que en el tipo de plantilla ponemos 'no aplica'; la razón es que esta plantilla no es 'cargada' por el usuario y de las
        // cuales hay diferentes tipos (islr, iva, facturas, cheques, ...). Este tipo de plantilla es para obtener algún tipo de reporte
        // en excel y no tiene un tipo definido ...
        return grabarDatosACollectionFS_regresarUrl(buf, outputFileName, 'no aplica', 'bancos', ciaSeleccionada, Meteor.user(), 'xlsx');
    }
});
