

  Meteor.publish(null, function () {
      if (this.userId) {
          return Meteor.users.find({ _id: this.userId }, {fields: { companiasPermitidas: 1}});
        }
        else {
          this.ready();
       };
  });
