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
