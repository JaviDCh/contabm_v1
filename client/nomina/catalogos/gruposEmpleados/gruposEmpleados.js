

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { GruposEmpleados } from '/models/nomina/catalogos'; 

// let gruposEmpleados_SimpleSchema = new SimpleSchema({
//     _id: { type: String, optional: false },
//     grupo: { type: Number, label: "ID en contab", optional: false, },
//     nombre: { type: String, label: "Nombre del grupo", optional: false, min: 1, max: 10, },
//     descripcion: { type: String, label: "Descripcion del grupo", optional: false, min: 1, max: 250, },
//     grupoNominaFlag: { type: Boolean, label: "Grupo de nómina?", optional: false, },

//     empleados: { type: Array, optional: true, minCount: 0, },
//     'empleados.$': { type: gruposEmpleados_Empleados_SimpleSchema },

//     cia:  { type: Number, label: "Cia Contab", optional: false },
// })

// export const GruposEmpleados = new Mongo.Collection("gruposEmpleados");
// GruposEmpleados.attachSchema(gruposEmpleados_SimpleSchema);

// Este controller (angular) se carga con la página primera del programa
angular.module("contabm").controller("Catalogos_Nomina_GruposEmpleados_Controller",
['$scope', '$meteor', '$modal', function ($scope, $meteor, $modal) {

      $scope.showProgress = false;

      // ui-bootstrap alerts ...
      $scope.alerts = [];

      $scope.closeAlert = function (index) {
          $scope.alerts.splice(index, 1);
      }

      // ------------------------------------------------------------------------------------------------
      // leemos la compañía seleccionada
      let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
      $scope.companiaSeleccionada = {};

      if (companiaSeleccionada) { 
        $scope.companiaSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });
      }
      // ------------------------------------------------------------------------------------------------

      let grupoEmpleadosSeleccionado = {};

      $scope.gruposEmpleados_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,

          enableRowSelection: true,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 0,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            //   // marcamos el contrato como actualizado cuando el usuario edita un valor
            //   gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
            //       if (newValue != oldValue)
            //           if (!rowEntity.docState)
            //               rowEntity.docState = 2;
            //   });

            gridApi.selection.on.rowSelectionChanged($scope, function (row) {
                //debugger;
                grupoEmpleadosSeleccionado = {};

                if (row.isSelected) {
                    grupoEmpleadosSeleccionado = row.entity;

                    $scope.empleados_ui_grid.data = [];
                    $scope.empleados_ui_grid.data = grupoEmpleadosSeleccionado.empleados;
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


      $scope.gruposEmpleados_ui_grid.columnDefs = [
          {
              name: 'nombre',
              field: 'nombre',
              displayName: 'Grupo',
              width: "*",
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
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'string'
          },
          {
              name: 'grupoNominaFlag',
              field: 'grupoNominaFlag',
              displayName: 'Grupo de nómina',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'boolean'
          },
          {
              name: 'cia',
              field: 'cia',
              displayName: 'Cia contab',
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'companiaAbreviaturaFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
      ];

      
      $scope.empleados_ui_grid = {

          enableSorting: true,
          showColumnFooter: false,
        //   enableCellEdit: false,
        //   enableCellEditOnFocus: false,
          enableRowSelection: false,
          enableRowHeaderSelection: false,
          multiSelect: false,
          enableSelectAll: false,
          selectionRowHeaderWidth: 35,
          rowHeight: 25,

          onRegisterApi: function (gridApi) {

            //   // marcamos el contrato como actualizado cuando el usuario edita un valor
            //   gridApi.edit.on.afterCellEdit($scope, function (rowEntity, colDef, newValue, oldValue) {
            //       if (newValue != oldValue)
            //           if (!rowEntity.docState)
            //               rowEntity.docState = 2;
            //   });
          },
          // para reemplazar el field '$$hashKey' con nuestro propio field, que existe para cada row ...
          rowIdentity: function (row) {
              return row._id;
          },
          getRowIdentity: function (row) {
              return row._id;
          }
      };


      $scope.empleados_ui_grid.columnDefs = [
          {
              name: 'empleado',
              field: 'empleado',
              displayName: 'Empleado',
              width: "*",
              headerCellClass: 'ui-grid-leftCell',
              cellClass: 'ui-grid-leftCell',
              cellFilter: 'empleadoFilter', 
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'number'
          },
          {
              name: 'suspendidoFlag',
              field: 'suspendidoFlag',
              displayName: 'Suspendido',
              width: "*",
              headerCellClass: 'ui-grid-centerCell',
              cellClass: 'ui-grid-centerCell',
              cellFilter: 'boolFilter',
              enableColumnMenu: false,
              enableCellEdit: false,
              enableSorting: true,
              type: 'boolean'
          },
      ];


      $scope.helpers({
            gruposEmpleados: () => {
                return GruposEmpleados.find({ cia: $scope.companiaSeleccionada.numero }, { sort: { nombre: 1 } });
            },
      });

      $scope.gruposEmpleados_ui_grid.data = $scope.gruposEmpleados;
      $scope.empleados_ui_grid.data = [];
}
]);
