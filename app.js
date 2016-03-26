(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./trip-planner/controller.js":2,"./trip-planner/deals-service.js":3,"./trip-planner/search.html":4}],2:[function(require,module,exports){
module.exports = function($scope, deals) {
    // $scope.destinations = destinations;
    deals = deals.deals;

    var destinations = [];
    for (var d = 0;d<deals.length;d++) {
        if (destinations.indexOf(deals[d].departure) === -1) {
            destinations.push(deals[d].departure);
        }
    }

    function PriorityQueue () {
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

    /**
     * Pathfinding starts here
     */
    function Graph(){
      var INFINITY = 1/0;
      this.vertices = {};
      for (var i=0;i<destinations.length;i++) {
        this.vertices[destinations[i]] = this.vertices[destinations[i]] || {};
        for (var j = 0;j<deals.length;j++ ) {
            if (destinations[i] === deals[j].departure) {
                var cost = deals[j].discount ? deals[j].cost - (deals[j].cost * (deals[j].discount / 100)) : deals[j].cost;
                if (!this.vertices[destinations[i]][deals[j].arrival] || this.vertices[destinations[i]][deals[j].arrival] > cost) {
                    this.vertices[destinations[i]][deals[j].arrival] = cost;
                }
            }
        }
    }

      this.addVertex = function(name, edges){
        this.vertices[name] = edges;
      };

      this.shortestPath = function (start, finish) {
        var nodes = new PriorityQueue(),
            distances = {},
            previous = {},
            path = [],
            smallest, vertex, neighbor, alt;

        for(vertex in this.vertices) {
          if(vertex === start) {
            distances[vertex] = 0;
            nodes.enqueue(0, vertex);
          }
          else {
            distances[vertex] = INFINITY;
            nodes.enqueue(INFINITY, vertex);
          }

          previous[vertex] = null;
        }

        while(!nodes.isEmpty()) {
          smallest = nodes.dequeue();

          if(smallest === finish) {

            while(previous[smallest]) {
              path.push(previous[smallest] + '-' + smallest);
              smallest = previous[smallest];
            }

            break;
          }

          if(!smallest || distances[smallest] === INFINITY){
            continue;
          }

          for(neighbor in this.vertices[smallest]) {
            alt = distances[smallest] + this.vertices[smallest][neighbor];

            if(alt < distances[neighbor]) {
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
    console.log(g.shortestPath('London', 'Lisbon').concat(['London']).reverse());


};


},{}],3:[function(require,module,exports){
module.exports = function($http) {
    return {
        get: function() {
            return $http.get('/response.json').then(function(res) {
                return res.data;
            });
        },

        findCheapest: function(deals, from, to) {

        },  

        findFastest: function(deals, from, to) {

        },

        findDestinations: function(deals) {
            
        }
    };
};

},{}],4:[function(require,module,exports){
module.exports = "<form name=\"tripPlannerSearch\"> <select ng-model=\"from\"><option ng-repeat=\"city in destinations\"> {{ city }}</option></select> <select ng-model=\"to\"><option ng-repeat=\"city in destinations\"> {{ city }}</option></select> <button ng-click=\"findCheapest()\">find cheapest</button></form>";

},{}]},{},[1]);
