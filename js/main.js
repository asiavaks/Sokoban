'use strict'

const WALL = '<img class="wall" src="./images/wall.jpg">';
const BOX = '🟫';
const BOX_ON_TARGET = '🟧';
const TARGET = '🔘';
const SOKOBAN = '🧍';
const EMPTY = '';
const WATER = '🌊';
const CLOCK = '⏳';
const GOLD = '💰';
const GLUE = '🩹';
const MAGNET = '🧲';
const SIZEI = 7;
const SIZEJ = 8;
const TARGETSCOUNT = 4;

var gBoard = [];
var gGamerPos;
var gCountTargets = 4;
var gBonusesInterval;
var gClock = false;
var gClockSteps = 0;
var gGlued = false;
var gWaterMood = false;
var gGame = {
    isOn: false,
    boxOnTarget: 0
}

function initGame() {
    gBoard = buildBoard();
    createSokoban(gBoard);
    renderBoard(gBoard, '.board');
    gGame.isOn = true;
    gClock = false;
    gClockSteps = 0;
    gGlued = false;
    gBonusesInterval = setInterval(placeBonuses, 10000);
    var elWin = document.querySelector('.gameOver');
    elWin.style.display = 'none';
    gGame.boxOnTarget = 0;
    countTargetBox();
}

function buildBoard() {
    var board = [];
    for (var i = 0; i < SIZEI; i++) {
        board.push([]);
        for (var j = 0; j < SIZEJ; j++) {
            board[i][j] = {
                currCellContent: EMPTY,
                prevCellContent: EMPTY
            }

            if (i === 0 || i === SIZEI - 1 ||
                j === 0 || j === SIZEJ - 1 ||
                (i > 4 && j > 3)) {

                board[i][j].currCellContent = WALL;
            }
        }
    }

    board[4][2].currCellContent = WALL;
    board[4][4].currCellContent = WALL;
    board[1][6].currCellContent = WALL;
    board[1][1].currCellContent = WALL;
    board[3][5].currCellContent = BOX;
    board[1][4].currCellContent = BOX;
    board[2][4].currCellContent = BOX;
    board[2][3].currCellContent = BOX_ON_TARGET;
    board[2][3].prevCellContent = TARGET;
    board[1][3].currCellContent = TARGET;
    board[3][2].currCellContent = TARGET;
    board[5][3].currCellContent = TARGET;
    return board;
}


function renderBoard(mat, selector) {
    var strHTML = '';
    for (var i = 0; i < mat.length; i++) {
        strHTML += '<tr>';
        for (var j = 0; j < mat[0].length; j++) {
            var cell = mat[i][j].currCellContent;
            var className = 'cell cell' + i + '-' + j;
            strHTML += `<td class="${className}" onclick="moveTo(${i}, ${j})">${cell}</td>`;
        }
        strHTML += '</tr>'
    }
    var elContainer = document.querySelector(selector);
    elContainer.innerHTML = strHTML;
}

function createSokoban(board) {
    gGamerPos = {
        location: {
            i: 3,
            j: 6
        },
        steps: 100,
        score: 0
    }
    board[gGamerPos.location.i][gGamerPos.location.j].currCellContent = SOKOBAN;
    updateScore(gGamerPos.score);
    updateSteps(0);
}

function placeBonuses() {
    var bonuses = [WATER, CLOCK, GLUE, MAGNET, GOLD];
    var randBonus = getRandomIntInclusive(0, bonuses.length - 1);
    var randI = getRandomIntInclusive(1, SIZEI - 2);
    var randJ = getRandomIntInclusive(1, SIZEJ - 2);
    while (gBoard[randI][randJ].currCellContent !== EMPTY) {
        randI = getRandomIntInclusive(1, SIZEI - 2);
        randJ = getRandomIntInclusive(1, SIZEJ - 2);
    }
    // MODAL
    gBoard[randI][randJ].currCellContent = bonuses[randBonus];

    // DOM
    var location = {
        i: randI,
        j: randJ
    }
    renderCell(location, bonuses[randBonus]);
    setTimeout(function () {
        if (gBoard[randI][randJ].currCellContent === bonuses[randBonus]) {
            gBoard[randI][randJ].currCellContent = EMPTY;
            // DOM
            var location = {
                i: randI,
                j: randJ
            }
            renderCell(location, EMPTY);
        }
    }, 5000)
}

function moveTo(idxI, idxJ) {
    if (!gGame.isOn) {
        return;
    }
    for (var i = idxI - 1; i < idxI + 2; i++) {
        if (i === 0 || i > SIZEI - 1) continue;
        if (gBoard[i][idxJ].currCellContent === SOKOBAN) {
            if (handleNextLocation(idxI, idxJ)) {
                if (gWaterMood) {
                    gWaterMood = false;
                    return;
                }
                gBoard[idxI][idxJ].currCellContent = SOKOBAN;
                renderSokoban(idxI, idxJ);
            }
        }
    }
    if (gBoard[idxI][idxJ].currCellContent !== SOKOBAN) {
        for (var j = idxJ - 1; j < idxJ + 2; j++) {
            if (j === 0 || j > SIZEI - 1) continue;
            if (gBoard[idxI][j].currCellContent === SOKOBAN) {
                if (handleNextLocation(idxI, idxJ)) {
                    if (gWaterMood) {
                        gWaterMood = false;
                        return;
                    }
                    gBoard[idxI][idxJ].currCellContent = SOKOBAN;
                    renderSokoban(idxI, idxJ);
                }
            }
        }
    }
}

