
Meteor.methods(
{
    eventDDP_matchEmit: function (methodName, selector, eventData) {
        // debugger;

        // Nota: el objetivo que tuvimos al agregar este method fue poder emitir estos eventos desde una función Javascript
        // que se ejecutara en el server; aparentemente, estos eventos deben ser ejecutados desde Meteor Methods. Como
        // necesitabamos enviar estos eventos desde una función JS, en el server, agregamos este method para que la función
        // lo ejecutara ...

        // selector: para que solo algún cliente, específico (con este selector), lo reciba
        // eventData: son los datos que llegaran al cliente con el evento

        // ejemplo de selector: { myuserId: this.userId, app: 'bancos', process: 'cierreBancos' },
        // ejemplo de eventData: { current: currentProcess, max: numberOfProcess, progress: '0 %',
        //                         message: `Cerrando el mes ${nombreMes(mes)} ... `}

        EventDDP.matchEmit(methodName, selector, eventData);
    }
});
