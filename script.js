import Grid from "./Grid.js";
import Tile from "./Tile.js";

const difficulty = 1;

const gameBoard = document.getElementById("game-board");
const gameEnd = document.getElementById("game-end-scene");
const gameEndTitle = document.getElementById("game-end-title");
const scoreCount = document.getElementById("score-count");
const gameEndCloseBtn = document.getElementById("close-game-end-scene");
const gameEndScoreCount = document.getElementById("game-end-score");
const gameEndTimer = document.getElementById("game-end-timer");
const timerElement = document.getElementById("timer");

// GAME SETUP

let startTime;
let elapsedSeconds = 0;
let timerGlob = "";
let idle = true;

// testing modal
// gameEnd.showModal();

const grid = new Grid(gameBoard, difficulty);
grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);
grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);

setupInput();

// HELPER FUNCTIONS

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
}

gameEndCloseBtn.addEventListener("click", () => {
  console.log("closing modal");
  gameEnd.close();
});

async function handleInput(e) {
  switch (e.key) {
    case "ArrowUp":
      if (!canMoveUp()) {
        setupInput();
        return;
      }
      await moveUp();
      break;
    case "ArrowDown":
      if (!canMoveDown()) {
        setupInput();
        return;
      }
      await moveDown();
      break;
    case "ArrowLeft":
      if (!canMoveLeft()) {
        setupInput();
        return;
      }
      await moveLeft();
      break;
    case "ArrowRight":
      if (!canMoveRight()) {
        setupInput();
        return;
      }
      await moveRight();
      break;
    default:
      setupInput();
      return;
  }

  // start timer after first key input
  if (idle) {
    console.log("start");
    idle = !idle;
    startTimer();
  }

  grid.cells.forEach((cell) => cell.mergeTiles(grid));

  //   console.log(grid.score);
  scoreCount.textContent = grid.score;

  const newTile = new Tile(gameBoard, difficulty);
  grid.randomEmptyCell().tile = newTile;

  if (!canMoveUp() && !canMoveDown() && !canMoveRight() && !canMoveLeft()) {
    console.log("lost");
    idle = !idle;
    gameEndTitle.textContent = "Game over! 🥲";
    gameEndScoreCount.textContent = grid.score;
    gameEndTimer.textContent = timerGlob;
    gameEnd.showModal();
    return;
  }

  if (grid.maxPoint === 2048) {
    idle = !idle;
    gameEndTitle.textContent = "Victory! 🏆";
    gameEndScoreCount.textContent = grid.score;
    gameEndTimer.textContent = timerGlob;
    gameEnd.showModal();
  }

  setupInput();
}

function moveUp() {
  return slideTiles(grid.cellsByColumn);
}

function moveDown() {
  return slideTiles(grid.cellsByColumn.map((column) => [...column].reverse()));
}

function moveLeft() {
  return slideTiles(grid.cellsByRow);
}

function moveRight() {
  return slideTiles(grid.cellsByRow.map((row) => [...row].reverse()));
}

function slideTiles(cells) {
  return Promise.all(
    cells.flatMap((group) => {
      const promises = [];
      for (let i = 1; i < group.length; i++) {
        const cell = group[i];

        if (cell.tile == null) continue;

        let lastValidCell;

        for (let j = i - 1; j >= 0; j--) {
          const moveToCell = group[j];
          if (!moveToCell.canAccept(cell.tile)) break;
          lastValidCell = moveToCell;
        }

        if (lastValidCell != null) {
          promises.push(cell.tile.waitForTransition());
          if (lastValidCell.tile != null) {
            lastValidCell.mergeTile = cell.tile;
          } else {
            lastValidCell.tile = cell.tile;
          }
          cell.tile = null;
        }
      }

      return promises;
    })
  );
}

function canMoveUp() {
  return canMove(grid.cellsByColumn);
}
function canMoveDown() {
  return canMove(grid.cellsByColumn.map((col) => [...col].reverse()));
}
function canMoveLeft() {
  return canMove(grid.cellsByRow);
}
function canMoveRight() {
  return canMove(grid.cellsByRow.map((row) => [...row].reverse()));
}

function canMove(cells) {
  return cells.some((group) => {
    return group.some((cell, index) => {
      if (index === 0) return false;
      if (cell.tile == null) return false;
      const moveToCell = group[index - 1];
      return moveToCell.canAccept(cell.tile);
    });
  });
}

function startTimer() {
  startTime = Date.now();
  updateTimer();
}

