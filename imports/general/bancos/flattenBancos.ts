
import * as lodash from 'lodash';

import { Monedas } from '../../collections/monedas';
import { Companias } from '../../collections/companias';
import { Bancos } from '../../collections/bancos/bancos';

// ---------------------------------------------------------------------------------------------------
// tal como existe en mongodb, Bancos contiene Agencias y, cada agencia, contiene Cuentas bancarias
// la función que sigue intenta crear un array en el cual cada item es una cuenta bancaria con sus
// datos más importantes: banco, moneda, etc.
export const FlattenBancos = function (ciaContab) {

    let cuentasBancarias = [];

    let monedas = Monedas.find().fetch();
    let bancos = Bancos.find().fetch();
    let companias = Companias.find().fetch();

    lodash.each(Bancos.find().fetch(), (banco: any) => {

        if (banco.agencias && lodash.isArray(banco.agencias) && banco.agencias.length) {
            lodash.each(banco.agencias, (agencia: any) => {

                if (agencia.cuentasBancarias && lodash.isArray(agencia.cuentasBancarias) && agencia.cuentasBancarias.length) {
                    lodash.each(agencia.cuentasBancarias, (cuenta: any) => {
                        // puede o no venir una ciaContab ...
                        if (ciaContab && cuenta.cia === ciaContab.numero) {
                            let cuentaBancaria = {
                                cuentaInterna: cuenta.cuentaInterna,
                                cuentaBancaria: cuenta.cuentaBancaria,
                                cuentaContable: cuenta.cuentaContable ? cuenta.cuentaContable : null,
                                moneda: cuenta.moneda,
                                simboloMoneda: lodash.find(monedas, (x: any) => { return x.moneda === cuenta.moneda; }).simbolo,
                                banco: banco.banco,
                                nombreBanco: lodash.find(bancos, (x: any) => { return x.banco === banco.banco; }).abreviatura,
                                cia: cuenta.cia,
                                nombreCia: lodash.find(companias, (x: any) => { return x.numero === cuenta.cia; }).abreviatura,
                            } as never;
                            cuentasBancarias.push(cuentaBancaria);
                        } else if (!ciaContab) {
                            let cuentaBancaria = {
                                cuentaInterna: cuenta.cuentaInterna,
                                cuentaBancaria: cuenta.cuentaBancaria,
                                cuentaContable: cuenta.cuentaContable ? cuenta.cuentaContable : null,
                                moneda: cuenta.moneda,
                                simboloMoneda: lodash.find(monedas, (x: any) => { return x.moneda === cuenta.moneda; }).simbolo,
                                banco: banco.banco,
                                nombreBanco: lodash.find(bancos, (x: any) => { return x.banco === banco.banco; }).abreviatura,
                                cia: cuenta.cia,
                                nombreCia: lodash.find(companias, (x: any) => { return x.numero === cuenta.cia; }).abreviatura,
                            } as never; 
                            cuentasBancarias.push(cuentaBancaria);
                        };
                    });
                };
            });
        };
    });

    return cuentasBancarias;
};
