
import moment from 'moment';
import numeral from 'numeral';
import { Monedas } from '/imports/collections/monedas';

let imprimirListadoAsientosContables = (asientosContables, companiaContab, opciones) => {

    var docDefinicion_asientoContable = {};

    docDefinicion_asientoContable = prepararDocDefinition_asientoContable(asientosContables, companiaContab, opciones);

    if (opciones.saveToDisk)
        pdfMake.createPdf(docDefinicion_asientoContable).download('asientosContables_consulta.pdf');
    else
        pdfMake.createPdf(docDefinicion_asientoContable).open();
};


function prepararDocDefinition_asientoContable(asientosContables, companiaSeleccionada, opciones) {

    let ordenarListadoPorFechaRegistro = opciones.ordenarListadoPorFechaRegistro;

    var docDefinition = {
        header: {},
        footer: {},
        content: [],
        styles: {},
        pageSize: 'LETTER',
        pageOrientation: 'portrait',
        pageMargins: [ 20, 80, 20, 50 ],
    };

    if (!companiaSeleccionada)
        companiaSeleccionada = { nombre: 'Indefindo', rif: 'Indefinido' };

    docDefinition.header = function(currentPage, pageCount) {
        return {
            table: {
                // aparentemente, headers y footers *solo* aceptan 1 linea (???); usamos un table, aunque sea de 1 solo row,
                // para que se muestre un border en el header y footer ...
                headerRows: 1,
                widths: [ '30%', '40%', '30%' ],

                body: [
                    [
                        {
                            text: 'Contab',
                            fontSize: 8,
                            bold: true,
                            italics: true,
                            alignment: 'left'
                        },
                        {
                            text: 'Asientos Contables',
                            fontSize: 12,
                            bold: true,
                            italics: false,
                            alignment: 'center'
                        },
                        {
                            text: `pag ${currentPage.toString()} de ${pageCount.toString()}`,
                            fontSize: 8,
                            bold: true,
                            italics: false,
                            alignment: 'right'
                        }
                    ],
                    [
                        {
                            text: companiaSeleccionada.nombre,
                            fontSize: 8,
                            bold: true,
                            italics: true,
                            alignment: 'left',
                            colSpan: 2
                        },
                        { },
                        {
                            text: moment(new Date()).format('DD-MMM-YYYY h:m a'),
                            fontSize: 8,
                            bold: true,
                            italics: false,
                            alignment: 'right'
                        }
                    ],
                ]
            },
            margin: [ 25, 35, 25, 0 ],
            layout: {
                        hLineWidth: function(i, node) {
                                return (i === 2) ? 1 : 0;
                        },
                        vLineWidth: function(i, node) {
                                return (i === 0 || i === node.table.widths.length) ? 1 : 1;
                        },
                        hLineColor: function(i, node) {
                                return (i === 0 || i === node.table.body.length) ? '#697DA9' : '#697DA9';
                        },
                        vLineColor: function(i, node) {
                                return (i === 0 || i === node.table.widths.length) ? 'white' : 'white';
                        },
                        // paddingLeft: function(i) { return 10; },
                        // paddingRight: function(i, node) { return 10; },
                        // paddingTop: function(i, node) { return 10; },
                        // paddingBottom: function(i, node) { return 10; }
                    }
        }
    };


    docDefinition.footer = {
        table: {
            // aparentemente, headers y footers *solo* aceptan 1 linea (???); usamos un table, aunque sea de 1 solo row,
            // para que se muestre un border en el header y footer ...
            headerRows: 1,
            widths: [ '100%' ],

            body: [
                [
                    {
                        text: '',
                        fontSize: 8,
                        bold: true,
                        alignment: 'center'
                    } ]
            ]
        },
        margin: [ 25, 15, 25, 35 ],
        layout: {
                    hLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? 1 : 0;
                    },
                    vLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 1 : 0;
                    },
                    hLineColor: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? '#697DA9' : '#697DA9';
                    },
                    vLineColor: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? '#909090' : '#E8E8E8';
                    },
                    // paddingLeft: function(i) { return 10; },
                    // paddingRight: function(i, node) { return 10; },
                    // paddingTop: function(i, node) { return 10; },
                    // paddingBottom: function(i, node) { return 10; }
                }
    };

    let paragraph = {};

    paragraph = {
        table: {
            // headers are automatically repeated if the table spans over multiple pages
            // you can declare how many rows should be treated as headers

            headerRows: 1,
            widths: [ '6%', '10%', '8%', '8%', '17%', '17%', '8%', '13%', '13%', ],

            body: [
                [ { text: '#', alignment: 'center', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Fecha', alignment: 'center', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Tipo', alignment: 'left', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Lineas', alignment: 'center', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Total debe', alignment: 'right', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Total haber', alignment: 'right', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Origen', alignment: 'left', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Ingreso', alignment: 'center', bold: true, fillColor: '#C0C0C0', },
                  { text: 'Ult act', alignment: 'center', bold: true, fillColor: '#C0C0C0', },
                ],
            ]
        },
        fontSize: 6,
        margin: [20, 10, 20, 8],
        layout: {
                    hLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? 1 : 1;
                    },
                    vLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 1 : 1;
                    },
                    hLineColor: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? '#909090' : '#E8E8E8';
                    },
                    vLineColor: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? '#909090' : '#E8E8E8';
                    }
                }
    };


    asientosContables_groupByMoneda = _.groupBy(asientosContables, (x) => { return x.moneda; });

    for (let monedaKey in asientosContables_groupByMoneda) {

        let moneda = Monedas.findOne({ moneda: parseInt(monedaKey) });      // groupBy convierte el key en un string ...

        // encabezado por moneda
        var linea = [
            { text: moneda.descripcion, alignment: 'left', bold: true, colSpan: 9, fillColor: '#E0E0E0', margin: [10, 0, 0, 0], },
            { }, { }, { }, { }, { }, { }, { }, { },
        ];
        paragraph.table.body.push(linea);

        let cantidadRegistros_moneda = 0;
        let cantidadLineas_moneda = 0;
        let totalDebe_moneda = 0;
        let totalHaber_moneda = 0;

        let i = 1;

        // nótese como ordenamos los asientos, dependiendo de la opción que indica el usuario
        let sortedItems = [];

        if (!ordenarListadoPorFechaRegistro)
            sortedItems = _.sortBy(asientosContables_groupByMoneda[monedaKey], ['fecha', 'numero']);
        else
            sortedItems = _.sortBy(asientosContables_groupByMoneda[monedaKey], ['ultAct', 'fecha', 'numero']);


        sortedItems.forEach((asiento) => {
            let fillColor = i % 2 ? 'white' : '#E7E9E8';

            var linea = [
                { text: asiento.numero.toString(), alignment: 'center', bold: false, fillColor: fillColor},
                { text: moment(asiento.fecha).format('DD-MM-YY'), alignment: 'center', bold: false, fillColor: fillColor},
                { text: asiento.tipo, alignment: 'left', bold: false, fillColor: fillColor},
                { text: asiento.cantidadPartidas.toString(), alignment: 'center', bold: false, fillColor: fillColor},
                { text: numeral(asiento.totalDebe).format('0,0.00'), alignment: 'right', bold: false, fillColor: fillColor},
                { text: numeral(asiento.totalHaber).format('0,0.00'), alignment: 'right', bold: false, fillColor: fillColor},
                { text: asiento.provieneDe ? asiento.provieneDe : '', alignment: 'left', bold: true, fillColor: fillColor},
                { text: moment(asiento.ingreso).format('DD-MM-YY h:m'), alignment: 'center', bold: false, fillColor: fillColor},
                { text: moment(asiento.ultAct).format('DD-MM-YY h:m'), alignment: 'center', bold: false, fillColor: fillColor},
            ];

            paragraph.table.body.push(linea);
            i++;

            cantidadRegistros_moneda++;
            cantidadLineas_moneda += asiento.cantidadPartidas ? asiento.cantidadPartidas : 0;
            totalDebe_moneda += asiento.totalDebe ? asiento.totalDebe : 0;
            totalHaber_moneda += asiento.totalHaber ? asiento.totalHaber : 0;
        });

        // subtotal para la moneda ...
        var linea = [
            { text: `total para ${moneda.simbolo} (${cantidadRegistros_moneda.toString()}):`,
              alignment: 'left', bold: true, colSpan: 3, fillColor: 'gray', margin: [10, 0, 0, 0],
            },
            { }, { },
            { text: cantidadLineas_moneda.toString(),
              alignment: 'center', bold: true, colSpan: 1, fillColor: 'gray',
            },
            { text: numeral(totalDebe_moneda).format('0,0.00'),
              alignment: 'right', bold: true, colSpan: 1, fillColor: 'gray',
            },
            { text: numeral(totalHaber_moneda).format('0,0.00'),
              alignment: 'right', bold: true, colSpan: 1, fillColor: 'gray',
            },
            { text: '', colSpan: 3, fillColor: 'gray', },
            { }, { },
        ];
        paragraph.table.body.push(linea);
    };


    // finalmente, construimos la linea de totales ...

    // let cantidadPartidas = asientoContable.partidas.length.toString();
    // let totalDebe = _.sum(asientoContable.partidas, (x) => { return x.debe; });
    // let totalHaber = _.sum(asientoContable.partidas, (x) => { return x.haber; });
    // let diferencia = totalDebe - totalHaber;
    //
    // var linea = [
    //     { text: '', fillColor: 'gray', },
    //     { text: "Cantidad de partidas: " + cantidadPartidas.toString(), alignment: 'left', bold: true, colSpan: 2, fillColor: 'gray', },
    //     { },
    //     { text: diferencia ? "Diferencia: " + numeral(diferencia).format('0,0.00') : '',
    //             alignment: 'left', bold: true, colSpan: 2, fillColor: 'gray', },
    //     { },
    //     { text: numeral(totalDebe).format('0,0.00'), alignment: 'right', bold: true, fillColor: 'gray', },
    //     { text: numeral(totalHaber).format('0,0.00'), alignment: 'right', bold: true, fillColor: 'gray', },
    // ];
    //
    // paragraph.table.body.push(linea);

    docDefinition.content.push(paragraph);

    return docDefinition;
};



AsientosContables_Methods.imprimirListadoAsientosContables = imprimirListadoAsientosContables;
