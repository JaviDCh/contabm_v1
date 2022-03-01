

import { Bancos } from 'imports/collections/bancos/bancos';

Meteor.publish('bancos', function () {
    return Bancos.find(); 
})