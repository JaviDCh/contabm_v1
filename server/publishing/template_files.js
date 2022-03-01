
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

Meteor.publish('template_files', function(aplicacion, tiposArchivo) {
    // debugger;
    // regresamos registros solo para la cia seleccionada ...
    var companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: this.userId });

    if (!companiaSeleccionada)
        return [];

    // dejamos de filtrar por compañía; la idea es que las plantillas sean 'globales' ...
    if (tiposArchivo) {
        return Files_CollectionFS_Templates.find({
            'metadata.aplicacion': aplicacion,
            'metadata.tipo': { $in: tiposArchivo },
            // 'metadata.cia': companiaSeleccionada.companiaID
        });
    }
    else {
        return Files_CollectionFS_Templates.find({
            'metadata.aplicacion': aplicacion,
            // 'metadata.cia': companiaSeleccionada.companiaID
        });
    };

  });
