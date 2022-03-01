
import lodash from 'lodash';

// tomamos este código desde Internet para agrupar, siempre con lodash, por más de un key ...
// TODO: cuando ésto funcione, debemos agregar el código que permite agrupar el objecto por su (única) key ...
let groupByMulti = (collection, keys) => {
    if (!keys.length) {
      return collection;
    }
    else {
      return lodash(collection).groupBy(keys[0]).mapValues(function(values) {
        return groupByMulti(values, keys.slice(1));
      }).value();
  };
};

Global_Methods.groupByMulti = groupByMulti;
