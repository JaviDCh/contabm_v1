
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { DialogModal } from '/client/generales/angularGenericModal'; 

angular.module("contabm").controller("RegistroFiles_Controller",
['$scope', '$state', '$stateParams', '$meteor', '$modal',
  function ($scope, $state, $stateParams, $meteor, $modal) {

      $scope.showProgress = true;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      // para agregar la aplicación (contab, nomina, bancos, etc.), al 'metadata' del archivo que cargue
      // el usuario ...
      let stateParams_aplicacion = $stateParams.aplicacion;

      // leemos la compañía seleccionada
      var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });

      let companiaSeleccionadaDoc = null;
      if (companiaSeleccionada) { 
        companiaSeleccionadaDoc = Companias.findOne(companiaSeleccionada.companiaID, { fields: { nombre: 1 } });
      }
          
      $scope.companiaSeleccionada = {};

      if (companiaSeleccionadaDoc) { 
        $scope.companiaSeleccionada = companiaSeleccionadaDoc;
      }  
      else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
      }
          
      $scope.fileTypes_List = [];

      switch (stateParams_aplicacion) {
          case "bancos": { 
            $scope.fileTypes_List.push({ id: 'BANCOS-CHEQUES', descripcion: 'Bancos - Cheques impresos', });
            $scope.fileTypes_List.push({ id: 'BANCOS-FACTURAS', descripcion: 'Bancos - Facturas (impresas)', });
            $scope.fileTypes_List.push({ id: 'BANCOS-RET-IMP-IVA', descripcion: 'Bancos - Retención de impuestos Iva', });
            $scope.fileTypes_List.push({ id: 'BANCOS-RET-IMP-ISLR', descripcion: 'Bancos - Retención de impuestos Islr', });
          break;
          } 
          case "nomina": { 
            $scope.fileTypes_List.push(
                {
                    id: 'NOMINA-CONSTANCIA-TRABAJO',
                    descripcion: 'Nómina - constancias de trabajo de empleados'
                }
            );
            break;
          }
          default:
      }


    // $scope.subscribe('images');

    let userSelectedFile = null;

    $scope.uploadFile = function(files) {
      userSelectedFile = files[0];
    }

    $scope.submitted = false;

    $scope.mostrarFilesRegistradas = () => {

        var modalInstance = $modal.open({
            templateUrl: 'client/generales/registrarFiles/mostrarFilesRegistradas.html',
            controller: 'MostrarFilesRegistradasController',
            size: 'lg',
            resolve: {
                aplicacion: () => {
                    return stateParams_aplicacion;              // nómina, bancos, contab, ...
                },
                ciaSeleccionada: function () {
                    // pasamos la entidad (puede ser: contratos, siniestros, ...) solo para marcar docState si se agrega/eliminar
                    // un documento (y no se había 'marcado' esta propiedad antes)...
                    return companiaSeleccionadaDoc;
                },
            },
        }).result.then(
              function (resolve) {
                  return true;
              },
              function (cancel) {
                  return true;
              });
    };

    // para mejorar el style al input-file ...
    $(":file").filestyle();

    // $(":file").filestyle({size: "sm"});
    // $(":file").filestyle({buttonText: "Seleccione una imagen"});
    // $(":file").filestyle({buttonName: "btn-primary"});
    // $(":file").filestyle({buttonBefore: true});

    $(":file").filestyle('buttonName', 'btn-danger');
    $(":file").filestyle('buttonText', '&nbsp;&nbsp;Seleccione un archivo ...');
    $(":file").filestyle('disabled', true);
    $(":file").filestyle('size', 'sm');

    $scope.tipoArchivo_change = () => {
        // cuando el usuario selecciona un tipo de imagen, activamos el input file ...
        if ($scope.tipoArchivo)
            $(":file").filestyle('disabled', false);
        else
            $(":file").filestyle('disabled', true);
    }

    $scope.submitGrabarFilesForm = function () {

          $scope.submitted = true;

          $scope.alerts.length = 0;

          if (!userSelectedFile) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Aparentemente, Ud. no ha seleccionado un archivo (imagen) desde su PC aún.<br />" +
                       "Ud. debe seleccionar un archivo (imagen) antes de intentar registrarlo (en el servidor)."
              });

              $scope.showProgress = true;
              return;
          }

          if ($scope.grabarFilesForm.$valid) {
              $scope.submitted = false;
              $scope.grabarFilesForm.$setPristine();    // para que la clase 'ng-submitted deje de aplicarse a la forma ... button

              // ---------------------------------------------------------------------------------------------
              // intentamos eliminar algún file que ya exista con el mismo nombre del que se intenta registrar
              let existingFile = Files_CollectionFS_Templates.find({ 'original.name': userSelectedFile.name });
              existingFile.forEach((x) => {
                  Files_CollectionFS_Templates.remove({ _id: x._id });
              });
              // ---------------------------------------------------------------------------------------------


              // collectionFS: creamos una instanacia para el file ...
              let newFile = new FS.File(userSelectedFile);

              // agregamos algunos valores al file que vamos a registrar con collectionFS
              newFile.metadata = {
                  user: Meteor.user().emails[0].address,
                  fecha: new Date(),
                  tipo: $scope.tipoArchivo,
                  aplicacion: stateParams_aplicacion,
                  cia: companiaSeleccionadaDoc._id,
              };

              // TODO: intentar eliminar el archivo si existe; usar el nombre y el tipo para
              // encontrarlo ... luego usar su _id (si lo encontramos) para eliminarlo
              // así: Files_CollectionFS_Templates.remove({ _id: file._id });

              Files_CollectionFS_Templates.insert(newFile, function (err, fileObj) {
                  // Inserted new doc with ID fileObj._id, and kicked off the data upload using HTTP

                  if (err) {
                      $scope.alerts.length = 0;
                      $scope.alerts.push({
                          type: 'danger',
                          msg: "Se ha producido un error al intentar registrar el archivo indicado en el servidor.<br />" +
                          "El mensaje específico del error es: " + err.toString()
                      });

                      $scope.showProgress = false;
                      return;
                  }

                  userSelectedFile = null;
                  $scope.tipoArchivo = "";

                  $(":file").filestyle('clear');              // para regresar el input (file) a su estado inicial (ie: no selected file)
                  $(":file").filestyle('disabled', true);     // desabilitamos el input-file

                  DialogModal($modal,
                      "<em>Registro de archivos</em>",
                      "Ok, el archivo fue registrado en forma satisfactoria.<br />" +
                      "Para registrar un nuevo archivo, simplemente ejecute la operación una vez más.",
                      false).then();

                  $scope.showProgress = false;
              })
        }
    }


    // --------------------------------------------------------------------------------------------------------------------
    // suscribimos a las imagenes registradas para la cia seleccionada
    $scope.showProgress = true;

    $scope.subscribe("template_files", () => { return [ stateParams_aplicacion, ]; }, {
        onReady: function () {
            // debugger;
            $scope.showProgress = false;
            $scope.$apply();
        },
        onStop: function (error) {
            $scope.showProgress = false;
            // $scope.$apply();
      }
    })
  // --------------------------------------------------------------------------------------------------------------------
}
])
