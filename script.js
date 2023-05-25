import Grid from "./Grid.js";
import Tile from "./Tile.js";
import InvalidMoveError from "./InvalidMoveError.js";

import AI from "./AI.js";

const outputBox = document.getElementById("diff-output");
const diffDialog = document.getElementById("diff-dialog");
const selectEl = diffDialog.querySelector("select");
const confirmBtn = diffDialog.querySelector("#confirmBtn");

let difficulty;
diffDialog.showModal();

// "Favorite animal" input sets the value of the submit button
selectEl.addEventListener("change", (e) => {
  confirmBtn.value = selectEl.value;
});

// "Cancel" button closes the dialog without submitting because of [formmethod="dialog"], triggering a close event.
diffDialog.addEventListener("close", (e) => {
  console.log("close triggered");
  console.log("return Value " + diffDialog.returnValue);
  outputBox.value = diffDialog.returnValue;

  difficulty =
    diffDialog.returnValue === "default" ? 0 : parseInt(diffDialog.returnValue);
  console.log("final diff: " + difficulty);
  setupGame();
  // === "default"
  //   ? "No return value."
  //   : `ReturnValue: ${diffDialog.returnValue}.`; // Have to check for "default" rather than empty string
});

// Prevent the "confirm" button from the default behavior of submitting the form, and close the dialog with the `close()` method, which triggers the "close" event.
confirmBtn.addEventListener("click", (event) => {
  event.preventDefault(); // We don't want to submit this fake form
  diffDialog.close(selectEl.value); // Have to send the select box value here.
});

const gameBoard = document.getElementById("game-board");
const scoreCount = document.getElementById("score-count");
const timerElement = document.getElementById("timer");

const gameEnd = document.getElementById("game-end-scene");
const gameEndTitle = document.getElementById("game-end-title");
const gameEndCloseBtn = document.getElementById("close-game-end-scene");
const gameEndScoreCount = document.getElementById("game-end-score");
const gameEndTimer = document.getElementById("game-end-timer");

const botButton = document.getElementById("bot-button");
botButton.addEventListener("click", handleBotButtonClick);

let startTime;
let elapsedSeconds = 0;
let timerGlob = "";
let idle = true;

console.log(difficulty);

let grid;

function setupGame() {
  if (difficulty != null) {
    // GAME SETUP

    // testing modal
    // gameEnd.showModal();

    grid = new Grid(gameBoard, difficulty);
    grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);
    grid.randomEmptyCell().tile = new Tile(gameBoard, difficulty);

    // const ai = new AI(grid);
    setupInput();

    // HELPER FUNCTIONS
  }
}

function setupInput() {
  window.addEventListener("keydown", handleInput, { once: true });
}

gameEndCloseBtn.addEventListener("click", () => {
  console.log("closing modal");
  gameEnd.close();
});

async function handleInput(e) {
  try {
    grid.moveTiles(e.key);
  } catch (e) {
    if (e instanceof InvalidMoveError) {
      if (grid.canMoveTilesAnyDirection()) setupInput();
      return;
    }
    throw e;
  }

  // start timer after first key input
  if (idle) {
    idle = !idle;
    startTimer();
  }

  grid.cells.forEach((cell) => cell.mergeTiles(grid));

  //   console.log(grid.score);
  scoreCount.textContent = grid.score;

  const newTile = new Tile(gameBoard, difficulty);
  grid.randomEmptyCell().tile = newTile;

  // Check if the game is lost or won
  if (grid.isLose()) {
    endGame("Game over! 🥲");
    return;
  }

  if (grid.isWin()) {
    endGame("Victory! 🏆");
    return;
  }
  setupInput();
}

function startTimer() {
  startTime = Date.now();
  updateTimer();
}

function handleBotButtonClick() {
  // Disable the bot button to prevent multiple clicks
  botButton.disabled = true;

  // Start the timer
  if (idle) {
    idle = !idle;
    startTimer();
  }

  // Play AI moves
  playAI();
}

function endGame(message) {
  // Stop the timer
  idle = true;

  // Show the game end modal with the appropriate message and details
  gameEndTitle.textContent = message;
  gameEndScoreCount.textContent = grid.score;
  gameEndTimer.textContent = timerGlob;
  gameEnd.showModal();
}

function updateTimer() {
  const currentTime = Date.now();
  const elapsedMilliseconds = currentTime - startTime;
  elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);

  // Update the timer element with the elapsed time
  timerElement.textContent = formatTime(elapsedSeconds);
  timerGlob = timerElement.textContent;

  // console.log(elapsedSeconds);

  // Schedule the next update
  if (idle === false) requestAnimationFrame(updateTimer);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function playAI() {
  // Get the AI's next move
  // const nextMove = ai.getBest(gameBoard, difficulty);

  const moves = ["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"];
  const nextMove = moves[Math.floor(Math.random() * moves.length)];

  // I tried to add the AI model to this app but I couldn't make it work,
  // So let's enjoy just some randomness

  // Move the tiles based on the AI's decision
  try {
    grid.moveTiles(nextMove);
  } catch (e) {
    if (e instanceof InvalidMoveError) {
      if (grid.canMoveTilesAnyDirection()) {
        // If the AI's move was invalid but there are still valid moves, continue playing
        setTimeout(playAI, 500); // Delay between AI moves (adjust as needed)
      } else {
        // If there are no valid moves left, end the game
        endGame();
      }
      return;
    }
    throw e;
  }

  // Update the grid and perform necessary actions
  grid.cells.forEach((cell) => cell.mergeTiles(grid));
  scoreCount.textContent = grid.score;
  const newTile = new Tile(gameBoard, difficulty);
  grid.randomEmptyCell().tile = newTile;

  // Check if the game is lost or won
  if (grid.isLose()) {
    endGame("Game over! 🥲");
    return;
  }

  if (grid.isWin()) {
    endGame("Victory! 🏆");
    return;
  }

  // Continue playing AI moves
  setTimeout(playAI, 500); // Delay between AI moves (adjust as needed)
}
