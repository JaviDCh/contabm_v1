
import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { DialogModal } from '/client/generales/angularGenericModal'; 

angular.module("contabm").controller("SeleccionarCompaniaController", ['$scope', '$stateParams', '$meteor', '$modal',
function ($scope, $stateParams, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      };

      let companiaSeleccionada = {};

      $scope.seleccionarCompania_ui_grid = {
          enableSorting: false,
          showColumnFooter: false,
          enableCellEdit: false,
          enableCellEditOnFocus: true,
          enableRowSelection: true,
          enableRowHeaderSelection: true,
          multiSelect: false,
          enableSelectAll: true,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {
              // guardamos el row que el usuario seleccione
              gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                  //debugger;
                  companiaSeleccionada = {};

                  if (row.isSelected)
                      companiaSeleccionada = row.entity;
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

      $scope.seleccionarCompania_ui_grid.columnDefs = [
            {
                name: 'nombre',
                field: 'nombre',
                displayName: 'Compañía',
                width: 300,
                headerCellClass: 'ui-grid-leftCell',
                cellClass: 'ui-grid-leftCell',
                enableColumnMenu: false,
                enableCellEdit: false,
                type: 'string'
            }
      ];


      // -------------------------------------------------------------------------------------------------
      // compañías permitidas: para algunas usuarios, el administrador puede asignar solo algunas compañías; el
      // resto estarían restringidas para el mismo. Las agregamos en un array y regeresamos solo éstas, para que
      // el usuario solo pueda seleccionar en ese grupo ...
      let companiasPermitidas = [];
      let currentUser = Meteor.users.findOne(Meteor.userId());

      if (currentUser) {
          if (currentUser.companiasPermitidas) {
              currentUser.companiasPermitidas.forEach((companiaID) => {
                  companiasPermitidas.push(companiaID)
              });
          };
      };

      let companiasFilter = companiasPermitidas.length ?
                            { _id: { $in: companiasPermitidas }} :
                            { _id: { $ne: "xyz_xyz" }};
      // -------------------------------------------------------------------------------------------------


        $scope.helpers({
            companias: () => {
              return Companias.find(companiasFilter);
            },
        })

      $scope.seleccionarCompania_ui_grid.data = $scope.companias;

      let ciaSeleccionadaAntes = $meteor.object(CompaniaSeleccionada, {}, false);

      if (ciaSeleccionadaAntes && ciaSeleccionadaAntes.companiaID) {
          // el usuario ya tenía una compañía seleccionada; lo indicamos ...
          $scope.companias.forEach(function (compania, index) {
              if (compania._id == ciaSeleccionadaAntes.companiaID) {
                  //$scope.gridOptions.selectRow(2, true);

                  $scope.alerts.length = 0;
                  $scope.alerts.push({
                      type: 'info',
                      msg: "La compañía <b><em>" + compania.nombre + "</em></b> está ahora seleccionada."
                  });
              }
          })
      }


      $scope.seleccionarCompania = function () {
          if (!companiaSeleccionada || _.isEmpty(companiaSeleccionada)) {
              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'danger',
                  msg: "Ud. debe seleccionar una compañía en la lista.<br />" +
                       "Aparentemente, Ud. no ha seleccionado aún una compañía en la lista."
              })
          }
          else {

              // eliminamos cualquier cia seleccionada que pueda tener ahora el usuario
              var companiasAhoraSeleccionadas = CompaniaSeleccionada.find({ userID: Meteor.userId() }).fetch();  // debería ser una sola!
              companiasAhoraSeleccionadas.forEach(function (item) {
                  CompaniaSeleccionada.remove(item._id);
              });

              CompaniaSeleccionada.insert({ userID: Meteor.userId(), companiaID: companiaSeleccionada._id });

              $scope.alerts.length = 0;
              $scope.alerts.push({
                  type: 'info',
                  msg: "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada."
              });


              DialogModal($modal,
                  "<em>Selección de compañías</em>",
                  "Ok, la compañía <b><em>" + companiaSeleccionada.nombre + "</em></b> ha sido seleccionada.",
                  false).then();
          }
      }
  }
])
