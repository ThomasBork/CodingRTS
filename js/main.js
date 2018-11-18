$(document).ready(() => {
    $('#btn-start-game').on('click', startGame);
    $('#btn-stop-game').on('click', stopGame);
});

var game;

function log (message) {
    console.log (message);
}

function startGame () {
    var player1 = new Player(
        $('#player1 input[type=text]').val(),
        $('#player1 .code-input').val()
    );
    buildPlayerWorker(player1);
    var player2 = new Player(
        $('#player2 input[type=text]').val(),
        $('#player2 .code-input').val()
    );
    buildPlayerWorker(player2);
    game = new Game([player1, player2]);
    game.start();
}

function stopGame () {
    clearTimeout(game.updateTimeout);
    game.players.forEach(player => player.worker.terminate());
}

function buildPlayerWorker(player) {
    var codeWithDefault = 
        `
            self.onmessage = function(e) {
                var message = JSON.parse(e.data);
                if (message.type === 'Initialize worker') {
                    self.importScripts(message.data.url + 'js/shared.js');
                } else {
                    if (message.type === MESSAGE_TYPE.START_TURN) {
                        onNewTurn(message.data);
                    } 
                }
            }

            function updateActions (actions) {
                postMessage (JSON.stringify({
                    type: MESSAGE_TYPE.UPDATE_ACTIONS,
                    data: actions
                }));
            }

            function onNewTurn (state) {
                updateActions([
                    {
                        unitId: state.me.units[0].id,
                        type: ACTION_TYPE.BUILD,
                        data: {
                            unitType: unitTypes.builder,
                            position: {x: 10, y: 10}
                        }
                    }
                ]);
            }
        ` + player.code;
    var blob = new Blob ([codeWithDefault], {type: 'application/javascript'});
    player.worker = new Worker(URL.createObjectURL(blob));
    player.worker.onmessage = function(e) {
        if (!Utils.isJSON(e.data)) {
            log('Message was not recognized as JSON: "' + e.data + '"');
        }
        else {
            var message = JSON.parse(e.data);
            console.log ('Player "' + player.name + '" sends the message', message);

            if (message.type === MESSAGE_TYPE.UPDATE_ACTIONS) {
                player.nextActions = message.data;
            }
        }
    };
    var url = document.location.host ? 
        document.location.protocol + '//' + document.location.host + '/':
        document.location.href.substr(0, document.location.href.lastIndexOf('/') + 1);
    player.sendMessage (MESSAGE_TYPE.INITIALIZE_WORKER, {url: url});
}

class Game {
    constructor (players) {
        this.players = players;
        this.updateTimeout = null;
        this.updateIntervalLength = 1000 / 2;
        this.height = 40;
        this.width = 40;
        this.turnNumber = 0;
    }
    initialize() {
        this.players.forEach((player) => {
            var builder = new Unit(unitTypes.builder);
            player.units = [builder];
            player.nextActions = [];
        });
    }
    startNextTurn() {
        this.turnNumber++;
        var player = this.players[this.turnNumber % this.players.length];
        var state = this.getState(player);
        player.sendMessage(MESSAGE_TYPE.START_TURN, state);
        this.updateTimeout = setTimeout(() => this.update(), this.updateIntervalLength);
    }
    getState (currentPlayer) {
        return {
            me: currentPlayer.getClientRepresentation(),
            game: {
                height: this.height,
                width: this.width,
                turnNumber: this.turnNumber
            },
            players: this.players.map(player => player.getClientRepresentation())
        }
    }
    start() {
        this.initialize();
        this.startNextTurn();
    }
    update() {
        this.players.forEach((player)=>{
            // Give income
            player.units.forEach(unit => player.gold += unit.type.income);

            // Reset unit actions
            player.units.forEach(unit => unit.hasActedThisTurn = false);

            player.nextActions.forEach((action)=>{
                var actingUnitId = action.unitId;
                var actingUnit = player.getUnit (actingUnitId);

                if (!actingUnit) {
                    log('Player "' + player.name + '" does not own a unit with id "' + actingUnitId + '"');
                }
                else if (actingUnit.hasActedThisTurn) {
                    log('Unit with id ' + actingUnitId + ' already took an action this turn');
                }
                else {
                    switch (action.type) {
                        case ACTION_TYPE.WAIT:
                            // Do nothing
                            break;
                        case ACTION_TYPE.MOVE:
                            break;
                        case ACTION_TYPE.ATTACK:
                            break;
                        case ACTION_TYPE.BUILD:
                            var unitType = action.data.unitType;
                            var position = action.data.position;
                            // Check player can afford
                            if (player.gold < unitType.price) {
                                log('Player "' + player.name + '" cannot afford unit "' + unitType.name + '"');
                            }
                            // Check position is available
                            // Check position is near acting unit

                            else {
                                player.gold -= unitType.price;
                                var newUnit = new Unit(unitType);
                                player.units.push(newUnit);
                            }
                            break;
                        default:
                            log("Unknown action type: '" + action.type + "'");
                    }
                }
            });
        });
        this.startNextTurn();
    }
}

class Player {
    static getNextId() {
        var id = Player.nextId || 0;
        Player.nextId = id + 1;
        return id;
    };
    constructor(name, code) {
        this.id = Player.getNextId();
        this.name = name;
        this.code = code;
        this.worker = null;

        this.gold = 0;
        this.units = [];

        this.nextActions = [];
    }
    getClientRepresentation () {
        return {
            id: this.id,
            name: this.name,
            units: this.units.map(unit => unit.getClientRepresentation())
        }
    }
    sendMessage (type, data) {
        this.worker.postMessage(JSON.stringify({
            type: type,
            data: data
        }));
    }
    getUnit (id) {
        return this.units.find(unit => unit.id === id);
    }
}

class Unit {
    static getNextId() {
        var id = Unit.nextId || 0;
        Unit.nextId = id + 1;
        return id;
    };
    constructor (unitType) {
        this.id = Unit.getNextId();
        this.type = unitType;
        this.position = {x: 0, y: 0};
        this.hasActedThisTurn = false;
    }
    getClientRepresentation () {
        return {
            id: this.id,
            type: this.type,
            position: this.position
        }
    }
}