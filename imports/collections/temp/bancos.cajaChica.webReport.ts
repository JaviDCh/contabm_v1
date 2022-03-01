

import { Mongo } from 'meteor/mongo';

// para registrar las reposiciones que se mostrarán en el report en ContabSysNet (asp.net)
export const Temp_Bancos_CajaChica_webReport = new Mongo.Collection("temp_bancos_cajaChica_webReport");
