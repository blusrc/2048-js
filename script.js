import Grid from "./Grid.js";
import Tile from "./Tile.js";

const gameBoard = document.getElementById("game-board");
const gameEnd = document.getElementById("game-end-scene");
const gameEndTitle = document.getElementById("game-end-title");
const difficulty = 1;
const scoreCount = document.getElementById("score-count");
const gameEndCloseBtn = document.getElementById("close-game-end-scene");
const gameEndScoreCount = document.getElementById("game-end-score");
const gameEndTimer = document.getElementById("game-end-timer");

// testing modal
// gameEnd.showModal();

let startTime;
let elapsedSeconds = 0;
let timerGlob = "";
const timerElement = document.getElementById("timer");

const grid = new Grid(gameBoard, difficulty);
grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);
grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);

let idle = true;
setupInput();

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
    // gameEnd.showModal();
    return;
  }

  if (grid.maxPoint === 2048) {
    idle = !idle;
    gameEndTitle.textContent = "Victory! 🏆";
    gameEndScoreCount.textContent = grid.score;
    gameEndTimer.textContent = timerGlob;
    // gameEnd.showModal();
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
