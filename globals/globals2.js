

import numeral from 'numeral';
import moment from 'moment';

// switch between languages
numeral.register('locale', 'es', {
    delimiters: {
        thousands: '.',
        decimal: ','
    }
});

// DdpEvents = new EventDDP('raix:push');
EventDDP = new EventDDP('test');

// switch between locales
numeral.locale('es')
moment.locale('es'); // change the global locale to Spanish