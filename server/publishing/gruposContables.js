

import { GruposContables } from '/imports/collections/contab/gruposContables'; 

Meteor.publish('gruposContables', function () {
    return GruposContables.find();
});
