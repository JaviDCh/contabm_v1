


import SimpleSchema from 'simpl-schema';
import { Temp_Consulta_Bancos_CajaChica } from '/imports/collections/bancos/temp.bancos.consulta.cajaChica'; 
import { Temp_Consulta_Contab_ActivosFijos } from '/imports/collections/contab/temp.contab.consulta.activosFijos'; 


Meteor.methods({
   getCollectionCount: function (collectionName) {

       // agregamos este método para contar la cantidad de registros que contiene un collection;
       // Nota Importante: no usamos 'tmeasday:publish-counts' pues indica en su documentación que
       // puede ser muy ineficiente si el dataset contiene muchos registros; además, este package
       // es reactive, lo cual agregar un cierto costo a su ejecución ...

       new SimpleSchema({
           collectionName: { type: String }
         }).validate({ collectionName });

        switch (collectionName) {
            case 'Temp_Consulta_Bancos_MovimientosBancarios':
                return Temp_Consulta_Bancos_MovimientosBancarios.find({ user: this.userId }).count();
                break;
            case 'Temp_Bancos_ConciliacionesBancarias_Lista':
                return Temp_Bancos_ConciliacionesBancarias_Lista.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Bancos_Facturas':
                return Temp_Consulta_Bancos_Facturas.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Bancos_Pagos':
                return Temp_Consulta_Bancos_Pagos.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Nomina_RubrosAsignados':
                return Temp_Consulta_Nomina_RubrosAsignados.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro':
                return Temp_Consulta_Nomina_CuentasContablesEmpleadoRubro.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Bancos_Proveedores':
                return Temp_Consulta_Bancos_Proveedores.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Bancos_CuentasContables_Definicion':
                return Temp_Consulta_Bancos_CuentasContables_Definicion.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Bancos_CajaChica':
                return Temp_Consulta_Bancos_CajaChica.find({ user: this.userId }).count();
                break;
            case 'Temp_Consulta_Contab_ActivosFijos':
                return Temp_Consulta_Contab_ActivosFijos.find({ user: this.userId }).count();
                break;
            case 'CuentasContables':
                // para cuentas contables, regresamos el count de todas y no las del usuario; esta no es una tabla 
                // 'temporal' donde guardemos records para alguna consulta ... 
                return CuentasContables.find().count();
                break;
            default:
                return -9999;
        };
   }
})
