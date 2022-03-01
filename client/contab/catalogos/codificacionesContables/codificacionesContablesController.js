
import lodash from 'lodash';
import { DialogModal } from '/client/generales/angularGenericModal'; 
import { CuentasContables2 } from '/imports/collections/contab/cuentasContables2'; 
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

angular.module("contabm.contab.catalogos").controller("Catalogos_Contab_CodificacionesContables_Controller",
['$scope', '$meteor', '$modal', 'uiGridConstants', '$interval', function ($scope, $meteor, $modal, uiGridConstants, $interval) {

      $scope.showProgress = false;

      // ------------------------------------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      let companiaSeleccionadaDoc = {};

      if (companiaSeleccionada) {
          companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true } });
      }

      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc)
          $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      else
          $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      // ------------------------------------------------------------------------------------------------------------------------------

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.algunItemEditado = () => {
          let itemsEditados = false;

          itemsEditados = _.find($scope.codificacionesContables, (x) => { return x.docState; }) ||
                          _.find($scope.codificacionesContables_codigos, (x) => { return x.docState; }) ||
                          _.find($scope.codificacionesContables_codigos_cuentasContables, (x) => { return x.docState; })

          return itemsEditados;
      }

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      $scope.exportToFile = () => {
          // permitimos grabar la codificación seleccionad, como un json, a un archivo en el PC. Luego, este archivo podrá
          // ser importado como una codificación nueva ...

          if ($scope.algunItemEditado()) {
              DialogModal($modal, "<em>Codificaciones contables - Exportar a un archivo de texto</em>",
                                  "Aparentemente, <em>se han efectuado cambios</em> en el registro. " +
                                  "Ud. debe grabar los cambios antes de intentar ejecutar esta función.",
                                 false).then();
              return false;
          }

          if (!codificacionSeleccionada || _.isEmpty(codificacionSeleccionada) || !codificacionSeleccionada.descripcion) {
              DialogModal($modal, "<em>Codificaciones contables - Exportar a un archivo de texto</em>",
                                  "Ud. debe seleccionar la codificación que desea exportar. " +
                                  "Aparentemente, ahora no hay una codificación seleccionada en la lista.",
                                 false).then();
              return false;
          }

          DialogModal($modal, "<em>Codificaciones contables - Exportar a un archivo de texto</em>",
                              `Esta función le permite exportar la codificación que Ud. ha seleccionado en la lista, a un
                              archivo de texto en su PC.<br /><br />
                              Si Ud. hace un <em>click</em> en <em>Okey</em>, la codificación <em><b>${codificacionSeleccionada.descripcion}</b></em>
                              será exportada al archivo que Ud. seleccione ...`,
                             true).then(
                                 () => {
                                     exportToFile2();
                                 },
                                 () => {
                                     return false;
                                 },
                             );
      }

      let exportToFile2 = () => {
          let message = "";

          try {
              // una codificación contable consta de 3 tablas que se relacionan; grabamos registros tipo: 1, 2 y 3,
              // de acuerdo a la tabla (collection) ...
          let recordsArray = [];

          lodash($scope.codificacionesContables).filter((x) => { return x._id === codificacionSeleccionada._id; }).
                                               forEach((x) => {
               x.tipoRegistro = 1;
               recordsArray.push(x);
           });

           lodash($scope.codificacionesContables_codigos).
                    filter((x) => { return x.codificacionContable_ID === codificacionSeleccionada._id; }).
                    forEach((x) => {
                x.tipoRegistro = 2;
                recordsArray.push(x);
            });

            lodash($scope.codificacionesContables_codigos_cuentasContables).
                     filter((x) => { return x.codificacionContable_ID === codificacionSeleccionada._id; }).
                     forEach((x) => {
                 x.tipoRegistro = 3;
                 recordsArray.push(x);
             });

              var blob = new Blob([JSON.stringify(recordsArray)], {type: "text/plain;charset=utf-8"});
              saveAs(blob, "codificacion contable");
          }
          catch(err) {
              message = err.message ? err.message : err.toString();
          }
          finally {
              if (message) {
                  DialogModal($modal, "<em>Codificaciones contables - Exportar a un archivo de texto</em>",
                                      "Ha ocurrido un error al intentar ejecutar esta función:<br />" +
                                      message,
                                     false).then();
              };
          };
      };



      $scope.importFromFile = () => {
          // permitimos grabar la codificación seleccionad, como un json, a un archivo en el PC. Luego, este archivo podrá
          // ser importado como una codificación nueva ...

          DialogModal($modal, "<em>Codificaciones contables - Importar codificación contable desde un archivo de texto</em>",
                              `Esta función le permite seleccionar un archivo de texto, que contenga una codificación contable exportada
                              previamente.<br />
                              La codificación contable que Ud. importe, será registrada como una codificación nueva, la cual Ud. debe
                              completar y grabar.<br /><br />
                              <b>Nota importante:</b> la codificación contable que Ud. importe no será grabada a la base de datos,
                              hasta que Ud. la complete y haga un <em>click</em> en <em>Grabar</em>.`,
                             true).then(
                                 () => {
                                     importFromFile2();
                                 },
                                 () => {
                                     return false;
                                 },
                             );
      };

      let importFromFile2 = () => {
          // simulamos un click al input file, para que el usuario pueda seleccionar su archivo ...
          let inputFile = angular.element("#fileInput");
          if (inputFile)
              inputFile.click();        // simulamos un click al input (file)
      };


      $scope.uploadFile = function(files) {

          let userSelectedFile = files[0];

          if (!userSelectedFile) {
              DialogModal($modal, "<em>Codificaciones contables</em>",
                                  "Aparentemente, Ud. no ha seleccionado un archivo.<br />" +
                                  "Por favor seleccione un archivo que corresponda a una codificación contable <em>exportada</em> antes.",
                                 false).then();

             let inputFile = angular.element("#fileInput");
             if (inputFile && inputFile[0] && inputFile[0].value)
                 // para que el input type file "limpie" el file indicado por el usuario
                 inputFile[0].value = null;

              return;
          }

          let reader = new FileReader();
          let message = "";

          $scope.codificaciones_ui_grid.data = [];

          reader.onload = function(e) {
            //   debugger;
              try {
                  var content = e.target.result;
                  let codificacionContable = JSON.parse(content);

                  let ciasContabDiferentes = false;
                  let error = false;

                  let codificacion = _.find(codificacionContable, (x) => { return x.tipoRegistro === 1; });

                  if (!codificacion || _.isEmpty(codificacion)) {
                      message = `Error inesperado: el contenido del archivo seleccionado no contiene un registru cuyo tipo sea 1;
                                 probablemente, el archivo no corresponde a una codificación contable que se ha exportado.<br /><br />
                                 La codificación contable a importar debe tener un registros con esas características.`;
                      let error = true;
                  };

                  // si las compañías (Contab) son diferentes, no importamos las cuentas contables (al menos por ahora) ...
                  if (!codificacion.cia) {
                      message = `Error inesperado: el contenido del archivo seleccionado no contiene un valor para <em>cia Contab</em>.<br />
                                 La codificación contable a importar debe tener un valor para este campo.`;
                      let error = true;
                  };


                  let mismaCiaContab = true;

                  if (codificacion.cia != companiaSeleccionadaDoc.numero) {
                      message = `La <em>cia Contab</em> que corresponde a la codificación que se ha importado, es <b>diferente</b> a la
                                 <em>cia Contab</em> seleccionada ahora.<br /><br />
                                 Por este motivo, aunque la codificación contable se ha importado, no lo han sido sus cuentas contables.<br /><br />
                                 Además, la codificación contable ha sido importada para la <em>cia Contab</em> que ahora está seleccionada.`;

                      mismaCiaContab = false;
                  };


                  if (!error) {
                      // agregamos un registro para la codificación
                      if (codificacion.descripcion)
                         codificacion.descripcion = "(copia de) " + codificacion.descripcion;

                      codificacion._id = new Mongo.ObjectID()._str;
                      codificacion.cia = companiaSeleccionadaDoc.numero;
                      codificacion.docState = 1;

                      delete codificacion.tipoRegistro;

                      $scope.codificacionesContables.push(codificacion);

                      // agregamos un registro para cada código
                      lodash(codificacionContable).filter((x) => { return x.tipoRegistro === 2; }).forEach((codigo) => {

                          // TODO: Ok, agregar los códigos aquí y luego las cuentas ...
                          let codigoContable = {
                              _id: new Mongo.ObjectID()._str,
                              codificacionContable_ID: codificacion._id,
                              codigo: codigo.codigo,
                              descripcion: codigo.descripcion,
                              detalle: codigo.detalle,
                              suspendido: codigo.suspendido,
                              cia: companiaSeleccionadaDoc.numero,
                              docState: 1,
                          };

                          $scope.codificacionesContables_codigos.push(codigoContable);

                          if (mismaCiaContab) {

                              // solo copiamos las cuentas contables, si el codificación a importar corresponde a la
                              // misma cia Contab

                              lodash(codificacionContable).filter((x) => { return x.tipoRegistro === 3 &&
                                                                                  x.codigoContable_ID === codigo._id; }).
                                                           forEach((cuenta) => {
                                  let cuentaContable = {
                                      _id: new Mongo.ObjectID()._str,
                                      codificacionContable_ID: codificacion._id,
                                      codigoContable_ID: codigoContable._id,
                                      id: cuenta.id,
                                      cia: companiaSeleccionadaDoc.numero,
                                      docState: 1,
                                  };

                                  $scope.codificacionesContables_codigos_cuentasContables.push(cuentaContable);
                              });
                          };
                      });
                  };
              }
              catch(err) {
                  message = err.message ? err.message : err.toString();
              }
              finally {
                //   debugger;
                  if (message)
                      DialogModal($modal, "<em>Codificaciones contables - Importar codificación contable desde un archivo de texto</em>",
                                          "Alguna situación inesperada ha ocurrido al intentar ejecutar esta función:<br /><br />" +
                                          message,
                                         false).then();
                   else {
                       DialogModal($modal, "<em>Codificaciones contables</em>",
                                           "Ok, la codificación contable que Ud. ha seleccionado ha sido importada.",
                                          false).then();
                   };

                   let inputFile = angular.element("#fileInput");
                   if (inputFile && inputFile[0] && inputFile[0].value)
                       // para que el input type file "limpie" el file indicado por el usuario
                       inputFile[0].value = null;

                   $scope.codificaciones_ui_grid.data = [];
                   $scope.codigos_ui_grid.data = [];
                   $scope.codigosCuentasContables_ui_grid.data = [];

                   if (_.isArray($scope.codificacionesContables))
                      $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

                   $scope.$apply();
              };
          };

          reader.readAsText(userSelectedFile);
      };



      $scope.importarDesdeContab = () => {
          // debe haber una codificación seleccionada; allí es donde vamos a importar los códigos en el file ...
          if (!codificacionSeleccionada || _.isEmpty(codificacionSeleccionada)) {
              DialogModal($modal, "<em>Codificaciones contables</em>",
                                  "Debe haber una <em>codificación contable</em> seleccionada en la lista.<br /><br />" +
                                  "Este proceso intentará importar los códigos contables, desde el archivo que se indique, a la " +
                                  "<em>codificación contable</em> seleccionada en la lista.<br /><br />Ud. debe seleccionar una " +
                                  "codificación en la lista.",
                                 false).then();
             return;
          };

          // simulamos un click al input file, para que el usuario pueda seleccionar su archivo ...
          let inputFile = angular.element("#fileInput2");
          if (inputFile)
              inputFile.click();        // simulamos un click al input (file)
      };

      $scope.uploadFile2 = function(files) {
          let userSelectedFile = files[0];

          if (!userSelectedFile) {
              DialogModal($modal, "<em>Codificaciones contables</em>",
                                  "Aparentemente, Ud. no ha seleccionado un archivo.<br />" +
                                  "Por favor seleccione un archivo que corresponda a una codificación contable <em>exportada</em> antes.",
                                 false).then();

             let inputFile = angular.element("#fileInput2");
             if (inputFile && inputFile[0] && inputFile[0].value)
                 // para que el input type file "limpie" el file indicado por el usuario
                 inputFile[0].value = null;

              return;
          }

          let reader = new FileReader();
          let message = "";
          let lastLine = "";

          reader.onload = function(e) {
              try {
                //   var content = e.target.result;
                  let lines = e.target.result.split('\n');
                  let codigoContable_array = [];

                  // recorremos las lineas para crear un array de objects, con la información del código contable
                  lines.forEach((linea) => {

                      if (linea) {
                          let fields = linea.split('***');
                          lastLine = linea;                 // para guardar la última línea y poder mostrar si hay error ...

                          let codigoObject = {

                              filler: fields[0],

                              codigo1: fields[1].split(' - ')[0],
                              descripcion1: fields[1].split(' - ')[1],

                              codigo2: fields[2].split(' - ')[0].replace(/ /g, '~'),
                              descripcion2: fields[2].split(' - ')[1],

                              cuentaContableID: parseInt(fields[3]),
                          };

                          for (let i = 2; i < fields[2].split(' - ').length; i++)
                              codigoObject.descripcion2 += " - " + fields[2].split(' - ')[i];

                          codigoContable_array.push(codigoObject);
                      };
                  });

                  // -------------------------------------------------------------------------------
                  // recorremos el array y agregamos a codificacionesContables ...
                  let codigoContable_groupByCodigo1 = lodash.groupBy(codigoContable_array, 'codigo1');

                  let codigoContable_object = {};

                  for (let key1 in codigoContable_groupByCodigo1) {

                      codigoContable_object = {
                          _id: new Mongo.ObjectID()._str,
                          codificacionContable_ID: codificacionSeleccionada._id,
                          codigo: key1,
                          descripcion: codigoContable_groupByCodigo1[parseInt(key1)][0].descripcion1,
                          detalle: false,
                          suspendido: false,
                          cia: companiaSeleccionadaDoc.numero,
                          docState: 1,
                      };

                      $scope.codificacionesContables_codigos.push(codigoContable_object);

                      // agrupamos los codigos2 de cada código1 y vamos agregando a la codificación seleccionada
                      let codigoContable_groupByCodigo2 = lodash.groupBy(codigoContable_groupByCodigo1[parseInt(key1)], 'codigo2');

                      for (let key2 in codigoContable_groupByCodigo2) {

                          codigoContable_object = {
                              _id: new Mongo.ObjectID()._str,
                              codificacionContable_ID: codificacionSeleccionada._id,
                              codigo: key1 + ' ' + key2,
                              descripcion: codigoContable_groupByCodigo2[key2][0].descripcion2,
                              detalle: true,
                              suspendido: false,
                              cia: companiaSeleccionadaDoc.numero,
                              docState: 1,
                          };

                          codigoContable_groupByCodigo2[key2].forEach((cuentaContable) => {
                              $scope.codificacionesContables_codigos_cuentasContables.push({
                                  _id: new Mongo.ObjectID()._str,
                                  codificacionContable_ID: codificacionSeleccionada._id,
                                  codigoContable_ID: codigoContable_object._id,
                                  id: cuentaContable.cuentaContableID,
                                  cia: companiaSeleccionadaDoc.numero,
                                  docState: 1,
                              });
                          });

                          $scope.codificacionesContables_codigos.push(codigoContable_object);
                      };
                  };
              }
              catch(err) {
                  message = err.message ? err.message : err.toString();
                  message += " (última línea: " + lastLine + ")";
              }
              finally {
                  if (message)
                      DialogModal($modal, "<em>Codificaciones contables - Importar codificación contable desde un archivo de texto</em>",
                                          "Alguna situación inesperada ha ocurrido al intentar ejecutar esta función:<br /><br />" +
                                          message,
                                         false).then();
                   else {
                       DialogModal($modal, "<em>Codificaciones contables</em>",
                                           "Ok, la codificación contable que Ud. ha seleccionado ha sido importada.",
                                          false).then();
                   };

                   let inputFile = angular.element("#fileInput2");
                   if (inputFile && inputFile[0] && inputFile[0].value)
                       // para que el input type file "limpie" el file indicado por el usuario
                       inputFile[0].value = null;

                   $scope.$apply();
              };
          };

          reader.readAsText(userSelectedFile);
      };









      let codificaciones_ui_grid_api = null;
      let codificacionSeleccionada = {};
      $scope.codificacionSeleccionada = {};             // para mostrar la descripción de la codificación seleccionada

      $scope.codificaciones_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              codificaciones_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //   debugger;
                  codificacionSeleccionada = {};
                  $scope.codificacionSeleccionada = {};

                  $scope.codigos_ui_grid.data = [];
                  $scope.codigos_ui_grid2.data = [];
                  $scope.codigosCuentasContables_ui_grid.data = [];

                  if (row.isSelected) {
                      codificacionSeleccionada = row.entity;
                      $scope.codificacionSeleccionada = row.entity;

                      // mostramos los códigos registrados para la codificación seleccionada ...
                      $scope.codigos_ui_grid.data = lodash.filter($scope.codificacionesContables_codigos,
                          (x) => { return x.codificacionContable_ID === codificacionSeleccionada._id ;});


                      // en el 2do. tab, mostramos *solo* códigos de tipo detalle
                      $scope.codigos_ui_grid2.data = lodash.filter($scope.codificacionesContables_codigos,
                          (x) => { return x.codificacionContable_ID === codificacionSeleccionada._id &&
                                          x.detalle == true; });
                  }
                  else
                      return;
              });

              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue)
                      if (!rowEntity.docState)
                          rowEntity.docState = 2;
              });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.codificaciones_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 250,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteItem(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];

      $scope.deleteItem = function (item) {
          if (item.docState && item.docState === 1)
              // si el item es nuevo, simplemente lo eliminamos del array
              _.remove($scope.codificaciones, (x) => { return x._id === item._id; });
          else
              item.docState = 3;

          $scope.codigos_ui_grid.data = [];
          $scope.codigos_ui_grid2.data = [];
      };

      $scope.agregarCodificacion = function () {
          if (!_.isArray($scope.codificacionesContables))
              $scope.codificacionesContables = [];

          let item = {
              _id: new Mongo.ObjectID()._str,
              cia: companiaSeleccionadaDoc.numero,
              docState: 1
          };

          $scope.codificacionesContables.push(item);

          $scope.codificaciones_ui_grid.data = [];
          if (_.isArray($scope.codificacionesContables))
             $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

          $scope.codigos_ui_grid.data = [];
          $scope.codigos_ui_grid2.data = [];
      };
















      let codigos_ui_grid_api = null;
      let codigoSeleccionado = {};

      $scope.codigos_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableFiltering: true,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              codigos_ui_grid_api = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  codigoSeleccionado = {};
                  $scope.codigosCuentasContables_ui_grid.data = [];

                  if (row.isSelected) {
                      codigoSeleccionado = row.entity;

                      if (_.isArray(codigoSeleccionado.cuentasContables))
                         $scope.codigosCuentasContables_ui_grid.data = codigoSeleccionado.cuentasContables;
                  }
                  else
                      return;
              });

              gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
                  if (newValue != oldValue)
                      if (!rowEntity.docState)
                          rowEntity.docState = 2;
              });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.codigos_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'codigo',
              field: 'codigo',
              displayName: 'Código',
              width: 185,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'string'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 200,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'string'
          },
          {
              name: 'detalle',
              field: 'detalle',
              displayName: 'Detalle',
              width: 70,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'suspendido',
              field: 'suspendido',
              displayName: 'Susp',
              width: 60,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteCodigo(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              width: 25
          },
      ];


      // permitimos agregar un registro al array de códigos contables, para la codificación contable seleccionada
      $scope.agregarCodigo = () => {
        //   debugger;
          if (codificacionSeleccionada && !_.isEmpty(codificacionSeleccionada)) {
              $scope.codificacionesContables_codigos.push({
                  _id: new Mongo.ObjectID()._str,
                  codificacionContable_ID: codificacionSeleccionada._id,
                  detalle: false,
                  suspendido: false,
                  cia: companiaSeleccionadaDoc.numero,
                  docState: 1,
              });

              $scope.codigos_ui_grid.data = lodash.filter($scope.codificacionesContables_codigos,
                  (x) => { return x.codificacionContable_ID === codificacionSeleccionada._id; });
          };
      };

      $scope.deleteCodigo = (item) => {
        //   debugger;
          if (item.docState && item.docState == 1) {
              lodash.remove($scope.codificacionesContables_codigos, (x) => { return x._id === item._id; });
          }
          else {
              item.docState = 3;
          };

          $scope.codigos_ui_grid.data = lodash.filter($scope.codificacionesContables_codigos,
              (x) => { return x.codificacionContable_ID === codificacionSeleccionada._id; });
      };

      let codigos_ui_grid_api2 = null;

      $scope.codigos_ui_grid2 = {

          enableSorting: true,
          showColumnFooter: false,
          enableRowSelection: true,
          enableFiltering: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              codigos_ui_grid_api2 = gridApi;

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  codigoSeleccionado = {};
                  $scope.codigosCuentasContables_ui_grid.data = [];

                  if (row.isSelected) {
                      codigoSeleccionado = row.entity;

                      // refrescamos las cuentas contables en el ui-grid ...
                      $scope.codigosCuentasContables_ui_grid.data =
                           _.filter($scope.codificacionesContables_codigos_cuentasContables,
                                    (x) => { return x.codigoContable_ID == codigoSeleccionado._id; } );
                  }
                  else
                      return;
              });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.codigos_ui_grid2.columnDefs = [
          {
              name: 'codigo',
              field: 'codigo',
              displayName: 'Código',
              width: 150,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'string'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 130,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: true,
              enableSorting: true,
              enableFiltering: true,
              type: 'string'
          },
      ]

      // ui-grid para mostrar las cuentas contables asociadas a cada codigo (en la codificación seleccionada)

      let codigosCuentasContables_ui_grid = null;

      $scope.codigosCuentasContables_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableFiltering: true,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {
              codigosCuentasContables_ui_grid = gridApi;
          },
          rowIdentity: function (row) {
              return row._id;
          },
          getRowIdentity: function (row) {
              return row._id;
          }
      }


      $scope.codigosCuentasContables_ui_grid.columnDefs = [
          {
              name: 'docState',
              field: 'docState',
              displayName: '',
              cellTemplate:
              '<span ng-show="row.entity[col.field] == 1" class="fa fa-asterisk" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 2" class="fa fa-pencil" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>' +
              '<span ng-show="row.entity[col.field] == 3" class="fa fa-trash" style="color: #A5999C; font: xx-small; padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableColumnMenu: false,
              enableSorting: false,
              width: 25
          },
          {
              name: 'id',
              field: 'id',
              displayName: 'Cuenta contable',
              width: 140,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'cuentasContables_cuentaDescripcionCia',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'delButton',
              displayName: '',
              cellTemplate: '<span ng-click="grid.appScope.deleteCodigoCuentaContable(row.entity)" class="fa fa-close redOnHover" style="padding-top: 8px; "></span>',
              enableCellEdit: false,
              enableSorting: false,
              enableFiltering: false,
              width: 25,
          },
      ]



      $scope.deleteCodigoCuentaContable = function(item) {
          if (item.docState && item.docState == 1) {
              // el item es nuevo; lo eliminamos del array
              _.remove($scope.codificacionesContables_codigos_cuentasContables, (x) => { return x._id === item._id; });
          }
          else {
              item.docState = 3;
          };

          // refrescamos las cuentas contables en el ui-grid ...
          $scope.codigosCuentasContables_ui_grid.data = _.filter($scope.codificacionesContables_codigos_cuentasContables,
                                                                 (x) => { return x.codigoContable_ID == codigoSeleccionado._id; });
      }


      let cuentaContableSeleccionada = {};
      let cuentasContables_ui_grid_api = null;
      let angularInterval = null;           // para detener el interval que usamos más abajo

      $scope.cuentasContables_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
          enableFiltering: true,
          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

              cuentasContables_ui_grid_api = gridApi;

              // -----------------------------------------------------------------------------------------------------
              // cuando el ui-grid está en un bootstrap tab y tiene más columnas de las que se pueden ver,
              // al hacer horizontal scrolling los encabezados no se muestran sincronizados con las columnas;
              // lo que sigue es un 'workaround'
              // -----------------------------------------------------------------------------------------------------
              angularInterval = $interval( function() {
                cuentasContables_ui_grid_api.core.handleWindowResize();
              }, 200);

              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //   debugger;
                  cuentaContableSeleccionada = {};

                  if (row.isSelected) {
                      cuentaContableSeleccionada = row.entity;

                      // intentamos agregar la cuenta contable que el usuario seleccionó en la lista, al array de cuentas contables
                      // del código contable seleccionado ...

                      if (codigoSeleccionado && !_.isEmpty(codigoSeleccionado)) {

                           // evitamos agregar al array una cuenta que ya exista (para el código seleccionado) ...
                           if (!_.find($scope.codificacionesContables_codigos_cuentasContables,
                                       (x) => { return x.codigoContable_ID == codigoSeleccionado._id &&
                                                       x.id === cuentaContableSeleccionada.id; } )) {

                                   $scope.codificacionesContables_codigos_cuentasContables.push({
                                       _id: new Mongo.ObjectID()._str,
                                       codificacionContable_ID: codificacionSeleccionada._id,
                                       codigoContable_ID: codigoSeleccionado._id,
                                       id: cuentaContableSeleccionada.id,
                                       cia: companiaSeleccionadaDoc.numero,
                                       docState: 1,
                                   });
                           };


                           // refrescamos las cuentas contables en el ui-grid ...
                           $scope.codigosCuentasContables_ui_grid.data =
                                _.filter($scope.codificacionesContables_codigos_cuentasContables,
                                         (x) => { return x.codigoContable_ID == codigoSeleccionado._id; } );
                      };
                  }
                  else
                      return;
              });

          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },

          getRowIdentity: function (row) {
              return row._id;
          }
      }

      // para detener el angular $Interval que usamos en el ui-gris arriba, cuando el $scope es destruido ...
      $scope.$on('$destroy', function() {
          // Make sure that the interval is destroyed too
          $interval.cancel(angularInterval);
        })


      $scope.cuentasContables_ui_grid.columnDefs = [
          {
              name: 'cuenta',
              field: 'cuenta',
              displayName: 'Cuenta',
              width: 150,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'descripcion',
              field: 'descripcion',
              displayName: 'Descripción',
              width: 250,
              enableFiltering: true,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'totDet',
              field: 'totDet',
              displayName: 'Tot/Det',
              width: 60,
              enableFiltering: true,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'actSusp',
              field: 'actSusp',
              displayName: 'Act/Susp',
              width: 80,
              enableFiltering: true,
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia contab',
              cellFilter: 'companiaAbreviaturaFilter',
              width: 100,
              enableFiltering: false,
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
      ]


      $scope.grabar = function () {

        // antes de intentar validar y grabar como lo hacemos normalmente, hacemos una validación previa
        let validacionResultado = validarCodigoContable($scope.codificacionesContables,
                                                        $scope.codificacionesContables_codigos,
                                                        $scope.codificacionesContables_codigos_cuentasContables);

        if (validacionResultado.error) {
            let mensaje = `<b>Error:</b> hemos encontrado errores de validación en las codificaciones contables
                           que se intenta grabar. Por favor corrija los errores que se indica a continuación e
                           intente grabar nuevamente: <br /><br />
            `;

            validacionResultado.mensajesError.forEach((m) => {
                mensaje += m + "<br />";
            });

            DialogModal($modal, "<em>Codificaciones contables</em>",
                                mensaje,
                               false).then();

            return;
        };

        // obtenemos un clone de los datos a guardar ...
        let editedItems = _.cloneDeep(_.filter($scope.codificacionesContables, (x) => { return x.docState; }));
        let editedItems2 = _.cloneDeep(_.filter($scope.codificacionesContables_codigos, (x) => { return x.docState; }));
        let editedItems3 = _.cloneDeep(_.filter($scope.codificacionesContables_codigos_cuentasContables, (x) => { return x.docState; }));

          if ((!_.isArray(editedItems) || !editedItems.length) &&
              (!_.isArray(editedItems2) || !editedItems2.length) &&
              (!_.isArray(editedItems3) || !editedItems3.length)) {
              DialogModal($modal, "<em>Codificaciones contables</em>",
                                  "Aparentemente, <em>no se han efectuado cambios</em> en los registros. No hay nada que grabar.",
                                 false).then();
              return;
          };

          $scope.showProgress = true;

          // nótese como validamos cada item antes de intentar guardar en el servidor
          let isValid = false;
          let errores = [];

          editedItems.forEach((editedItem) => {
              if (editedItem.docState != 3) {
                  isValid = CodificacionesContables.simpleSchema().namedContext().validate(editedItem);

                  if (!isValid) {
                      CodificacionesContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
                      });
                  };
              };
          });

          editedItems2.forEach((editedItem) => {
              if (editedItem.docState != 3) {
                  isValid = CodificacionesContables_codigos.simpleSchema().namedContext().validate(editedItem);

                  if (!isValid) {
                      CodificacionesContables_codigos.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
                      });
                  };
              };
          });

          editedItems3.forEach((editedItem) => {
              if (editedItem.docState != 3) {
                  isValid = CodificacionesContables_codigos_cuentasContables.simpleSchema().namedContext().validate(editedItem);

                  if (!isValid) {
                      CodificacionesContables_codigos_cuentasContables.simpleSchema().namedContext().validationErrors().forEach(function (error) {
                          errores.push("El valor '" + error.value + "' no es adecuado para el campo '" + error.name + "'; error de tipo '" + error.type + ".");
                      });
                  };
              };
          });

          if (errores && errores.length) {

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Se han encontrado errores al intentar guardar las modificaciones efectuadas en la base de datos:<br /><br />" +
                      errores.reduce(function (previous, current) {

                          if (previous == "")
                              // first value
                              return current;
                          else
                              return previous + "<br />" + current;
                      }, "")
              });

              $scope.showProgress = false;
              return;
          };

        //   debugger;

          $scope.codificaciones_ui_grid.data = [];
          $scope.codigos_ui_grid.data = [];
          $scope.codigosCuentasContables_ui_grid.data = [];

          $meteor.call('codificacionesContablesSave', editedItems, editedItems2, editedItems3).then(
              function (data) {

                  $scope.codificacionesContables = [];
                  $scope.codificacionesContables_codigos = [];
                  $scope.codificacionesContables_codigos_cuentasContables = [];

                  $scope.helpers({
                      codificacionesContables: () => {
                        return CodificacionesContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
                      },
                      codificacionesContables_codigos: () => {
                        return CodificacionesContables_codigos.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
                      },
                      codificacionesContables_codigos_cuentasContables: () => {
                        return CodificacionesContables_codigos_cuentasContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
                      },
                  });

                  $scope.codificaciones_ui_grid.data = [];
                  $scope.codigos_ui_grid.data = [];
                  $scope.codigos_ui_grid2.data = [];
                  $scope.codigosCuentasContables_ui_grid.data = [];

                  codificacionSeleccionada = {};
                  $scope.codificacionSeleccionada = {};

                  if (_.isArray($scope.codificacionesContables))
                     $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: data
                  });

                   $scope.showProgress = false;
                //    $scope.$apply();
              },
              function (err) {

                  let errorMessage = "<b>Error:</b> se ha producido un error al intentar ejecutar la operación.";
                  if (err.errorType)
                      errorMessage += " (" + err.errorType + ")";

                  errorMessage += "<br />";

                  if (err.message)
                      // aparentemente, Meteor compone en message alguna literal que se regrese en err.reason ...
                      errorMessage += err.message + " ";
                  else {
                      if (err.reason)
                          errorMessage += err.reason + " ";

                      if (err.details)
                          errorMessage += "<br />" + err.details;
                  };

                  if (!err.message && !err.reason && !err.details)
                      errorMessage += err.toString();

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'danger',
                      msg: errorMessage
                  });

                $scope.showProgress = false;
                // $scope.$apply();
              });
      };


      $scope.showProgress = true;

      Meteor.subscribe('codificacionesContables_completa', companiaSeleccionadaDoc.numero, () => {
        //   debugger;
          $scope.helpers({
              codificacionesContables: () => {
                return CodificacionesContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
              },
              codificacionesContables_codigos: () => {
                return CodificacionesContables_codigos.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
              },
              codificacionesContables_codigos_cuentasContables: () => {
                return CodificacionesContables_codigos_cuentasContables.find({ cia: companiaSeleccionadaDoc.numero }, { sort: { descripcion: 1 } });
              },
          });

          $scope.codificaciones_ui_grid.data = [];
          if (_.isArray($scope.codificacionesContables))
             $scope.codificaciones_ui_grid.data = $scope.codificacionesContables;

          $scope.alerts.length = 0;
          $scope.alerts.push({
              type: 'info',
              msg: $scope.codificacionesContables.length.toString() + " registros han sido seleccionados ..."
          });

          // recuérdese que las cuentas contables están siempre en el cliente (richsilv:dumb-collections
          // nos permite copiarlas al cliente y que permanezcan allí ...)
          $scope.helpers({
              cuentasContables: () => {
                return CuentasContables2.find({ cia: companiaSeleccionadaDoc && companiaSeleccionadaDoc.numero ?
                                                    companiaSeleccionadaDoc.numero : -99, totDet: 'D'},
                                             { sort: { cuenta: 1 } });
              }
          });

          $scope.cuentasContables_ui_grid.data = $scope.cuentasContables;

          $scope.showProgress = false;
          $scope.$apply();
      });
}
]);

