

let filesPath = Meteor.settings.public.collectionFS_path_templates;

Files_CollectionFS_Templates = new FS.Collection("files_collectionFS_templates", {
  stores: [new FS.Store.FileSystem("files_collectionFS_templates", { path: filesPath })],
  // filter: {
  //   allow: {
  //     contentTypes: ['image/*']
  //   }
  // }
});

if (Meteor.isServer) {
    Files_CollectionFS_Templates.allow({
    insert: function (userId) {
      return (userId ? true : false);
    },
    remove: function (userId) {
      return (userId ? true : false);
    },
    download: function () {
      return true;
    },
    update: function (userId) {
      return (userId ? true : false);
    }
  });
};
