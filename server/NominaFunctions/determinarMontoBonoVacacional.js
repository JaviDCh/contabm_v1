

let  determinarMontoBonoVacacional = (empleado, sueldoEmpleado, cantidadDiasBonoVacacional) => {

    let baseBonoVacacional = 0;

    if (empleado.bonoVacAgregarSueldoFlag)
        baseBonoVacacional += sueldoEmpleado;

    if (empleado.bonoVacAgregarMontoCestaTicketsFlag)
        if (empleado.montoCestaTickets)
            baseBonoVacacional += empleado.montoCestaTickets;

    if (empleado.bonoVacAgregarMontoAdicionalFlag)
        if (empleado.bonoVacacionalMontoAdicional)
            baseBonoVacacional += empleado.bonoVacacionalMontoAdicional;

    let montoBonoVacacional = baseBonoVacacional / 30 * cantidadDiasBonoVacacional;
    // TODO: creo que ésto lo hicimos antes; buscar como lo hicimos y aplicar aquí ...
    // montoBonoVacacional = Math.Round(montoBonoVacacional, 2);

    return {
        error: false,
        montoBonoVacacional: montoBonoVacacional,
        baseBonoVacacional: baseBonoVacacional, 
    };
};


NominaFunctions.determinarMontoBonoVacacional = determinarMontoBonoVacacional;
