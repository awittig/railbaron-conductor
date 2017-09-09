(function() {
    var app = angular.module('railbaron', []);

    app.controller('RailbaronController', function() {

        var self = this;
        this.allCities = cities;
        this.playerColors = ['black', 'red', 'blue', 'green', 'white', 'yellow'];

        this.cycleColor = function(player) {
            player.color = (player.color + 1) % self.playerColors.length;
            self.persist();
        };

        this.addDestination = function(player) {
            player.destinations.unshift(undefined);
            self.persist();
        };

        this.addPlayer = function() {
            self.players.push(new Player('player name', 0));
            self.persist();
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

        this.markUnreachable = function(player, destinationIndex) {
            var destination = player.destinations[destinationIndex];
            destination.status = destination.status ? '' : 'unreachable';
            self.persist();
        };

        this.persist = function() {
            window.localStorage.setItem('players', JSON.stringify(self.players));
        };

        this.initializePlayers = function() {
            var persistedState = window.localStorage.getItem('players');
            if (persistedState) {
                self.players = JSON.parse(persistedState);

                // awkward hack to go back over the destinations and
                // point them to the same objects that back the select boxes
                for (var i = 0; i < self.players.length; i++) {
                    var p = self.players[i];
                    for (var j = 0; j < p.destinations.length; j++) {
                        var d = p.destinations[j];
                        if (d) {
                            var status = d.status;
                            p.destinations[j] = self.allCities[d.id - 1];
                            p.destinations[j].status = status;
                        }
                    }
                }
            } else {
                self.players = [
                    new Player('player name', 0),
                    new Player('player name', 0)
                ];
            }
        };

        this.newGame = function() {
            if (confirm('Are you sure you want to start a new game?')) {
                window.localStorage.removeItem('players');
                window.location.reload(false);
            }
        };

        this.initializePlayers();

    });

    function Player(n, c) {
        this.name = n;
        this.color = c;
        this.destinations = [{}];
    }

})();