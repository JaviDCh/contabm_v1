
import * as lodash from 'lodash'; 
import { Meteor } from 'meteor/meteor';

export const userHasRole = function(rolesArray) {

    if (!lodash.isArray(rolesArray) || !rolesArray.length) {
        return false;
    }

    let user = {} as any;
    user = Meteor.user();

    if (!user) { 
        return false;
    }
        
    if (user && user.emails && user.emails.length > 0) { 
        let userIsAdmin = lodash.some(user.emails, (email: any) => { return email.address == "admin@admin.com"; }); 
        if (userIsAdmin) { 
            return true;
        }
    }
            
    if (!user.roles) { 
        // el usuario no es admin, pero no tiene roles asignados ... esto no debe ocurrir (???)
        return false;
    }
        
    // mostramos todas las opciones a usuarios en el rol 'admin'
    let userIsAdmin = lodash.find(user.roles, r => { return r === "admin"; }); 
    if (userIsAdmin) { 
        // el usuario no es 'admin@admin.com', pero tiene el rol 'admin' asignado ... 
        return true;
    }
        
    // si el usuario tiene solo uno de los roles en el array, regresamos true ...
    let returnValue = false;
    rolesArray.forEach((rol) => {
        var found = lodash.find(user.roles, (r) => { return r === rol; });
        if (found) {
            returnValue = true;
            return false;
        }
    })

    return returnValue;
}