function validarCodigoContable(codificaciones, codigosContables, cuentasContables) {
    // debugger;

    if (!codigosContables || !_.isArray(codigosContables) || codigosContables.length == 0)
        return { error: false };            // aparentemente, no hay nada que validar ...

    let mensajesError = [];

    // recorremos el array, pero agrupado por codificación, pues están todos los códigos, de varias
    // codificaciones  ...
    let codigos_groupByCodificacion = lodash.groupBy(codigosContables, 'codificacionContable_ID');

    for (let key in codigos_groupByCodificacion) {
        // recorremos y validamos cada cuenta en una codificación particular
        let codigosSeleccionados = codigos_groupByCodificacion[key];
        let codificacionSeleccionada = _.find(codificaciones, (x) => { return x._id === codigosSeleccionados[0].codificacionContable_ID; });

        codigos_groupByCodificacion[key].forEach((codigo) => {

            let error = false;

            if (!codigo.codigo) {
                mensajesError.push(`Alguno de los códigos en la codificación '${codificacionSeleccionada.descripcion}'
                                    parece estar vacío; no contiene un valor.`
                                  );
                error = true;
            };

            if (!codigo.descripcion) {
                mensajesError.push(`El código '${codigo.codigo}' en la codificación '${codificacionSeleccionada.descripcion}'
                                    no tiene una descripción.`
                                  );
                error = true;
            };

            // el código no debe repetirse ...
            if (!error) {
                let codigosRepetidos = lodash.filter(codigosSeleccionados, (x) => { return x.codigo === codigo.codigo; });
                if (_.isArray(codigosRepetidos) && codigosRepetidos.length > 1) {
                    mensajesError.push(`El código '${codigo.codigo}' en la codificación '${codificacionSeleccionada.descripcion}'
                                        está repetido; es decir, ocurre más de una vez.`
                                      );
                    error = true;
                };
            };


            let niveles = [];

            if (codigo.codigo)
                niveles = codigo.codigo.split(' ');

            if (!error && niveles.length > 6) {
                mensajesError.push(`El código '${codigo.codigo}' en la codificación '${codificacionSeleccionada.descripcion}'
                                    tiene más de <b>6</b> niveles.<br /> Los códigos contables, en una codificación determinada,
                                    deben tener un máximo de 6 niveles.`
                                  );
                error = true;
            };

            if (!error && niveles.length > 1) {
                // leemos el 'padre'; debe existir; primero lo determinamos
                let nivelPadre = "";
                for (let i = 0; i <= niveles.length - 2; i++) {
                    if (!nivelPadre)
                        nivelPadre = niveles[i];
                    else
                        nivelPadre += " " + niveles[i];
                };

                // nótese como buscamos en los códigos de la misma códificación ...
                let found = _.find(codigosSeleccionados, (x) => { return x.codigo === nivelPadre; });

                if (!found) {
                    mensajesError.push(`No existe un código que agrupe al código '${codigo.codigo}', en la codificación
                                        '${codificacionSeleccionada.descripcion}'.`);
                    error = true;
                };

                if (!error && found.detalle) {
                    mensajesError.push(`El código que agrupa al código '${codigo.codigo}', en la codificación
                                        '${codificacionSeleccionada.descripcion}', es de tipo detalle; todo grupo no debe ser de tipo detalle.`);
                    error = true;
                };

                let cuentasContables = _.filter(cuentasContables, (x) => { return x.codigoContable_ID === codigo._id ; });

                if (!error && !codigo.detalle && cuentasContables && cuentasContables.length) {
                    mensajesError.push(`El código '${codigo.codigo}', en la codificación '${codificacionSeleccionada.descripcion}',
                                        no es de tipo detalle, pero tiene cuentas contables asociadas.`);
                    error = true;
                };
            };

            if (codigo && codigo.codigo && codigo.detalle) {
                // el código es de tipo detalle; no debe haber códigos por debajo ...
                let found = _.chain(codigosSeleccionados)
                             .find((x) => { return x.codigo && x.codigo.startsWith(codigo.codigo + " "); })
                             .value();

                if (found) {
                    mensajesError.push(`El código '${codigo.codigo}' en la codificación '${codificacionSeleccionada.descripcion}',
                                        es de tipo detalle; sin embargo, tiene códigos asociados a él.`
                                      );
                    error = true;
                };
            };

        });
    };

    if (mensajesError.length)
        return { error: true, mensajesError: mensajesError };

    return { error: false };
};
