

import { UnidadTributaria } from '../../imports/collections/bancos/unidadTributaria';

Meteor.publish('unidadTributaria', function () {
        return [
            UnidadTributaria.find(),
        ];
})
