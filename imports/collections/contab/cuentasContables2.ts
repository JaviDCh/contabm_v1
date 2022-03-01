


import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';
import { Companias } from '../companias'; 

declare var DumbCollection; 

// para tener un cache en el client del catálogo de cuentas contables ...
export const CuentasContables2 = new DumbCollection('CuentasContables2');

// nótese que usamos el helper en el collection que servirá de cache en el client ...
CuentasContables2.helpers({
  cuentaDescripcionCia: function() {
    return this.cuenta + " " + this.descripcion + " " + Companias.findOne({ numero: this.cia }).abreviatura;
  }
})