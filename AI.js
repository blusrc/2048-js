import Tile from "./Tile.js";

export default class AI {
  #grid;

  constructor(grid) {
    this.#grid = grid;
  }

  eval() {
    var emptyCells = this.grid.emptyCells.length;

    var smoothWeight = 0.1,
      mono2Weight = 1.0,
      emptyWeight = 2.7,
      maxWeight = 1.0;

    return (
      this.grid.smoothness() * smoothWeight +
      this.grid.monotonicity() * mono2Weight +
      Math.log(emptyCells) * emptyWeight +
      this.grid.maxPoint * maxWeight
    );
  }

  get grid() {
    return this.#grid;
  }

  set grid(val) {
    this.#grid = val;
  }

  search(depth, alpha, beta, positions, cutoffs, grid, diff) {
    var bestScore;
    var bestMove = -1;
    var result;

    if (this.grid.playerTurn) {
      bestScore = alpha;
      for (var direction of [0, 1, 2, 3]) {
        direction = this.translate(direction);
        console.log("finding best: " + direction);
        var newGrid = this.grid.clone(grid, diff);
        if (newGrid.canMove(direction)) {
          newGrid.moveTiles(direction);
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

          if (depth === 0) {
            result = { move: direction, score: newAI.eval() };
          } else {
            result = newAI.search(
              depth - 1,
              bestScore,
              beta,
              positions,
              cutoffs,
              grid,
              diff
            );
            if (result.score > 9900) {
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
      bestScore = beta;
      var candidates = [];
      var cells = this.grid.emptyCells();
      var scores = { 2: [], 4: [] };
      for (var value in scores) {
        for (var i = 0; i < cells.length; i++) {
          scores[value].push(null);
          var cell = cells[i];
          var tile = new Tile(cell, parseInt(value, 10));
          this.grid.insertTile(tile);
          scores[value][i] = -this.grid.smoothness() + this.grid.islands();
          this.grid.removeTile(cell);
        }
      }

      var maxScore = Math.max(Math.max(...scores[2]), Math.max(...scores[4]));
      for (var value in scores) {
        for (var i = 0; i < scores[value].length; i++) {
          if (scores[value][i] == maxScore) {
            candidates.push({ position: cells[i], value: parseInt(value, 10) });
          }
        }
      }

      for (var i = 0; i < candidates.length; i++) {
        var position = candidates[i].position;
        var value = candidates[i].value;
        var newGrid = this.#grid.clone();
        var tile = new Tile(grid, diff);
        newGrid.randomEmptyCell = Tile;
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

  getBest(grid, diff) {
    const bestMove = this.iterativeDeep(grid, diff);
    console.log(bestMove);

    // const res = this.translate(bestMove.move);
    // console.log(res);
    return bestMove + "";
  }

  iterativeDeep(grid, diff) {
    var start = new Date().getTime();
    var depth = 0;
    var best;
    do {
      var newBest = this.search(depth, -10000, 10000, 0, 0, grid, diff);
      if (newBest.move === -1) {
        break;
      } else {
        best = newBest;
      }
      depth++;
    } while (new Date().getTime() - start < 100);
    return best;
  }

  translate(move) {
    return {
      0: "ArrowUp",
      1: "ArrowRight",
      2: "ArrowDown",
      3: "ArrowLeft",
    }[move];
  }

  translateback(move) {
    return {
      ArrowUp: 0,
      ArrowRight: 1,
      ArrowDown: 2,
      ArrowLeft: 3,
    }[move];
  }
}
