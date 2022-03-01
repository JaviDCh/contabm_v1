
// nótese que no tenemos un schema (simple_schema/collection2) para este collection; solo lo usamos para hacer
// alguna consulta y no usamos un schema para asegurarnos que la estructura de cada document sea apropiada;
// grabamos a mongo y leemos desde el cliente y producimos la consulta ...

import { Mongo } from 'meteor/mongo';

Temp_Consulta_AsientosContables2 = new Mongo.Collection("temp_consulta_asientosContables2");
