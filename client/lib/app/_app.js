
  // este archivo es el que se carga primero en el cliente ... meteor carga el contenido de client/lib antes
  // que cualquier otro archivo que exista en cualquier otro directorio (en el cliente) ...

  // la idea es que angular.module("contabm"), que representa nuestra angular app, se inicialize de primero
  // y esté disponible a lo largo de cualquier código en la aplicación
  import angular from 'angular';
  import angularMeteor from 'angular-meteor';
  // import uiRouter from 'angular-ui-router';
  import uiRouter from '@uirouter/angularjs';

  import 'angular-ui-grid';

  // nótese que importamos los assets de npm packages ...
  import 'angular-ui-grid/ui-grid.css';

  angular.module("contabm", [ angularMeteor, uiRouter, 'ui.bootstrap', 'accounts.ui',
                                'ui.grid', 'ui.grid.edit', 'ui.grid.cellNav',
                                'ui.grid.resizeColumns', 'ui.grid.selection',
                                'ui.grid.pinning', 'contabm.contab', 'contabm.bancos', 
                                "contabm.nomina"
                            ]);
