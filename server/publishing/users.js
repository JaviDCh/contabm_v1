
Meteor.publish('allUsers', function () {

    // debugger;
    // fallamos con un error si el usuario no tiene el rol admin

    let currentUser = Meteor.users.findOne(this.userId);

    if (!currentUser || !_.isArray(currentUser.roles))
        return null;

    rolAdmin = _.find(currentUser.roles, rol => { return rol === 'admin'; });

    // if (!rolAdmin)
    //     return null;

    return Meteor.users.find();
});

Meteor.publish('meteorUsers', function () {
    return Meteor.users.find();
});
