function checkInputValue(value) {
    if (value.length > 3 || value.length < 2) {
        return false;
    }

    var testLetter = value[0];
    if (CoordinateLetterValues.indexOf(testLetter.toUpperCase()) == -1) {
        return false;
    }
    var testNumber = parseInt(value[1]);
    if (value.length == 3) {
        testNumber = parseInt(value[1] + value[2]);
    }
    if (testNumber == NaN) {
        return false;
    }
    console.log("input coordinate correct=" + value)
    return true;
}

function placementCheck(isPlayer, index, shipNumber, shipLength, orientation, r, c) {
    var result = true;
    //board[row][col]
    var count = 0;
    var row = r;
    var col = c;
    var ship = shipNumber;
    var coordinates = [];

    while (count < shipLength) {
        if (row > 10 || col > 10 || row < 1 || col < 1) {
            console.log("placementCheck error row=" + row + ", col=" + col)
            result = false;
            break;
        }
        //console.log("placementCheck board (row=" + row + ", col=" + col + ") = " + board[row - 1][col - 1]);
        if (Boards[index][row - 1][col - 1] === 0) {
            coordinates.push([row, col]);
            if (orientation === 0) { //vertical
                row++;
            } else {
                col++;
            }
            count++;
        } else {
            console.log("placementCheck error row=" + row + ", col=" + col + ", count=" + count + ", shipLength=" + shipLength);
            result = false;
            break;
        }
    }

    if (isPlayer && result) {
        console.log("update ship coords");
        var pair;
        var rmcoordinates = Fleets[index][ship].coordinates;
        for (pair in rmcoordinates) {
            $("#p-" + CoordinateLetterValues[rmcoordinates[pair][0]] + "" + rmcoordinates[pair][1]).removeClass("ship-space");
        }

        Fleets[index][ship].coordinates = coordinates;
        for (pair in coordinates) {
            $("#p-" + CoordinateLetterValues[coordinates[pair][0]] + "" + coordinates[pair][1]).addClass("ship-space");
        }
    } else if (!isPlayer && result) {
        //confirm ship position
        var pair;
        Fleets[index][ship].coordinates = coordinates;
        for (pair in coordinates) {
            Boards[index][coordinates[pair][0] - 1][coordinates[pair][1] - 1] = 1;
            $("#p-" + CoordinateLetterValues[coordinates[pair][0]] + "" + coordinates[pair][1]).addClass("ship-space");
        }
    }

    return result;
}