function KeyPressed(eventKeyboard) {
    if (!gGame.isOn) {
        return;
    }
    var nextLocation = getNextLocation(eventKeyboard);
    if (!nextLocation) return;

    if (handleNextLocation(nextLocation.i, nextLocation.j)) {
        if (gWaterMood) {
            gWaterMood = false;
            return;
        }
        renderSokoban(nextLocation.i, nextLocation.j);
    }
}



function handleNextLocation(i, j) {
    if (gGlued) {
        return false;
    }

    var nextCell = gBoard[i][j];
    switch (gBoard[i][j].currCellContent) {
        case TARGET:
            gBoard[i][j].prevCellContent = TARGET;
            return true;
        case CLOCK:
            gClock = true;
            break;
        case GOLD:
            updateScore(100);
            break;
        case GLUE:
            gGlued = true;
            updateSteps(5);
            setTimeout(function () {
                gGlued = false;
            }, 5000);
            break;
    }
    if (nextCell.currCellContent === WALL) return false;
    if (nextCell.currCellContent === BOX || nextCell.currCellContent === BOX_ON_TARGET) {
        if (!moveBox(i, j)) return false;
    }
    return true;
}

function moveBox(i, j) {
    // Update the DOM
    var boxPos = {
        location: {
            i,
            j
        }
    }
    var isOnTarget = false;
    if (gBoard[i][j].prevCellContent === TARGET) {
        isOnTarget = true;
    }
    var diffI = boxPos.location.i - gGamerPos.location.i;
    var diffJ = boxPos.location.j - gGamerPos.location.j;
    var idxI = boxPos.location.i + diffI;
    var idxJ = boxPos.location.j + diffJ;

    switch (gBoard[idxI][idxJ].currCellContent) {
        case TARGET:
            gBoard[idxI][idxJ].prevCellContent = TARGET;
            gBoard[idxI][idxJ].currCellContent = BOX_ON_TARGET;
            var prevContent = gBoard[i][j].prevCellContent;
            gBoard[i][j].currCellContent = prevContent;
            renderCell(boxPos.location, prevContent);
            boxPos.location.i += diffI;
            boxPos.location.j += diffJ;
            renderCell(boxPos.location, BOX_ON_TARGET);
            gGame.boxOnTarget++;
            break;
        case EMPTY:
        case CLOCK:
        case GLUE:
        case GOLD:
        case MAGNET:
            gBoard[idxI][idxJ].currCellContent = BOX;
            var prevContent = gBoard[i][j].prevCellContent;
            gBoard[i][j].currCellContent = prevContent;
            renderCell(boxPos.location, prevContent);
            boxPos.location.i += diffI;
            boxPos.location.j += diffJ;
            renderBox(boxPos.location.i, boxPos.location.j, isOnTarget);
            break;
        case WATER:
            gBoard[idxI][idxJ].currCellContent = EMPTY;
            var location = {
                i: idxI,
                j: idxJ
            }
            renderCell(location, EMPTY);
            if (diffI !== 0 || diffJ !== 0) {
                var prevContent = gBoard[i][j].prevCellContent;
                gBoard[i][j].currCellContent = prevContent;
                renderCell(boxPos.location, prevContent);
            }
            if (diffI === 0) {
                if (diffJ === 1) {
                    boxPos.location.j = waterTryMoveItems(idxI, idxJ, diffJ, 'col');
                }
                if (diffJ === -1) {
                    boxPos.location.j = waterTryMoveItems(idxI, idxJ, diffJ, 'col');
                }
                renderBox(boxPos.location.i, boxPos.location.j, isOnTarget);
                return true;
            } else {
                if (diffI === 1) {
                    boxPos.location.i = waterTryMoveItems(idxI, idxJ, diffJ, 'row');
                }
                if (diffI === -1) {
                    boxPos.location.i = waterTryMoveItems(idxI, idxJ, diffJ, 'row');
                }
                renderBox(boxPos.location.i, boxPos.location.j, isOnTarget);
                return true;
            }
    }
    var currNextContent = gBoard[boxPos.location.i][boxPos.location.j].currCellContent;
    if (gBoard[i][j].currCellContent === currNextContent) {
        gBoard[i][j].currCellContent = currNextContent;
        renderCell(boxPos.location, currNextContent);
        return false;
    }
    return true;
}

function renderBox(i, j, isPrevTarget) {
    var location = {
        i,
        j
    }
    if (gBoard[i][j].currCellContent === TARGET) {
        gBoard[i][j].currCellContent = BOX_ON_TARGET;
        renderCell(location, BOX_ON_TARGET);
        if (!isPrevTarget) {
            gGame.boxOnTarget++;
        }
    } else {
        if (isPrevTarget) {
            gGame.boxOnTarget--;
        }
        gBoard[i][j].currCellContent = BOX;
        renderCell(location, BOX);
    }
}

