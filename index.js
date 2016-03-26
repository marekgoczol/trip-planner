(function() {
    var tripPlanner = angular.module('trip-planner', [
        'ui.router'
    ]);

    tripPlanner.factory('Deals', require('./trip-planner/deals-service.js'));

    tripPlanner.config(function($stateProvider, $urlRouterProvider) {

        $stateProvider.state('search', {
            url: '/search',
            views: {
                'content@': {
                    template: require('./trip-planner/search.html'),
                    controller: require('./trip-planner/controller.js'),
                    resolve: {
                        deals: function(Deals) {
                            return Deals.get();
                        },
                        destinations: function(deals) {
                            var destinations = [];

                            _.each(deals.deals, function(deal) {
                                if (destinations.indexOf(deal.arrival) === -1) {
                                    destinations.push(deal.arrival);
                                }
                            });

                            return destinations;
                        }
                    }
                }
            }
        });

        $urlRouterProvider.otherwise('/search');
    });
})();
