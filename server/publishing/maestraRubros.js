
Meteor.publish('maestraRubros', function () {
        return [
            MaestraRubros.find(),
        ];
});
