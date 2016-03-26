module.exports = function($scope, Deals, destinations, deals, cheapestGraph, fastestGraph) {
    $scope.destinations = destinations;

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

