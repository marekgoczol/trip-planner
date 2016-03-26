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