function waterTryMoveItems(indexI, indexJ, diff, isCol) {
    gWaterMood = true;
    if (isCol === 'col') {
        var diffJ = indexJ;
        if (diff === 1) {
            for (var j = indexJ; j < SIZEJ; j++) {
                if (gBoard[indexI][j].currCellContent !== WALL &&
                    gBoard[indexI][j].currCellContent !== BOX &&
                    gBoard[indexI][j].currCellContent !== BOX_ON_TARGET) {
                    diffJ += diff;
                } else {
                    handleNextLocation(i, diff-2);
                    renderSokoban(i, diffJ - 2);
                    return diffJ - 1;
                }
            }
        } else {
            for (var j = indexJ; j >= 0; j--) {
                if (gBoard[indexI][j].currCellContent !== WALL &&
                    gBoard[indexI][j].currCellContent !== BOX &&
                    gBoard[indexI][j].currCellContent !== BOX_ON_TARGET) {
                    diffJ += diff;
                } else {
                    handleNextLocation(indexI, diffJ+2);
                    renderSokoban(indexI, diffJ + 2)
                    return diffJ + 1;
                }
            }
        }
    } else {
        if (diff === 1) {
            var diffI = indexI;
            for (var i = indexI; i < SIZEI; i++) {
                if (gBoard[i][indexJ].currCellContent !== WALL &&
                    gBoard[i][indexJ].currCellContent !== BOX &&
                    gBoard[i][indexJ].currCellContent !== BOX_ON_TARGET) {
                    diffI += diff;
                } else {
                    handleNextLocation(diffI - 2, indexJ);
                    renderSokoban(diffI - 2, indexJ);
                    return diffI - 1;
                }
            }
        } else {
            for (var i = indexI; i > 1; i++) {
                if (gBoard[i][indexJ].currCellContent !== WALL &&
                    gBoard[i][indexJ].currCellContent !== BOX &&
                    gBoard[i][indexJ].currCellContent !== BOX_ON_TARGET) {
                    diffI += count;
                } else {
                    handleNextLocation(diffI + 2, indexJ);
                    renderSokoban(diffI + 2, indexJ);
                    return diffI + 1;
                }
            }
        }
    }
}

function renderSokoban(i, j) {
    if (gClock) {
        gClockSteps += 1;
    } else if (!gGlued) {
        updateSteps(1);
    }
    if (gClockSteps === 10) {
        gClock = false;
        gClockSteps = 0;
    }
    if (gBoard[gGamerPos.location.i][gGamerPos.location.j].prevCellContent === TARGET) {
        gBoard[gGamerPos.location.i][gGamerPos.location.j].currCellContent = TARGET;
        // Update the DOM
        renderCell(gGamerPos.location, TARGET);
    } else {
        // Update the model to reflect movement
        gBoard[gGamerPos.location.i][gGamerPos.location.j].currCellContent = EMPTY;
        // Update the DOM
        renderCell(gGamerPos.location, EMPTY);
    }

    // Update the gamer MODEL to new location  
    gGamerPos.location.i = i;
    gGamerPos.location.j = j;
    gBoard[gGamerPos.location.i][gGamerPos.location.j].currCellContent = SOKOBAN;
    // Render updated model to the DOM
    renderCell(gGamerPos.location, SOKOBAN);
    checkGameOver();
}

function renderCell(location, value) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    elCell.innerHTML = value;
}


function getNextLocation(keyboardEvent) {
    var nextLocation = {
        i: gGamerPos.location.i,
        j: gGamerPos.location.j
    };

    switch (keyboardEvent.code) {
        case 'ArrowUp':
            nextLocation.i--;
            break;
        case 'ArrowDown':
            nextLocation.i++;
            break;
        case 'ArrowLeft':
            nextLocation.j--;
            break;
        case 'ArrowRight':
            nextLocation.j++;
            break;
        default: return null;
    }
    return nextLocation;
}

function checkGameOver() {
    if (gGamerPos.steps === 0) {
        gGame.isOn = false;
        clearInterval(gBonusesInterval);
    }
    if (gGame.boxOnTarget === TARGETSCOUNT) {
        gGame.isOn = false;
        clearInterval(gBonusesInterval);
        var elWin = document.querySelector('.gameOver');
        elWin.style.display = 'block';
    }
}

function playAgain() {
    clearInterval(gBonusesInterval);
    initGame();
}

function updateSteps(value) {
    // Update both the model and the dom for the score
    gGamerPos.steps -= value;
    document.querySelector('.steps').innerText = gGamerPos.steps;
}

function updateScore(value) {
    // Update both the model and the dom for the score
    gGamerPos.score += value;
    document.querySelector('.score').innerText = gGamerPos.score;
}

function countTargetBox() {
    for (var i = 1; i < SIZEI - 1; i++) {
        for (var j = 1; j < SIZEJ - 1; j++) {
            if (gBoard[i][j].currCellContent === BOX_ON_TARGET) {
                gGame.boxOnTarget++;
            }
        }
    }
}