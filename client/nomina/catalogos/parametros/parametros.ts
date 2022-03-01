
import * as angular from 'angular';
import * as lodash from 'lodash';

import { Companias } from '../../../../imports/collections/companias';
import { CompaniaSeleccionada } from '../../../../imports/collections/companiaSeleccionada';

// los catálogos-parámetros están en imports; hay que importarlos desde aquí para cargarlos y que existan en el browser 
import '../../../imports/nomina/catalogos/parametros/salarioMinimo/salarioMinimo.html'; 
import '../../../imports/nomina/catalogos/parametros/salarioMinimo/salarioMinimo'; 

import '../../../imports/nomina/catalogos/parametros/anticipoSueldo1raQuinc/anticipoSueldo1raQuinc.html'; 
import '../../../imports/nomina/catalogos/parametros/anticipoSueldo1raQuinc/anticipoSueldo1raQuinc'; 

import '../../../imports/nomina/catalogos/parametros/diasVacacionesPorAno/diasVacacionesPorAno.html'; 
import '../../../imports/nomina/catalogos/parametros/diasVacacionesPorAno/diasVacacionesPorAno'; 

import '../../../imports/nomina/catalogos/parametros/deduccionesIslr/deduccionesIslr.html'; 
import '../../../imports/nomina/catalogos/parametros/deduccionesIslr/deduccionesIslr'; 

import '../../../imports/nomina/catalogos/parametros/deduccionesNomina/deduccionesNomina.html'; 
import '../../../imports/nomina/catalogos/parametros/deduccionesNomina/deduccionesNomina'; 

import '../../../imports/nomina/catalogos/parametros/parametrosNomina/parametrosNomina.html'; 
import '../../../imports/nomina/catalogos/parametros/parametrosNomina/parametrosNomina'; 

angular.module("contabm.nomina").controller("Catalogos_Nomina_Parametros_Controller", ['$scope', function ($scope) {

    $scope.showProgress = true; 

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionadaUser = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaSeleccionada = {};

    if (companiaSeleccionadaUser) { 
        companiaSeleccionada = Companias.findOne(companiaSeleccionadaUser.companiaID,
                                                 { fields: { numero: true, nombre: true, nombreCorto: true } });
    }
          
    $scope.companiaSeleccionada = {};

    if (companiaSeleccionada && !lodash.isEmpty(companiaSeleccionada)) { 
        $scope.companiaSeleccionada = companiaSeleccionada;
    } else { 
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    }

    $scope.showProgress = false; 
}]);