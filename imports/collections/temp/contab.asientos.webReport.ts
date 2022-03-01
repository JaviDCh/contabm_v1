
import { Mongo } from 'meteor/mongo';

// estos collections, temp..., son usados para guardar datos muy perecederos, para producir consultas, listados, etc.
// por esa razón, no nos preocupamos por agregar un schema (simple-schema / collection2)
const Temp_contab_asientos_webReport = new Mongo.Collection('temp_contab_asientos_webReport');
const Temp_contab_asientos_webReport_config = new Mongo.Collection('temp_contab_asientos_webReport_config');

export { Temp_contab_asientos_webReport, Temp_contab_asientos_webReport_config };
