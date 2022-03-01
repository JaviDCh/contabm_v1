

angular.module("contabm").config(['$urlRouterProvider', '$stateProvider', '$locationProvider',
  function ($urlRouterProvider, $stateProvider, $locationProvider) {

        $locationProvider.html5Mode(true);

          $stateProvider
            .state('home', {
                url: '/',
                templateUrl: 'client/main.html',
                controller: 'MainController'
        })

        $urlRouterProvider.otherwise("/");
  }
]);
