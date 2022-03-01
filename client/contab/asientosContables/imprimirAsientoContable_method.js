
import numeral from 'numeral';
import moment from 'moment';
import { Monedas } from '/imports/collections/monedas';
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 
import { Companias } from '/imports/collections/companias';
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 


// import pdfMake from '/pdfMake_from_bower/imports/build/pdfmake.min.js';

let imprimirAsientoContable = ($scope, asientoContable, parametrosReporte) => {

    var docDefinicion_asientoContable = {};

    let asientosContables = [];
    asientosContables.push(asientoContable);

    // ahora ejecutamos un método que lee asientos desde sql server, a ver si el asiento tiene un
    // convertido y lo agrgamos al array; la idea es siempre imprimir ambos asientos, convertido y
    // original, cuando el usuario quiere  imprimir un asiento

    $scope.showProgress = true;

    let filter = {
        numero: asientoContable.numero,
        mes: asientoContable.mes,
        ano: asientoContable.ano,
        cia: asientoContable.cia,
        moneda: { $ne: asientoContable.moneda }
    };

    Meteor.call('asientoContable.leerByFilter.desdeSql', filter, (err, result) => {

        if (err) {
            let errorMessage = mensajeErrorDesdeMethod_preparar(err);
            
            $scope.alerts.length = 0;
            $scope.alerts.push({
                type: 'danger',
                msg: errorMessage
            });

            $scope.showProgress = false;
            $scope.$apply();
            return;
        };


        let asientosContables2 = JSON.parse(result.asientosContables);

        asientosContables2.forEach((asientoContable) => {
            // existe un convertido (o un original!); lo agregamos al array, para siempre imprimir
            // el original y su convertido (cuando lo tenga) ...
            asientosContables.push(asientoContable);
        });

        docDefinicion_asientoContable = prepararDocDefinition_asientoContable(asientosContables, parametrosReporte);
        pdfMake.createPdf(docDefinicion_asientoContable).open();

        $scope.showProgress = false;
        $scope.$apply();
    });
};


