
// nota: angular no hece los bindings en forma correcta cuando el id en el modelo es de tipo diferente a
// string, por ejemplo un número. Con este directive se resuelve este problema ...

// luego, en el select, se agrega el directive así:
// <select class="form-control-small"
//         ng-model="view.activeResource.ValueType"
//         convert-to-number>
//     <option value="0">Text</option>
// </select>

angular.module("contabm").directive('convertToNumber', function() {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(val) {
                return parseInt(val, 10);
            });
            ngModel.$formatters.push(function (val) {
                return '' + val;
            });
        }
    };
});