function updateTimer() {
  const currentTime = Date.now();
  const elapsedMilliseconds = currentTime - startTime;
  elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

  // Update the timer element with the elapsed time
  timerElement.textContent = formatTime(elapsedSeconds);
  timerGlob = timerElement.textContent;

  console.log(elapsedSeconds);

  // Schedule the next update
  if (idle === false) requestAnimationFrame(updateTimer);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

// BOT

class AI {
  constructor(grid) {
    this.grid = grid;
  }
  // static evaluation function
  eval() {
    var emptyCells = this.grid.emptyCells().length;

    var smoothWeight = 0.1,
      //monoWeight   = 0.0,
      //islandWeight = 0.0,
      mono2Weight = 1.0,
      emptyWeight = 2.7,
      maxWeight = 1.0;

    return (
      this.grid.smoothness() * smoothWeight +
      //+ this.grid.monotonicity() * monoWeight
      //- this.grid.islands() * islandWeight
      this.grid.monotonicity2() * mono2Weight +
      Math.log(emptyCells) * emptyWeight +
      this.grid.maxValue() * maxWeight
    );
  }
  // alpha-beta depth first search
  search(depth, alpha, beta, positions, cutoffs) {
    var bestScore;
    var bestMove = -1;
    var result;

    // the maxing player
    if (this.grid.playerTurn) {
      bestScore = alpha;
      for (var direction in [0, 1, 2, 3]) {
        var newGrid = this.grid.clone();
        if (newGrid.move(direction).moved) {
          positions++;
          if (newGrid.isWin()) {
            return {
              move: direction,
              score: 10000,
              positions: positions,
              cutoffs: cutoffs,
            };
          }
          var newAI = new AI(newGrid);

          if (depth == 0) {
            result = { move: direction, score: newAI.eval() };
          } else {
            result = newAI.search(
              depth - 1,
              bestScore,
              beta,
              positions,
              cutoffs
            );
            if (result.score > 9900) {
              // win
              result.score--; // to slightly penalize higher depth from win
            }
            positions = result.positions;
            cutoffs = result.cutoffs;
          }

          if (result.score > bestScore) {
            bestScore = result.score;
            bestMove = direction;
          }
          if (bestScore > beta) {
            cutoffs++;
            return {
              move: bestMove,
              score: beta,
              positions: positions,
              cutoffs: cutoffs,
            };
          }
        }
      }
    } else {
      // computer's turn, we'll do heavy pruning to keep the branching factor low
      bestScore = beta;

      // try a 2 and 4 in each cell and measure how annoying it is
      // with metrics from eval
      var candidates = [];
      var cells = this.grid.emptyCells();
      var scores = { 2: [], 4: [] };
      for (var value in scores) {
        for (var i in cells) {
          scores[value].push(null);
          var cell = cells[i];
          var tile = new Tile(cell, parseInt(value, 10));
          this.grid.insertTile(tile);
          scores[value][i] = -this.grid.smoothness() + this.grid.islands();
          this.grid.removeTile(cell);
        }
      }

      // now just pick out the most annoying moves
      var maxScore = Math.max(
        Math.max.apply(null, scores[2]),
        Math.max.apply(null, scores[4])
      );
      for (var value in scores) {
        // 2 and 4
        for (var i = 0; i < scores[value].length; i++) {
          if (scores[value][i] == maxScore) {
            candidates.push({ position: cells[i], value: parseInt(value, 10) });
          }
        }
      }

      // search on each candidate
      for (var i = 0; i < candidates.length; i++) {
        var position = candidates[i].position;
        var value = candidates[i].value;
        var newGrid = this.grid.clone();
        var tile = new Tile(position, value);
        newGrid.insertTile(tile);
        newGrid.playerTurn = true;
        positions++;
        newAI = new AI(newGrid);
        result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
        positions = result.positions;
        cutoffs = result.cutoffs;

        if (result.score < bestScore) {
          bestScore = result.score;
        }
        if (bestScore < alpha) {
          cutoffs++;
          return {
            move: null,
            score: alpha,
            positions: positions,
            cutoffs: cutoffs,
          };
        }
      }
    }

    return {
      move: bestMove,
      score: bestScore,
      positions: positions,
      cutoffs: cutoffs,
    };
  }
  // performs a search and returns the best move
  getBest() {
    return this.iterativeDeep();
  }
  // performs iterative deepening over the alpha-beta search
  iterativeDeep() {
    var start = new Date().getTime();
    var depth = 0;
    var best;
    do {
      var newBest = this.search(depth, -10000, 10000, 0, 0);
      if (newBest.move == -1) {
        break;
      } else {
        best = newBest;
      }
      depth++;
    } while (new Date().getTime() - start < minSearchTime);
    return best;
  }
  translate(move) {
    return {
      0: "up",
      1: "right",
      2: "down",
      3: "left",
    }[move];
  }
}
