
import moment from 'moment';

angular.module("contabm").factory('leerTablasImpuestos_service', ['$q', function($q) {

    let leerTablasImpuestos = function() {
        let deferred = $q.defer();

        // este factory regresa dos tablas que son usadas por el proceso de registro de facturas: la tabla de
        // definición de impuestos y retenciones y la tabla de tipos de alicuota Iva
        Meteor.call('leerTablas.impuestosRetencionesDefinicion.alicuotasIva', function (error, result) {
                if (error) {
                    deferred.resolve({ error: true, message: error, });
                } else {

                    let tablas = JSON.parse(result);

                    if (!_.isArray(tablas.impuestosRetencionesDefinicion) || !tablas.impuestosRetencionesDefinicion.length) {
                        let errorMessage = `Error: no hemos encontrado registros en la tabla <em>Definiciones de impuestos y retenciones</em>.
                        En esta tabla existe la configuración del impuesto Iva y las retenciones, de Iva e Islr.
                        Ud. debe abrir esta tabla en <em>Bancos / Catálogos</em> e indicar allí la
                        configuración que se ha mencionado.
                        `;
                        deferred.resolve({ error: true, message: errorMessage, });
                    };

                    if (!_.isArray(tablas.tiposAlicuotaIva) || !tablas.tiposAlicuotaIva.length) {
                        let errorMessage = `Error: no hemos encontrado registros en la tabla <em>Tipos de alícuota para el impuesto Iva</em>.
                        Ud. debe abrir esta tabla en <em>Bancos / Catálogos</em> e indicar allí la
                        configuración adecuada.
                        `;
                        deferred.resolve({ error: true, message: errorMessage, });
                    };

                    let impuestosRetencionesDefinicion = tablas.impuestosRetencionesDefinicion;
                    let tiposAlicuotaIva = tablas.tiposAlicuotaIva;

                    // nótese como al deserializar los registros, las fechas permanecen como strings
                    tiposAlicuotaIva.map((x) => {
                        x.Fecha = moment(x.Fecha).toDate();
                        return x;
                    });

                    deferred.resolve({
                        impuestosRetencionesDefinicion: impuestosRetencionesDefinicion,
                        alicuotasIva: tiposAlicuotaIva,
                    });
                };
            });

            return deferred.promise;
        };

    return {
        leerTablasImpuestos: leerTablasImpuestos,
    };

}]);
