

import angular from 'angular';
import angularMeteor from 'angular-meteor';

import templateUrl from './administracion_utilitarios.html';

import { Companias } from '/imports/collections/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

class Administracion_Utilitarios {

  constructor($scope, $reactive) {

    // $reactive(this).attach($scope);

    // ------------------------------------------------------------------------------------------------
    // leemos la compañía seleccionada
    let companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: Meteor.userId() });
    let companiaContabSeleccionada = {};

    if (companiaSeleccionada)
        companiaContabSeleccionada = Companias.findOne(companiaSeleccionada.companiaID, { fields: { numero: true, nombre: true, nombreCorto: true } });

    $scope.companiaSeleccionada = {};

    if (companiaContabSeleccionada)
        $scope.companiaSeleccionada = companiaContabSeleccionada;
    else
        $scope.companiaSeleccionada.nombre = "No hay una compañía seleccionada ...";
    // -----------------------------------------------------------------------------------------------
  }
}

// nótese como injectamos los dependencies; la otra forma es usar ng-annotate ...
// Administracion_Utilitarios.$inject = ['$scope', '$reactive']

const name = 'Administracion_Utilitarios';

export default angular.module(name, [
  angularMeteor
]).component(name, {
  templateUrl,
  // controllerAs: name,
  controller: Administracion_Utilitarios
}).config(config);

function config($stateProvider) {

  $stateProvider
    .state('administracion.utilitarios', {
      url: '/administracion/utilitarios',
      template: '<Administracion_Utilitarios></Administracion_Utilitarios>',
      parent: 'administracion'
    });
}
