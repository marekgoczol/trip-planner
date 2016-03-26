(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

                            angular.forEach(deals, function(deal) {
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

},{"./trip-planner/controller.js":2,"./trip-planner/deals-service.js":3,"./trip-planner/search.html":4}],2:[function(require,module,exports){
module.exports = function($scope, Deals, destinations, deals, cheapestGraph, fastestGraph) {
    $scope.destinations = destinations;
    $scope.searchType = 'cheapest';

    $scope.search = function() {
        var path;

        switch ($scope.searchType) {
            case 'cheapest':
                path = Deals.findShortesPath($scope.from, $scope.to, cheapestGraph);
                break;
            case 'fastest':
                path = Deals.findShortesPath($scope.from, $scope.to, fastestGraph);
                break;
            default:
                path = Deals.findShortesPath($scope.from, $scope.to, cheapestGraph);
        }

        var totalTime = 0;
        var totalCost = 0;
        for (var i = 0; i < path.length; i++) {
            totalTime += path[i].durationInMinutes;
            totalCost += path[i].cost;
        }

        $scope.path = path;
        $scope.pathDetails = {
            'totalTime': Deals.minutesToHuman(totalTime),
            'totalCost': totalCost
        };
    };

};

},{}],3:[function(require,module,exports){
module.exports = function($http) {
    var Deals = {
        get: function() {
            return $http.get('/response.json').then(function(res) {
                return res.data.deals;
            });
        },

        durationToMinutes: function(h,m) {
            return parseInt(h,10) * 60 + parseInt(m, 10);
        },

        minutesToHuman: function(minutes) {
            return { 
                'h': Math.floor(minutes / 60),
                'm': minutes % 60
            };
        },

        createGraph: function(deals, destinations, cheapest) {
            var vertices = {};
            var verticesWithData = {};

            for (var i = 0; i < destinations.length; i++) {
                vertices[destinations[i]] = vertices[destinations[i]] || {};
                verticesWithData[destinations[i]] = verticesWithData[destinations[i]] || {};
                for (var j = 0;j<deals.length;j++ ) {
                    if (destinations[i] === deals[j].departure) {
                        var cost = deals[j].discount ? deals[j].cost - (deals[j].cost * (deals[j].discount / 100)) : deals[j].cost;
                        var duration = Deals.durationToMinutes(deals[j].duration.h, deals[j].duration.m);
                        var comparator = cheapest ? cost : duration;

                        if (!vertices[destinations[i]][deals[j].arrival] || vertices[destinations[i]][deals[j].arrival] > comparator) {
                            vertices[destinations[i]][deals[j].arrival] = vertices[destinations[i]][deals[j].arrival] || {};
                            vertices[destinations[i]][deals[j].arrival] = comparator;

                            // more detailed vertices
                            verticesWithData[destinations[i]][deals[j].arrival] = verticesWithData[destinations[i]][deals[j].arrival] || {};
                            verticesWithData[destinations[i]][deals[j].arrival] = {
                                'from': deals[j].departure,
                                'to': deals[j].arrival,
                                'cost': deals[j].discount ? deals[j].cost - (deals[j].cost * (deals[j].discount / 100)) : deals[j].cost,
                                'transport': deals[j].transport,
                                'reference': deals[j].reference,
                                'duration': deals[j].duration,
                                'durationInMinutes': Deals.durationToMinutes(deals[j].duration.h, deals[j].duration.m)
                            };
                        }
                    }
                }
            }

            return [vertices, verticesWithData];
        },

        findShortesPath: function(from, to, graph) {
            function PriorityQueue() {
                this._nodes = [];

                this.enqueue = function (priority, key) {
                    this._nodes.push({key: key, priority: priority });
                    this.sort();
                };

                this.dequeue = function () {
                    return this._nodes.shift().key;
                };

                this.sort = function () {
                    this._nodes.sort(function (a, b) {
                        return a.priority - b.priority;
                    });
                };

                this.isEmpty = function () {
                    return !this._nodes.length;
                };
            }

            function Graph(){
                var INFINITY = 1/0;
                this.vertices = graph[0];
                this.verticesWithData = graph[1];

                this.shortestPath = function (start, finish) {
                    var nodes = new PriorityQueue(),
                        distances = {},
                        previous = {},
                        path = [],
                        smallest, vertex, neighbor, alt;

                    for (vertex in this.vertices) {
                        if (vertex === start) {
                            distances[vertex] = 0;
                            nodes.enqueue(0, vertex);
                        } else {
                            distances[vertex] = INFINITY;
                            nodes.enqueue(INFINITY, vertex);
                        }
                        previous[vertex] = null;
                    }

                    while (!nodes.isEmpty()) {
                        smallest = nodes.dequeue();

                        if (smallest === finish) {
                            while (previous[smallest]) {
                                path.push(previous[smallest] + '-' + smallest);
                                smallest = previous[smallest];
                            }

                            break;
                        }

                        if (!smallest || distances[smallest] === INFINITY){
                            continue;
                        }

                        for (neighbor in this.vertices[smallest]) {
                            alt = distances[smallest] + this.vertices[smallest][neighbor];

                            if (alt < distances[neighbor]) {
                                distances[neighbor] = alt;
                                previous[neighbor] = smallest;

                                nodes.enqueue(alt, neighbor);
                            }
                        }
                    }

                    return path;
                };
            }

            var g = new Graph();
            var path = g.shortestPath(from, to).reverse();
            var steps = [];

            for (var p = 0; p < path.length; p++) {
                var cities = path[p].split('-');
                steps.push(g.verticesWithData[cities[0]][cities[1]]);
            }

            return steps;
        }
    };

    return Deals;
};

},{}],4:[function(require,module,exports){
module.exports = "<form name=\"tripPlannerSearch\" style=\"width: 300px; margin: 0 auto;\"><div class=\"form-group\"> <label for=\"city-from\">From</label> <select ng-model=\"from\" class=\"form-control\" id=\"city-from\" placeholder=\"From\"><option value=\"{{ city }}\" ng-repeat=\"city in destinations\"> {{ city }}</option></select></div><div class=\"form-group\"> <label for=\"city-to\">To</label> <select ng-model=\"to\" class=\"form-control\" id=\"city-to\" placeholder=\"From\"><option value=\"{{ city }}\" ng-repeat=\"city in destinations\"> {{ city }}</option></select></div><div class=\"form-group\"><div class=\"radio\"> <label><input type=\"radio\" name=\"search-type\" ng-model=\"searchType\" id=\"cheapest\" value=\"cheapest\">Cheapest</label></div><div class=\"radio\"> <label><input type=\"radio\" name=\"search-type\" ng-model=\"searchType\" id=\"fastest\" value=\"fastest\">Fastest</label></div></div> <button type=\"button\" class=\"btn btn-lg btn-success\" ng-click=\"search()\" ng-disabled=\"from === to\"><span class=\"glyphicon glyphicon-search\" aria-hidden=\"true\"></span> Search</button><br><br><ul class=\"list-group\"><li ng-repeat=\"p in path\" class=\"list-group-item clearfix\"><div class=\"row\"><div class=\"col-md-8\"> {{ p.from }}<small><span class=\"glyphicon glyphicon-chevron-right\" aria-hidden=\"true\"></span></small> {{ p.to }}<br> <small><b>{{ p.transport }}</b> for {{ p.duration.h }}h{{ p.duration.m }}</small></div><div class=\"col-md-4\"><div class=\"text-right\"> &euro; {{ p.cost }}</div></div></div></li><li class=\"list-group-item list-group-item-warning clearfix\" ng-show=\"pathDetails\"><div class=\"row\"><div class=\"col-md-8\"> <b>Total: {{ pathDetails.totalTime.h }}h{{ pathDetails.totalTime.m }}</b></div><div class=\"col-md-4\"><div class=\"text-right\"> &euro; {{ pathDetails.totalCost }}</div></div></div></li></ul></form>";

},{}]},{},[1]);
