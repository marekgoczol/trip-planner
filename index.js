(function() {
    var tripPlanner = angular.module('trip-planner', [
        'ui.router'
    ]);

    tripPlanner.factory('Deals', require('./trip-planner/deals-service.js'));

    tripPlanner.config(function($stateProvider, $urlRouterProvider) {

        $stateProvider.state('root', {
            abstract: true,
            resolve: {
                deals: function(Deals) {
                    return Deals.get();
                }
            }
        });

        $stateProvider.state('root.search', {
            url: '/search',
            views: {
                'content@': {
                    template: require('./trip-planner/search.html'),
                    controller: require('./trip-planner/controller.js'),
                    resolve: {
                        destinations: function(deals) {
                            var destinations = [];

                            _.each(deals, function(deal) {
                                if (destinations.indexOf(deal.arrival) === -1) {
                                    destinations.push(deal.arrival);
                                }
                            });

                            return destinations;
                        },
                        cheapestGraph: function(Deals, deals, destinations) {
                            return Deals.createGraph(deals, destinations, true);
                        },
                        fastestGraph: function(Deals, deals, destinations) {
                            return Deals.createGraph(deals, destinations, false);
                        }
                    }
                }
            }
        });

        $urlRouterProvider.otherwise('/search');
    });
})();
