// Set up server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const port = (process.env.PORT || 3000);
server.listen(port);

// Send index file when there is a connection
app.use(express.static(__dirname));
app.get('/', function (req, res) {
    res.sendFile('index.html', { root: __dirname });
});

class Player {
    constructor(playerID, turn) {
        /// Id of the player
        this.id = playerID;
        /// Whether it is the players turn
        this.turn = turn;
    }

    setReady() {
        this.ready = true;
    }

    equals(rhs) {
        return (this.id == rhs.id && this.turn == rhs.turn);
    }
}

class Game {
    constructor(gameID) {
        /// Id of the game
        this.id = gameID;
        /// Information about player1
        this.player1 = null;
        /// Information about player2
        this.player2 = null;
    }

    reset() {
        var randomBoolean = Math.random() < 0.5;
        this.player1.turn = randomBoolean;
        this.player2.turn = !randomBoolean;
    }

    addPlayer(playerID) {
        // Check which player to add (only two players per game)
        if (this.player1 == null) {
            this.player1 = new Player(playerID, true);
            return true;
        } else if (this.player2 == null) {
            this.player2 = new Player(playerID, false);
            return true;
        } else {
            return false;
        }
    }

    updateTurns() {
        this.player1.turn = !this.player1.turn;
        this.player2.turn = !this.player2.turn;
    }

    checkValidTurn(player) {
        if (player.turn && (this.player1.equals(player) || this.player2.equals(player)))
            return true;
        return false;
    }

    setReady(playerID) {
        if (this.player1 != null && this.player1.id == playerID) {
            this.player1.setReady();
        }
        else if (this.player2 != null && this.player2.id == playerID) {
            this.player2.setReady();
        }
    }
    isReady() {
        return this.player1.ready && this.player2.ready;
    }
}

var games = {};
const maxNumberOfOngoingGame = 1000;
var curNumberOfOngoingGame = 0;

// Called when socket connects.
io.sockets.on('connection', function (socket) {

    // Called when user creates a game
    socket.on("create", function () {
        // Create lobby id
        if (curNumberOfOngoingGame == maxNumberOfOngoingGame)
            socket.emit("failed");

        let done = false;
        let gameID = Math.floor((Math.random() * maxNumberOfOngoingGame)).toString();
        while (!done) {
            if (games[gameID] == null) {
                done = true;
            } else {
                gameID = Math.floor((Math.random() * maxNumberOfOngoingGame)).toString();
            }
        }

        // Create game and add player
        curNumberOfOngoingGame++;
        games[gameID] = new Game(gameID);
        games[gameID].addPlayer(socket.id);

        // Add socket to lobby and emit the gameID to the socket
        socket.join(gameID);
        socket.lobby = gameID;
        socket.emit('created', {
            id: gameID
        });
    });

    // Called when person attempts to join game
    socket.on('join', function (data) {
        // Check if the game exists
        let gameID = data.gameID.toString();
        if (games[gameID] != null) {
            // Add player to the game
            if (games[gameID].addPlayer(socket.id)) {

                // Join lobby
                socket.join(gameID);
                socket.lobby = gameID;
                // Emit data to first player.
                socket.in(gameID).emit('joined', {
                    id: gameID,
                    player: games[gameID].player1
                });

                // Emit data to second player.
                socket.emit("joined", {
                    id: gameID,
                    player: games[gameID].player2
                });
            } else {
                // there are 2 players in this id game
                socket.emit("failed");
            }
        } else {
            // Game does not exist. Emit a failure to socket.
            socket.emit("failed");
        }
    });

    // Called when player ready
    socket.on('ready', function (data) {
        let gameID = data.id;
        let board = data.board;
        let fleet = data.fleet;

        if (games[gameID] != null) {
            games[gameID].setReady(socket.id);

            socket.in(gameID).emit('opponent_ready', {
                id: gameID,
                oboard: board,
                ofleet: fleet
            });
            if (games[gameID].isReady()) {
                // Emit data to first player.
                socket.in(gameID).emit('start');

                // Emit data to second player.
                socket.emit("start");
            }
        }
    });

    // Called when player fire a location
    socket.on("fire", function (data) {
        let gameID = data.id;
        let position = data.position
        if (games[gameID] != null) {
            if (games[gameID].checkValidTurn(data.player)) {
                games[gameID].updateTurns();
                socket.in(gameID).emit("opponent_fire", {
                    id: gameID,
                    oposition: position
                });
            }
            else {
                // Emit invalid fire
                socket.emit("invalid");
            }
        }
    });

    // Called when person calls for restart of game.
    socket.on("restart", function (data) {
        // Reset the game board
        let gameID = data.id;
        if (games[gameID] != null) {
            games[gameID].reset();

            // Emit data to first player.
            socket.emit("rematch", {
                id: gameID,
                player: games[gameID].player1
            });

            // Emit data to second player.
            socket.in(gameID).emit('rematch', {
                id: gameID,
                player: games[gameID].player2
            });
        }
    });

    // Called when connection is lost
    socket.on("disconnect", function () {
        // Remove the lobby and emit 'quit'
        if (socket.lobby != null) {
            socket.emit("quit");
            socket.in(socket.lobby.toString()).emit("quit");
            delete games[socket.lobby];
            curNumberOfOngoingGame--;
        }
    });
});
