

import * as angular from 'angular';

// Nota: dese este módulo Angular se importan plantillas (html) y controllers que son necesarios por otros módulos 
// que son children de este módulo ... 
import '../../imports/contab/catalogos/centrosCosto/centrosCosto.html'; 
import CentrosCostoController from '../../imports/contab/catalogos/centrosCosto/centrosCosto'; 

angular.module("contabm.contab", [ 'contabm.contab.catalogos', 'centrosCosto', CentrosCostoController.name ]);
