// Initialize variables
var playing = false;
var ready = false;

const PlayerIndex = 0;
const OpponentIndex = 1;

var Fleets = [];
var Boards = [];
var Guesses = [[], []];
var ShipsLeft = [5, 5];

// Mapping index and letter A->J = 1->10
var CoordinateLetterValues = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

// Creates a ship object
class Ship {
    constructor(name, size) {
        this.name = name;
        this.size = size;
        this.coordinates = [];
        this.health = size;
    }
}

var game = {};
const socket = io();

function initGame() {
    $("#game-board").hide();
    $("#game-status-text").html("");
}

$(document).ready(function () {

    initGame();

    $("#new-game").unbind().click(function () {
        $("#game-create-panel").hide();
        socket.emit('create');
    });

    socket.on('created', function (data) {
        // Show the GameID
        console.log("game-created " + data.id);
        $("#game-id").val(data.id);
        game.id = data.id;
    });

    $("#join-game").unbind().click(function () {
        $("#game-create-panel").hide();
        let gameId = $("#game-id").val();
        socket.emit('join', { gameID: gameId });
    });

    socket.on('joined', function (data) {
        console.log("game-joined " + data.id);
        // Show the GameID
        $("#game-id").val(data.id)
        $("#game-id-panel").hide();
        game.id = data.id;
        game.player = data.player;
        newGame();
    });

    socket.on('joined', function (data) {
        console.log("game-joined " + data.id);
        // Show the GameID
        $("#game-id").val(data.id)
        game.id = data.id;
        game.player = data.player;
        newGame();
    });

    socket.on('rematch', function (data) {
        console.log("game-rematch " + data.id);
        // Show the GameID
        $("#game-id").val(data.id)
        game.id = data.id;
        game.player = data.player;
        newGame();
    });

    socket.on('opponent_ready', function (data) {
        console.log("game-opponent_ready");
        Boards[OpponentIndex] = data.oboard;
        Fleets[OpponentIndex] = data.ofleet;
    });

    socket.on('start', function (data) {
        console.log("game-start");
        setUpFire();
        showTurn();
    });

    socket.on('opponent_fire', function (data) {
        console.log("game-opponent_fire");
        var target = data.oposition;
        Guesses[OpponentIndex].push(target);

        updateTurn();

        checkHit(PlayerIndex, target);

        checkGameOver();
        console.log("game-opponent_fire player ShipsLeft=" + ShipsLeft[PlayerIndex]);
    });

    $("#game-ready").unbind().click(function () {
        ready = true;
        document.getElementById("opponent-grid").scrollIntoView();

        socket.emit('ready', {
            id: game.id,
            board: Boards[PlayerIndex],
            fleet: Fleets[PlayerIndex]
        });
        $("#placement-panel").hide();
        $("#ready-panel").hide();
    });

    socket.on('failed', function (data) {
        console.log("game-make-failed");
        window.location.reload();
    });

    socket.on('quit', function (data) {
        console.log("game-other-quit");
        window.location.reload();
    });

    $("#game-rematch").unbind().click(function () {
        if (playing === true)
            confirm("Are you sure you wish to start a new game?")
        socket.emit('restart', { id: game.id });
    });

    $("#orientation-toggle").click(function () {
        console.log("Orientation toggle clicked!");
        $("#orientation-indicator").toggleClass("vertical");
    });
});

function newGame() {
    console.log("Starting a new game!");

    $("#game-board").show();
    $("#placement-panel").show();

    $("#ready-panel").hide();
    $("#rematch-panel").hide();

    playing = true;
    ready = false;

    Fleets[PlayerIndex] = createFleet();
    Boards[PlayerIndex] = createBoard();
    Fleets
    Guesses = [[], []];
    ShipsLeft = [5, 5];

    initGraphics();

    console.log("New game has been started.");

    placePlayerShips();
}

function initGraphics() {
    $("span.marker").removeClass("hit");
    $("span.marker").removeClass("miss");
    $("div.space").removeClass("ship-space");
}

// Creates a fleet consisting of the five ships used in the Hasbro game.
function createFleet() {
    var carrier = new Ship("Carrier", 5);
    var battleship = new Ship("Battleship", 4);
    var cruiser = new Ship("Cruiser", 3);
    var submarine = new Ship("Submarine", 3);
    var destroyer = new Ship("Destroyer", 2);

    var fleet = [carrier, battleship, cruiser, submarine, destroyer];
    return fleet;
}

// The default board with with no ships placed that both the player and the opponent start out with.
function createBoard() {
    /*
    *
    * Boards are represented by 2D arrays.
    * 0 = nothing
    * 1 = ship
    * 2 = miss
    * 3 = hit
    *
    */
    var board = [
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];
    return board;
}

function placeOpponentShips() {
    //single player
    var ship, orientation, x, y, shipLength;
    for (ship = 0; ship < 5; ship++) {
        shipLength = Fleets[OpponentIndex][ship].size;

        // Computer picks a random orientation and a random starting point for each ship until it fits on the board.
        do {
            orientation = Math.round(Math.random()); // 0 = horizontal, 1 = vertical
            x = Math.floor(Math.random() * 10);
            y = Math.floor(Math.random() * 10);
        } while (placementCheck(false, OpponentIndex, ship, shipLength, orientation, x, y) === false);
    }
    console.log("placeOpponentShips done");
}

