
import * as lodash from 'lodash';

import { Monedas } from 'imports/collections/monedas';
import { Companias } from 'imports/collections/companias';
import { Proveedores } from 'imports/collections/bancos/proveedoresClientes'; 
import { Bancos } from 'imports/collections/bancos/bancos';
import { Chequeras } from 'imports/collections/bancos/chequeras'; 
import { TiposProveedor, FormasDePago } from 'imports/collections/bancos/catalogos'; 

import { ConciliacionesBancarias_movimientosPropios, } from 'imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosCuentaContable, } from 'imports/collections/bancos/conciliacionesBancarias';
import { ConciliacionesBancarias_movimientosBanco } from 'imports/collections/bancos/conciliacionesBancarias'; 

declare var FS;         // used when does not exist a ts declaration file

// import { Accounts } from 'meteor/accounts-base';     // this does not seem to work (??) 
declare var Accounts;   // just to get rid of 'cannot find Account' from ts compiler 

Accounts.onCreateUser(function(options, user) {
    // debugger;
  // para agregar el rol 'admin' cuando el usuario crea el administrador
  if (user.emails && lodash.some(user.emails, (email: any) => { return email.address === 'admin@admin.com'; } )) {
      if (!user.roles || !lodash.some(user.roles, (rol) => { return rol === 'admin'; } )) {
          user.roles = [];
          user.roles.push('admin');
      }
  }

  return user;
});

Meteor.startup(function() {
    FS.TempStore.setMaxListeners(0);

    // usamos este espacio para agregar indeces, cuando no existen, en collecions en mongodb 
    Companias._ensureIndex({ numero: 1 });
    Monedas._ensureIndex({ moneda: 1 });
    Bancos._ensureIndex({ banco: 1 });
    Chequeras._ensureIndex({ numeroChequera: 1 });
    Proveedores._ensureIndex({ proveedor: 1 });
    TiposProveedor._ensureIndex({ tipo: 1 });
    FormasDePago._ensureIndex({ formaDePago: 1 });

    ConciliacionesBancarias_movimientosPropios._ensureIndex({ "conciliacionID": 1 });
    ConciliacionesBancarias_movimientosCuentaContable._ensureIndex({ "conciliacionID": 1 });
    ConciliacionesBancarias_movimientosBanco._ensureIndex({ "conciliacionID": 1 });
})
