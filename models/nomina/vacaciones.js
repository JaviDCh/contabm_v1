
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

 let schema = new SimpleSchema({
     _id: { type: String, optional: false },

      // id en contab. Lo seguimos usando en mongo pues la vacación se relaciona a la nómina por
      // este número. No podemos usar el _id pues no es numérico ...
     claveUnicaContab: { type: Number, label: "Clave única (en Contab)", optional: false },

     // datos del empleado
     empleado: { type: Number, label: "Empleado", optional: false },
     fechaIngreso: { type: Date, label: "Fecha de ingreso", optional: true, },
     grupoNomina: { type: Number, label: "Grupo de nómina", optional: false },
     sueldo: { type: Number, label: "Sueldo", optional: true, },

     // disfrute de las vacaciones
     salida: { type: Date, label: "Fecha salida", optional: false, },
     regreso: { type: Date, label: "Fecha regreso", optional: false, },
     fechaReintegro: { type: Date, label: "Fecha reintegro", optional: false, },
     cantDiasDisfrute_Feriados: { type: Number, label: "Vacaciones: cant días feriados", optional: true },
     cantDiasDisfrute_SabDom: { type: Number, label: "Vacaciones: cant días sab/dom", optional: true },
     cantDiasDisfrute_Habiles: { type: Number, label: "Vacaciones: cant días hábiles", optional: true },
     cantDiasDisfrute_Total: { type: Number, label: "Vacaciones: total cant días", optional: false },

     // pago de las vacaciones
     periodoPagoDesde: { type: Date, label: "Período de pago - desde", optional: true, },
     periodoPagoHasta: { type: Date, label: "Período de pago - hasta", optional: true, },
     cantDiasPago_Feriados: { type: Number, label: "Pago nómina - Cant días feriados", optional: true },
     cantDiasPago_SabDom: { type: Number, label: "Pago nómina - Cant días sab/dom", optional: true },
     cantDiasPago_Habiles: { type: Number, label: "Pago nómina - Cant días hábiles", optional: true },
     cantDiasPago_YaTrabajados: { type: Number, label: "Pago nómina - Cant días ya trabajados", optional: true },
     cantDiasPago_Total: { type: Number, label: "Pago nómina - Cant días totales", optional: true },
     cantDiasPago_Bono: { type: Number, label: "Pago nómina - Cant días bono", optional: true },
     baseBonoVacacional: { type: Number, label: "Base para el cálculo del bono", optional: true, },
     montoBono: { type: Number, label: "Monto del bono vacacional", optional: true, },
     aplicarDeduccionesFlag: { type: Boolean, label: "pago nómina: aplicar deducciones de nómina?", optional: true, },
     cantDiasDeduccion: { type: Number, label: "pago nómina: deducciones nómina: cant días", optional: true },

     // nómina en la cual se aplicará la vacación
     fechaNomina: { type: Date, label: "Fecha de nómina de ejecución", optional: true, },
     obviarEnLaNominaFlag: { type: Boolean, label: "Excluir en nóminas (normales) mientras esté de vacaciones", optional: true, },
     desactivarNominaDesde: { type: Date, label: "Excluir de nominas - desde", optional: true, },
     desactivarNominaHasta: { type: Date, label: "Excluir de nominas - hasta", optional: true, },

     // próxima nómima (normal) de pago (al regreso)
     proximaNomina_FechaNomina: { type: Date, label: "Fecha de nómina de regreso", optional: true, },
     proximaNomina_AplicarDeduccionPorAnticipo: { type: Boolean, label: "Próx nómina: aplicar deducción por anticipo de días", optional: true, },
     proximaNomina_AplicarDeduccionPorAnticipo_CantDias: { type: Number, label: "Próx nómina: aplicar deducción por anticipo: cant días", optional: true },
     proximaNomina_AplicarDeduccionesLegales: { type: Boolean, label: "Próx nómina: aplicar deducciones legales (islr, pf, ...)", optional: true, },
     proximaNomina_AplicarDeduccionesLegales_CantDias: { type: Number, label: "Próx nómina: aplicar deducciones legales: cant días", optional: true },

     // datos del año de la vacación
     anoVacaciones: { type: Number, label: "Año de vacaciones (1, 2, 3, ...)", optional: false },
     numeroVacaciones: { type: Number, label: "Número, en el año, de la vacación (1, 2, 3, ...)", optional: false },
     anoVacacionesDesde: { type: Date, label: "Año de vacaciones: inicio", optional: true, },
     anoVacacionesHasta: { type: Date, label: "Año de vacaciones: fin", optional: true, },

     // datos para el control de días pendientes
     cantDiasVacPendAnosAnteriores: { type: Number, label: "Días pend - años anteriores", optional: true },
     cantDiasVacSegunTabla: { type: Number, label: "Cant días vac según tabla", optional: true },
     cantDiasVacDisfrutadosAntes: { type: Number, label: "Cant días disfrutados vac anteriores - este año", optional: true },
     cantDiasVacDisfrutadosAhora: { type: Number, label: "Cant días disfrutados estas vac", optional: true },
     cantDiasVacPendientes: { type: Number, label: "Cant días vac pendientes", optional: true },

     cia: { type: Number, label: "Cia Contab", optional: false },                   // no existía en Contab
     docState: { type: Number, optional: true },

     // nota: pareciera que estos campos, aunque en la tabla (sql), no se usan (???)
    //  CantDiasAdicionales: { type: Number, label: "Número", optional: true },
    //  BonoVacacionalFlag: { type: Boolean, label: "Número", optional: true, },
    //  ObviarEnLaNominaFlag: { type: Boolean, label: "Excluir en nóminas mientras esté de vacaciones", optional: true, },
    //  PeriodoPagoDias { type: Number, label: "Número", optional: false },
 });

 Vacaciones = new Mongo.Collection("vacaciones");
 Vacaciones.attachSchema(schema);
