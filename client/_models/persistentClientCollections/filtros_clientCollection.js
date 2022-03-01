
Filtros_clientColl = new Meteor.Collection(null);

// create a local persistence observer
var Filtros_clientColl_Observer = new LocalPersist(Filtros_clientColl, 'Filtros');
