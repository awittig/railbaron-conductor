(function() {

    var app = angular.module('railbaron', []);

    app.controller('RailbaronController', function() {

        var self = this;

        this.allCities = cities;

        this.players = [
            new Player('Player 1', 0),
            new Player('Player 2', 1)
        ];

        this.playerColors = ['black', 'red', 'blue', 'green', 'white', 'yellow'];

        this.cycleColor = function(player) {
            player.color = (player.color + 1) % self.playerColors.length;
        };

        this.addDestination = function(player) {
            console.log(self.players);
            console.log(player.destinations);
            player.destinations.unshift(undefined);
        };

        this.calculatePayout = function(player, index) {
            var from = player.destinations[index];
            var to = player.destinations[index + 1];
            if (from && to) {
                var payout = findPayout(from.id, to.id);
                if (payout != undefined) {
                    return '$' + payout.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                }
            }
        };

    });

    function Player(n, c) {
        this.name = n;
        this.color = c;
        this.destinations = [{}];
        // this.destination = {};
    }

})();