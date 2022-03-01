
import XLSX from "XLSX";
import lodash from "lodash";
import moment from "moment";
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { mensajeErrorDesdeMethod_preparar } from '/client/imports/clientGlobalMethods/mensajeErrorDesdeMethod_preparar'; 

angular.module("contabm").controller('BancosConciliacionBancariaImportarDesdeExcel_Controller',
['$scope', '$modalInstance', '$modal', '$meteor', 'conciliacionBancaria', 'companiaSeleccionada',
function ($scope, $modalInstance, $modal, $meteor, conciliacionBancaria, companiaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    };

    // para reportar el progreso de la tarea en la página
    $scope.processProgress = {
        current: 0,
        max: 0,
        progress: 0
    };

    $scope.ok = function () {
        $modalInstance.close("Ok");
    };

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    };

    $scope.companiaSeleccionada = companiaSeleccionada;

    // para leer el archivo seleccionado mediante el Input ...
    let userSelectedFile = null;
    $scope.uploadFile = function(files) {
      userSelectedFile = files[0];
    };

    // para validar que la fecha sea un Date correcto
    let ValidDateFormats = [ "DD-MM-YYYY", "DD-MM-YY" ];

    // para cargar el array de lineas desde el documento Excel
    let lineasLeidasDesdeExcel = [];
    $scope.form = {};

    $scope.submit_TratarFilesForm = function () {

          $scope.submitted = true;

          $scope.alerts.length = 0;

          if (!userSelectedFile) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: `Aparentemente, Ud. no ha seleccionado un archivo (Excel) desde su PC aún.<br />
                        Ud. debe seleccionar un archivo (Excel) antes de intentar ejecutar este proceso.`
              });

              return;
          };

          if ($scope.form.tratarFilesForm.$valid) {
              $scope.submitted = false;
              $scope.form.tratarFilesForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

              $scope.showProgress = true;

              let f = userSelectedFile;

              var reader = new FileReader();
              var name = f.name;

              let lineasExcelLeidas = 0;
              let lineasExcelObviadas = 0;

              // si en el documento Excel viene el día y no la fecha, usamos el mes y año de esta fecha para construir la fecha de
              // cada movimiento que viene del banco ...
              let desde = conciliacionBancaria.desde;

              reader.onload = function(e) {
                    let data = e.target.result;

                    let workbook = XLSX.read(data, {type: 'binary'});
                    let first_sheet_name = workbook.SheetNames[0];

                    /* Get worksheet */
                    var worksheet = workbook.Sheets[first_sheet_name];

                    /* DO SOMETHING WITH workbook HERE */
                    let lineasEnDocumentoExcel = XLSX.utils.sheet_to_json(worksheet, {raw: true});

                    lineasLeidasDesdeExcel.length = 0;

                    lineasEnDocumentoExcel.forEach((linea) => {

                        let numero = linea['número'] ? linea['número'].toString() : "";
                        let tipo = linea['tipo'] ? linea['tipo'] : null;
                        let fecha = linea['fecha'] ? linea['fecha'] : null;
                        let beneficiario = linea['beneficiario'] ? linea['beneficiario'] : null;
                        let concepto = linea['concepto'] ? linea['concepto'] : null;
                        let monto = linea['monto'] ? linea['monto'] : null;
                        let dia = linea['día'] ? linea['día'] : null;
                        let creditos = linea['créditos'] ? linea['créditos'] : null;
                        let debitos = linea['débitos'] ? linea['débitos'] : null;

                        // intentamos convertir el monto y la fecha a valores adecuados
                        // Excel regresa un entero, cantidad de días desde 1.900, para las fechas
                        if (lodash.isInteger(fecha)) {
                            fecha = FuncionesGlobales.getJsDateFromExcel(fecha);
                            // aparentemte, si quitamos la hora a la fecha anterior, queda la fecha
                            // del día en forma adecuada; lo hacemos con moment
                            fecha = moment(moment(fecha).format("YYYY-MM-DD"), "YYYY-MM-DD").toDate();
                        }

                        // si la fecha no vino como un entero (ej: 40603), tal vez sea un verdadero date
                        // pero como un string ...
                        if (!lodash.isDate(fecha) && moment(fecha, ValidDateFormats, true).isValid()) {
                            // la fecha no es válida pero es un string válido
                            fecha = moment(fecha).toDate();
                        }

                        // si el campo fecha no vino en el doc Excel, pero si un campo Día, construimos la fecha a partir
                        // de él
                        if (!fecha && dia) {
                            // día debe ser un entero de 1 a 30
                            if (dia && lodash.isInteger(dia) && dia >= 1 && dia <= 31 ) {
                                try {
                                    fecha = new Date(desde.getFullYear(), desde.getMonth(), dia);
                                } catch (ex) {
                                    $scope.alerts.length = 0;
                                    $scope.alerts.push({
                                        type: 'danger',
                                        msg: `Error al intentar construir una fecha usando el día ${dia.toString()} y la fecha
                                              de inicio de la conciliación.<br /><br />
                                              Probablemente el día no corresponde en forma adecuada al mes en la
                                              fecha ${moment(desde).format("DD-MM-YYYY")}.<br />
                                              Por favor revise esta situación en el documento Excel que contiene los movimientos bancarios
                                              registrados por el banco.
                                              `
                                    });

                                    return;
                                }
                            }
                        }

                        // por ahora, el monto debe siempre venir en español: 1000,75 o 1.000,75 ...
                        // pero lo convertimos a un Number válido en JS ...
                        if (monto) {
                            if (!lodash.isFinite(monto)) {
                                monto = monto.toString().trim();
                                monto = monto.replace(/\./gi, "");
                                monto = monto.replace(",", ".");    // ahora debe ser: 10.7, 100.75, 1058.15, etc.
                                // el monto puede traer el signo luego del número; nos protegemos de esta posibilidad ... 
                                if (monto.indexOf("-") >= 0 || monto.indexOf("‐") >= 0) { 
                                    monto = monto.replace("-", "");
                                    monto = monto.replace("‐", "");     // este es un caracter muy raro que se ve como un "-" pero es otra cosa 
                                    monto = "-" + monto;                // nos aseguramos de poner el signo siempre adelante (así -100 y no 100-)
                                }
                                // validamos que el string sea un Number
                                if (!isNaN(parseFloat(monto)) && isFinite(monto)) {
                                    monto = parseFloat(monto);
                                }
                            }
                        }

                        // nótese como también hacemos un parsing a los campos créditos y débitos; la idea es usar estos montos solo
                        // si vienen y no viene el monto
                        if (creditos) {
                            if (!lodash.isFinite(creditos)) {
                                creditos = creditos.toString().trim();
                                creditos = creditos.replace("â€", "");
                                creditos = creditos.replace(/\./gi, "");
                                creditos = creditos.replace("-", "");
                                creditos = creditos.replace("‐", "");     // este es un caracter muy raro que se ve como un "-" pero es otra cosa 
                                creditos = creditos.replace(",", ".");    // ahora debe ser: 10.7, 100.75, 1058.15, etc.
                                // validamos que el string sea un Number
                                if (!isNaN(parseFloat(creditos)) && isFinite(creditos)) {
                                    creditos = parseFloat(creditos);
                                }
                            }
                        }

                        if (debitos) {
                            if (!lodash.isFinite(debitos)) {
                                // el monto es un string; lo convetimos a un número negativo
                                debitos = debitos.toString().trim();
                                debitos = debitos.replace("â€", "");
                                debitos = debitos.replace(/\./gi, "");
                                debitos = debitos.replace("-", "");
                                debitos = debitos.replace("‐", "");     // este es un caracter muy raro que se ve como un "-" pero es otra cosa 
                                debitos = debitos.replace(",", ".");    // ahora debe ser: 10.7, 100.75, 1058.15, etc.
                                // validamos que el string sea un Number
                                if (!isNaN(parseFloat(debitos)) && isFinite(debitos)) {
                                    debitos = parseFloat(debitos);
                                    if (debitos > 0) {
                                        debitos *= -1;         // siempre asumimos que un crédito es un monto negativo ...
                                    }
                                }
                            } else {
                                // parece que el valor viene ya como un número; debe ser negativo ... 
                                if (debitos > 0) {
                                    debitos *= -1;         // siempre asumimos que un crédito es un monto negativo ...
                                }
                            }
                        }

                        // solo intentamos usar los campos créditos/débitos si no viene un monto y vienen éstos ...
                        if (!monto && creditos) {
                            monto = creditos;
                        }

                        if (!monto && debitos) {
                            monto = debitos;
                        }

                        // isFinite valida que el valor corresponda a un Number, pero no NaN or Infinity
                        if (fecha && lodash.isDate(fecha) && monto && lodash.isFinite(monto)) {
                            let item = {
                                _id: new Mongo.ObjectID()._str,
                                numero: numero,
                                tipo: tipo,
                                fecha: fecha,
                                beneficiario: beneficiario,
                                concepto: concepto,
                                monto: monto,
                            };

                            lineasLeidasDesdeExcel.push(item);
                            lineasExcelLeidas++;
                        } else {
                            lineasExcelObviadas++;
                        }
                    });


                    // cerramos el modal y terminamos ...
                    $(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                    $(":file").filestyle('disabled', false);     // (no) desabilitamos el input-file

                    $scope.showProgress = false;

                    promise = DialogModal($modal,
                                          `<em>Conciliación bancaria - Movimientos del banco - Importar desde Excel</em>`,
                                          `Ok, este proceso ha leído <b>${lineasExcelLeidas.toString()}</b>
                                           movimientos bancarios desde el documento Excel.<br />
                                           Además, ha obviado <b>${lineasExcelObviadas.toString()}</b> lineas, por no contener una
                                           fecha y/o un monto válidos.<br /><br />
                                           Ud. debe hacer un <em>click</em> en <em>Registrar movimientos del banco</em>
                                           para que los movimientos leídos sean grabados en la base de datos.
                                          `,
                                          false).then();
              };

              reader.readAsBinaryString(f);
        };
    }


    $scope.registrarMovimientosBanco = () => {

        $scope.showProgress = true;

        $meteor.call('bancos_conciliacion_GrabarMovtosBanco',
                     conciliacionBancaria._id,
                     JSON.stringify(lineasLeidasDesdeExcel)).then(
            function (data) {

                if (data.error) {
                    // el método que intenta grabar los cambis puede regresar un error cuando,
                    // por ejemplo, la fecha corresponde a un mes ya cerrado en Bancos ...
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'danger',
                        msg: data.message
                    });
                    $scope.showProgress = false;
                } else {
                    $scope.alerts.length = 0;
                    $scope.alerts.push({
                        type: 'info',
                        msg: data.message
                    });

                    $scope.showProgress = false;
                }
            },
            function (err) {
                let errorMessage = mensajeErrorDesdeMethod_preparar(err);

                $scope.alerts.length = 0;
                $scope.alerts.push({
                    type: 'danger',
                    msg: errorMessage
                });
                $scope.showProgress = false;
            });
    };


    $modalInstance.rendered.then(function(){
        // para mejorar el style al input type="file" ...
        // nótese que, en caso de bootstrap modals, ponemos en 'rendered'; de otra forma, los estilos no se aplican
        // correctamente al input ...
        $(":file").filestyle();
        $(":file").filestyle('buttonName', 'btn-primary');
        $(":file").filestyle('buttonText', '&nbsp;&nbsp;1) Seleccione un documento Excel ...');
        $(":file").filestyle('disabled', false);
        $(":file").filestyle({iconName: "glyphicon-file"});
        $(":file").filestyle('size', 'sm');
        // $(":file").filestyle({input: false});
    })


    // ------------------------------------------------------------------------------------------------------
    // para recibir los eventos desde la tarea en el servidor ...
    EventDDP.setClient({ myuserId: Meteor.userId(), app: 'bancos', process: 'conciliacionesBancarias' });
    EventDDP.addListener('bancos_conciliacionBancaria_reportProgress', function(process) {

        $scope.processProgress.current = process.current;
        $scope.processProgress.max = process.max;
        $scope.processProgress.progress = process.progress;
        // if we don't call this method, angular wont refresh the view each time the progress changes ...
        // until, of course, the above process ends ...
        $scope.$apply();
    });
}
]);
