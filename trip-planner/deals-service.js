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
