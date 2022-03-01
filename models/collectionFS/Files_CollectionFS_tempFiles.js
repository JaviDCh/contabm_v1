

let filesPath = Meteor.settings.public.collectionFS_path_tempFiles;

Files_CollectionFS_tempFiles = new FS.Collection("files_collectionFS_tempFiles", {
  stores: [new FS.Store.FileSystem("files_collectionFS_tempFiles", { path: filesPath })],
  // filter: {
  //   allow: {
  //     contentTypes: ['image/*']
  //   }
  // }
});

if (Meteor.isServer) {
    Files_CollectionFS_tempFiles.allow({
    download: function () {
      return true;
    }
  });
};