function prepararDocDefinition_asientoContable(asientosContables, parametrosReporte) {

    var docDefinition = {
        header: {},
        footer: {},
        content: [],
        styles: {},
        pageSize: 'LETTER',
        pageOrientation: 'portrait',
        pageMargins: [ 40, 80, 40, 50 ],
    };

    var companiaSeleccionada = Companias.findOne({ numero: asientosContables[0].cia });

    if (!companiaSeleccionada)
        companiaSeleccionada = { nombre: 'Indefindo', rif: 'Indefinido' };

    const fillColor = parametrosReporte && parametrosReporte.mostrarColores ? '#C0C0C0' : 'white';
    let fecha = null;

    if (parametrosReporte.mostrarFecha)
        if (parametrosReporte.mostrarFechaPropia && parametrosReporte.mostrarFechaPropia === "no")
            fecha = moment(new Date()).format('DD-MMM-YYYY h:m a');
        else
            if (parametrosReporte.fechaPropia)
                fecha = parametrosReporte.fechaPropia;

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
                            text: fecha ? fecha : '',
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
                                return (i === 0 || i === node.table.body.length) ? '#C0C0C0' : '#C0C0C0';
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

    let horizontalLine = {
        table: {
            widths: [ '100%' ],

            body: [
                [ {
                    text: '',
                    fontSize: 8,
                    bold: true,
                    alignment: 'center'
                  } ]
            ]
        },
        margin: [ 25, 15, 25, 10 ],
        layout: {
                    hLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.body.length) ? 1 : 0;
                    },
                    vLineWidth: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 1 : 0;
                    },
                    hLineColor: function(i, node) {
                            // return (i === 0 || i === node.table.body.length) ? '#C0C0C0' : 'white';
                            return (i === node.table.body.length) ? '#C0C0C0' : 'white';
                    },
                    vLineColor: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 'white' : 'white';
                    },
                    // paddingLeft: function(i) { return 10; },
                    // paddingRight: function(i, node) { return 10; },
                    // paddingTop: function(i, node) { return 10; },
                    // paddingBottom: function(i, node) { return 10; }
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
                            // return (i === 0 || i === node.table.body.length) ? '#C0C0C0' : 'white';
                            return (i === node.table.body.length) ? '#C0C0C0' : 'white';
                    },
                    vLineColor: function(i, node) {
                            return (i === 0 || i === node.table.widths.length) ? 'white' : 'white';
                    },
                    // paddingLeft: function(i) { return 10; },
                    // paddingRight: function(i, node) { return 10; },
                    // paddingTop: function(i, node) { return 10; },
                    // paddingBottom: function(i, node) { return 10; }
                }
    };

    // los asientos contables vienen en un array; la idea es que un asiento puede tener un convertido
    // corresondiente; solo entonces, vendrían 2 en el array ...

    asientosContables.forEach((asientoContable) => {
        var moneda = Monedas.findOne({ moneda: asientoContable.moneda });

        let paragraph = {};

        paragraph = {
            table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers

                // headerRows: 0,
                widths: [ '6%', '10%', '52%', '6%', '6%', '10%', '10%'],

                body: [
                    [ { text: '#', alignment: 'center', bold: true, fillColor: fillColor, },
                      { text: 'Fecha', alignment: 'center', bold: true, fillColor: fillColor, },
                      { text: 'Descripción', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Mon', alignment: 'center', bold: true, fillColor: fillColor, },
                      { text: 'Tipo', alignment: 'center', bold: true, fillColor: fillColor, },
                      { text: 'Origen', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Factor', alignment: 'right', bold: true, fillColor: fillColor, },
                    ],
                    [ { text: asientoContable.numero.toString(), alignment: 'center', bold: false, },
                      { text: moment(asientoContable.fecha).format('DD-MM-YY'), alignment: 'center', bold: false, noWrap: true, },
                      { text: asientoContable.descripcion ? asientoContable.descripcion : '', alignment: 'left', bold: false, },
                      { text: moneda.simbolo, alignment: 'center', bold: false, },
                      { text: asientoContable.tipo, alignment: 'center', bold: true, },
                      { text: asientoContable.provieneDe ? asientoContable.provieneDe : '', alignment: 'left', bold: false, },
                      { text: numeral(asientoContable.factorDeCambio).format('0,0.00'), alignment: 'right', bold: false, },
                    ],
                ]
            },
            fontSize: 8,
            margin: [5, 25, 5, 8],
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

        docDefinition.content.push(paragraph);

        paragraph = {
            table: {
                // headers are automatically repeated if the table spans over multiple pages
                // you can declare how many rows should be treated as headers

                headerRows: 1,
                widths: [ '10%', '10%', '20%', '20%', '10%', '15%', '15%' ],

                body: [
                    [ { text: '#', alignment: 'center', bold: true, fillColor: fillColor, },
                      { text: 'Cuenta', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Nombre', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Descripción', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Referencia', alignment: 'left', bold: true, fillColor: fillColor, },
                      { text: 'Debe', alignment: 'right', bold: true, fillColor: fillColor, },
                      { text: 'Haber', alignment: 'right', bold: true, fillColor: fillColor, },
                    ],
                ]
            },
            fontSize: 8,
            margin: [5, 25, 5, 8],
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

        let i = 1;
        let fillColor2 = null;

        asientoContable.partidas.forEach((partida) => {

            let cuentaContable = CuentasContables2.findOne({ id: partida.cuentaContableID });

            if (parametrosReporte && parametrosReporte.mostrarColores)
                fillColor2 = i % 2 ? 'white' : '#E7E9E8';
            else
                fillColor2 = 'white';

            var linea = [
                { text: partida.partida.toString(), alignment: 'center', bold: false, fillColor: fillColor2},
                { text: cuentaContable ? cuentaContable.cuentaEditada : 'Indefinida', alignment: 'left', bold: false, fillColor: fillColor2},
                { text: cuentaContable ? cuentaContable.descripcion : 'Indefinida', alignment: 'left', bold: false, fillColor: fillColor2},
                { text: partida.descripcion, alignment: 'left', bold: false, fillColor: fillColor2},
                { text: partida.referencia ? partida.referencia : '', alignment: 'left', bold: true, fillColor: fillColor2},
                { text: numeral(partida.debe).format('0,0.00'), alignment: 'right', bold: false, fillColor: fillColor2},
                { text: numeral(partida.haber).format('0,0.00'), alignment: 'right', bold: false, fillColor: fillColor2},
            ];

            paragraph.table.body.push(linea);
            i++;
        });

        // finalmente, construimos la linea de totales ...

        let cantidadPartidas = asientoContable.partidas.length.toString();
        let totalDebe = _.sum(asientoContable.partidas, (x) => { return x.debe; });
        let totalHaber = _.sum(asientoContable.partidas, (x) => { return x.haber; });
        let diferencia = totalDebe - totalHaber;

        fillColor2 = parametrosReporte && parametrosReporte.mostrarColores ? 'gray' : 'white';

        var linea = [
            { text: '', fillColor: fillColor2, },
            { text: "Cantidad de partidas: " + cantidadPartidas.toString(), alignment: 'left', bold: true, colSpan: 2, fillColor: fillColor2, },
            { },
            { text: diferencia ? "Diferencia: " + numeral(diferencia).format('0,0.00') : '',
                    alignment: 'left', bold: true, colSpan: 2, fillColor: fillColor2, },
            { },
            { text: numeral(totalDebe).format('0,0.00'), alignment: 'right', bold: true, fillColor: fillColor2, },
            { text: numeral(totalHaber).format('0,0.00'), alignment: 'right', bold: true, fillColor: fillColor2, },
        ];

        paragraph.table.body.push(linea);

        docDefinition.content.push(paragraph);
        docDefinition.content.push(horizontalLine);         // solo para mostrar una linea horizontal
    });



    return docDefinition;
};


AsientosContables_Methods.imprimirAsientoContable = imprimirAsientoContable;
