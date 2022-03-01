

import * as angular from 'angular';

// importamos controllers y plantillas que pueden ser usados en 'children' angular modules  
import '/client/imports/bancos/catalogos/categoriasRetencion/categoriasRetencion.html'; 
import '/client/imports/bancos/catalogos/categoriasRetencion/categoriasRetencion';

import '/client/imports/bancos/catalogos/unidadTributaria/unidadTributaria.html'; 
import UnidadTributariaController from '/client/imports/bancos/catalogos/unidadTributaria/unidadTributaria';

angular.module("contabm.bancos", [ 'contabm.bancos.catalogos', 'categoriasRetencion', UnidadTributariaController.name ]);