function placePlayerShips() {
    console.log("placePlayerShips");
    document.getElementById("player-grid").scrollIntoView();

    var ship = 0, orientation, row, col, shipLength;
    var isShipPlaced = false;

    for (let r = 1; r <= 10; r++) {
        for (let c = 1; c <= 10; c++) {
            $("#p-" + CoordinateLetterValues[r] + "" + c).unbind().click(function () {

                if (ready || ship > 4 || !playing)
                    return;

                console.log("click " + this.id + ", ship=" + ship);

                shipLength = Fleets[PlayerIndex][ship].size;
                if ($("#orientation-indicator").hasClass("vertical")) {
                    orientation = 0;
                } else {
                    orientation = 1;
                }

                var inputValue = this.id.substr(2);

                //board[row][col]
                row = CoordinateLetterValues.indexOf(inputValue[0].toUpperCase());
                col = parseInt(inputValue[1]);
                if (inputValue.length == 3) {
                    col = parseInt(inputValue[1] + inputValue[2]);
                }
                console.log("accepted row=" + row + ", col=" + col);

                if (!placementCheck(true, PlayerIndex, ship, shipLength, orientation, row, col) === true) {
                    alert("That ship doesn't fit there. Please enter another location where the ship will fit.");
                } else {
                    isShipPlaced = true;
                }
            });
        }
    }

    $("#place-confirm").unbind().click(function () {
        //confirm ship position
        if (!isShipPlaced)
            return;

        var pair;
        var coordinates = Fleets[PlayerIndex][ship].coordinates;
        for (pair in coordinates) {
            Boards[PlayerIndex][coordinates[pair][0] - 1][coordinates[pair][1] - 1] = 1;
        }
        ship++;
        console.log("confirm ship=" + ship);
        if (ship < 4) {
            $("#ship-label > span").attr("id", "place-" + Fleets[PlayerIndex][ship].name).text(Fleets[PlayerIndex][ship].name);
        } else if (ship == 5) {
            $("#ready-panel").show();
            $("#placement-panel").hide();
        }
        isShipPlaced = false;
    });
}

function hasLocationInArray(array, target) {
    for (let pair of array) {
        if (pair[0] == target[0] && pair[1] == target[1]) {
            return true;
        }
    }
    return false;
}

function setUpFire() {
    console.log("setUpFire");
    for (let row = 1; row <= 10; row++) {
        for (let col = 1; col <= 10; col++) {
            $("#o-" + CoordinateLetterValues[row] + "" + col).unbind().click(function () {

                if (!game.player.turn || !playing || !ready)
                    return;

                var inputValue = this.id.substr(2);
                row = CoordinateLetterValues.indexOf(inputValue[0].toUpperCase());
                col = parseInt(inputValue[1]);
                if (inputValue.length == 3) {
                    col = parseInt(inputValue[1] + inputValue[2]);
                }
                console.log("fire row=" + row + ", col=" + col);

                var target = [row, col];
                if (hasLocationInArray(Guesses[PlayerIndex], target)) {
                    alert("You've already guessed that location. Please pick another valid location and fire again.");
                } else {
                    Guesses[PlayerIndex].push(target);

                    socket.emit("fire", {
                        id: game.id,
                        position: target,
                        player: game.player
                    });

                    updateTurn();

                    checkHit(OpponentIndex, target);

                    checkGameOver();

                    console.log("game-fire opponent ShipsLeft=" + ShipsLeft[OpponentIndex]);
                }
            });
        }
    }
}

function checkHit(index, target) {
    var prefix = "#o-";
    if (index == PlayerIndex)
        prefix = "#p-";

    var i;
    var isHit = false;
    row = target[0];
    col = target[1];
    for (i = 0; i < 5; i++) {
        if (Fleets[index][i].health <= 0) continue;
        var array = Fleets[index][i].coordinates;
        if (hasLocationInArray(array, target)) {
            isHit = true;
            Fleets[index][i].health--;
            break;
        }
    }
    if (isHit) {
        if (Fleets[index][i].health <= 0) {
            //sunk
            ShipsLeft[index]--;
            var pair;
            var coordinates = Fleets[index][i].coordinates;
            for (pair in coordinates) {
                var locationElement = $(prefix + CoordinateLetterValues[coordinates[pair][0]] + "" + coordinates[pair][1]);
                if (!locationElement.hasClass("ship-space"))
                    locationElement.addClass("ship-space");
            }
        }
        $(prefix + CoordinateLetterValues[row] + "" + col + " > span").addClass("hit");
    } else {
        $(prefix + CoordinateLetterValues[row] + "" + col + " > span").addClass("miss");
    }
}

function updateTurn() {
    // Update turn in client
    game.player.turn = !game.player.turn;
    showTurn();
}

function showTurn() {
    if (game.player.turn)
        $("#game-status-text").html("Đến lượt bạn");
    else
        $("#game-status-text").html("Lượt đối thủ");
}

function checkGameOver() {
    console.log("gameOver.")

    if (ShipsLeft[PlayerIndex] <= 0) {
        $("#game-status-text").html("*** YOU LOSE ***");
        $("#rematch-panel").show();
        playing = false;
    }
    else if (ShipsLeft[OpponentIndex] <= 0) {
        $("#game-status-text").html("*** YOU WIN ***");
        $("#rematch-panel").show();
        playing = false;
    }
}
