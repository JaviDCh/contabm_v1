

import XLSX from "XLSX";
import { DialogModal } from '/client/generales/angularGenericModal'; 

import { GruposContables } from '/imports/collections/contab/gruposContables'; 

angular.module("contabm.contab.catalogos").controller('ContabCatalogosCuentasContablesImportarDesdeExcel_Controller',
['$scope', '$modalInstance', '$modal', 'cuentasContables', 'cuentasContables_ui_grid', 'ciaSeleccionada',
function ($scope, $modalInstance, $modal, cuentasContables, cuentasContables_ui_grid, ciaSeleccionada) {

    // ui-bootstrap alerts ...
    $scope.alerts = [];

    $scope.closeAlert = function (index) {
        $scope.alerts.splice(index, 1);
    }

    $scope.companiaSeleccionada = ciaSeleccionada;

    $scope.ok = function () {
        $modalInstance.close("Ok");
    }

    $scope.cancel = function () {
        $modalInstance.dismiss("Cancel");
    }

    // para leer el archivo seleccionado mediante el Input ...
    let userSelectedFile = null;
    $scope.uploadFile = function(files) {
      userSelectedFile = files[0];
    }


    let cuentasContablesAgregadas = 0;

    $scope.submit_TratarFilesForm = function () {

          $scope.submitted = true;

          $scope.alerts.length = 0;

          if (!userSelectedFile) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: `Aparentemente, Ud. no ha seleccionado un archivo (Excel) desde su PC aún.<br />
                        Ud. debe seleccionar un archivo (Excel) antes de intentar importar
                        las cuentas contables desde el mismo.`
              })

              return;
          }

          if ($scope.tratarFilesForm.$valid) {
              $scope.submitted = false;
              $scope.tratarFilesForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

              $scope.showProgress = true;

              let f = userSelectedFile;

              var reader = new FileReader();
              var name = f.name;

              cuentasContablesAgregadas = 0;

              reader.onload = function(e) {
                let data = e.target.result;

                let workbook = XLSX.read(data, {type: 'binary'});
                let first_sheet_name = workbook.SheetNames[0];

                /* Get worksheet */
                var worksheet = workbook.Sheets[first_sheet_name];

                /* DO SOMETHING WITH workbook HERE */

                let cuentasContablesDesdeExcel = XLSX.utils.sheet_to_json(worksheet, {raw: true});
                let gruposContables = GruposContables.find().fetch();

                cuentasContablesDesdeExcel.forEach((cuenta) => {

                    let cuentaContable = cuenta['Cuenta'] ? cuenta['Cuenta'].toString() : "";
                    let descripcion = cuenta['Descripción'] ? cuenta['Descripción'] : null;
                    let totDet = cuenta['Tot/Det'] ? cuenta['Tot/Det'] : null;
                    let grupo = cuenta['Grupo'] ? cuenta['Grupo'] : null;

                    let grupoItem = _.find(gruposContables, (x) => { return x.descripcion === grupo; });

                    let item = {
                        _id: new Mongo.ObjectID()._str,
                        id: 0,
                        cuentaEditada: cuentaContable.toString().trim(),
                        descripcion: descripcion.toString().trim(),
                        totDet: totDet.toString().trim(),
                        actSusp: "A",
                        grupo: grupoItem ? grupoItem.grupo : null,
                        cia: ciaSeleccionada.numero,
                        docState: 1
                    };

                    cuentasContables.push(item);

                    cuentasContablesAgregadas++;
                });


                // cerramos el modal y terminamos ...
                $(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                $(":file").filestyle('disabled', false);     // (no) desabilitamos el input-file

                $scope.showProgress = false;

                cuentasContables_ui_grid.data = [];
                if (_.isArray(cuentasContables))
                   cuentasContables_ui_grid.data = cuentasContables;

                promise = DialogModal($modal,
                                      `<em>Cuentas contables - Importar desde Excel</em>`,
                                      `Ok, este proceso ha agregado <b>${cuentasContablesAgregadas.toString()}</b>
                                       cuentas contables a la lista.<br />
                                       Estas cuentas serán mostradas como <em>registros nuevos</em> en la lista.<br />
                                       Ud. debe hacer un <em>click</em> en <em>Grabar</em> para que las cuentas contables
                                       sean registradas en la base de datos.
                                      `,
                                      false).then();
              };

              reader.readAsBinaryString(f);
        }
    }



    $modalInstance.rendered.then(function() {
        // para mejorar el style al input-file ...
        // nótese que, en caso de bootstrap modals, ponemos en 'rendered'; de otra forma, los estilos no se aplican
        // correctamente al input ...
        $(":file").filestyle();
        $(":file").filestyle('buttonName', 'btn-primary');
        $(":file").filestyle('buttonText', '&nbsp;&nbsp;Seleccione un documento Excel ...');
        $(":file").filestyle('disabled', false);
        $(":file").filestyle({iconName: "glyphicon-file"});
        $(":file").filestyle('size', 'sm');
        // $(":file").filestyle({input: false});
    });
}])
