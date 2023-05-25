import InvalidMoveError from "./InvalidMoveError.js";
import Tile from "./Tile.js";

const DEFAULT_GRID_SIZE = 4;
const DEFAULT_CELL_SIZE = 19;
const DEFAULT_CELL_GAP = 2;

export default class Grid {
  #cells;
  #score;
  #maxPoint;
  #size;
  #startTiles;
  #playerTurn;

  constructor(
    gridElem,
    diff,
    {
      gridSize = diff === 0 ? DEFAULT_GRID_SIZE + 2 : DEFAULT_GRID_SIZE,
      cellSize = diff === 0 ? DEFAULT_CELL_SIZE - 6 : DEFAULT_CELL_SIZE,
      cellGap = DEFAULT_CELL_GAP,
    } = {}
  ) {
    gridElem.innerHTML = "";
    gridElem.style.setProperty("--grid-size", gridSize);
    gridElem.style.setProperty("--cell-size", `${cellSize}vmin`);
    gridElem.style.setProperty("--cell-gap", `${cellGap}vmin`);

    this.#cells = createCellElements(gridElem, gridSize).map((cell, index) => {
      return new Cell(cell, index % gridSize, Math.floor(index / gridSize));
    });

    this.#size = gridSize;
    this.#startTiles = 2;

    this.#score = 0;
    this.#maxPoint = 0;

    this.playerTurn = true;
  }

  get playerTurn() {
    return this.#playerTurn;
  }

  set playerTurn(val) {
    this.#playerTurn = val;
  }

  get playerTurn() {
    return this.#playerTurn;
  }
  set playerTurn(val) {
    this.#playerTurn = val;
  }

  get size() {
    return this.#size;
  }

  get maxPoint() {
    return this.#maxPoint;
  }

  set maxPoint(val) {
    this.#maxPoint = val;
  }

  get score() {
    return this.#score;
  }

  set score(val) {
    this.#score = val;
  }

  get cells() {
    return this.#cells;
  }

  get cellsByColumn() {
    return this.#cells.reduce((cellGrid, cell) => {
      cellGrid[cell.x] = cellGrid[cell.x] || [];
      cellGrid[cell.x][cell.y] = cell;
      return cellGrid;
    }, []);
  }

  get cellsByRow() {
    return this.#cells.reduce((cellGrid, cell) => {
      cellGrid[cell.y] = cellGrid[cell.y] || [];
      cellGrid[cell.y][cell.x] = cell;
      return cellGrid;
    }, []);
  }

  get emptyCells() {
    return this.#cells.filter((cell) => cell.tile == null);
  }

  randomEmptyCell() {
    const randomIndex = Math.floor(Math.random() * this.emptyCells.length);
    return this.emptyCells[randomIndex];
  }

  moveTilesUp() {
    return this.#moveTiles(this.cellsByColumn);
  }

  moveTilesDown() {
    return this.#moveTiles(
      this.cellsByColumn.map((column) => [...column].reverse())
    );
  }

  moveTilesLeft() {
    return this.#moveTiles(this.cellsByRow);
  }

  moveTilesRight() {
    return this.#moveTiles(this.cellsByRow.map((row) => [...row].reverse()));
  }

  clone(grid, diff) {
    const clonedGrid = new Grid(grid, diff);

    clonedGrid.#cells = this.#cells.map((cell) => {
      const clonedCell = new Cell(cell.cellElement.cloneNode(), cell.x, cell.y);
      clonedCell.tile = cell.tile ? new Tile(grid, diff) : null;
      clonedCell.mergeTile = cell.mergeTile
        ? new Tile(cell.mergeTile.value)
        : null;
      return clonedCell;
    });

    clonedGrid.#size = this.#size;
    clonedGrid.#startTiles = this.#startTiles;
    clonedGrid.#score = this.#score;
    clonedGrid.#maxPoint = this.#maxPoint;
    clonedGrid.playerTurn = this.playerTurn;

    return clonedGrid;
  }

  async #moveTiles(cells) {
    await Promise.all(
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

    const additionalScore = this.cells.reduce((sum, cell) => {
      if (cell.mergeTile == null || cell.tile == null) return sum;
      return sum + cell.mergeTile.value + cell.tile.value;
    }, 0);

    this.cells.forEach((cell) => cell.mergeTiles());
    return additionalScore;
  }

  canMoveTilesAnyDirection() {
    return (
      this.canMoveTilesUp() ||
      this.canMoveTilesDown() ||
      this.canMoveTilesLeft() ||
      this.canMoveTilesRight()
    );
  }

  isLose() {
    return (
      !this.canMoveTilesUp() &&
      !this.canMoveTilesDown() &&
      !this.canMoveTilesLeft() &&
      !this.canMoveTilesRight()
    );
  }

  canMove(direction) {
    if (direction === 0) {
      return this.canMoveTilesUp;
    }
    if (direction === 1) {
      return this.canMoveTilesRight;
    }
    if (direction === 2) {
      return this.canMoveTilesDown;
    }
    if (direction === 3) {
      return this.canMoveTilesLeft;
    }
  }

  isWin() {
    return this.maxPoint === 2048;
  }

  canMoveTilesUp() {
    return this.#canMoveTiles(this.cellsByColumn);
  }

  canMoveTilesDown() {
    return this.#canMoveTiles(
      this.cellsByColumn.map((column) => [...column].reverse())
    );
  }

  canMoveTilesLeft() {
    return this.#canMoveTiles(this.cellsByRow);
  }

  canMoveTilesRight() {
    return this.#canMoveTiles(this.cellsByRow.map((row) => [...row].reverse()));
  }

  #canMoveTiles(cells) {
    return cells.some((group) => {
      return group.some((cell, index) => {
        if (index === 0) return false;
        if (cell.tile == null) return false;
        const moveToCell = group[index - 1];
        return moveToCell.canAccept(cell.tile);
      });
    });
  }

  moveTiles(direction) {
    switch (direction) {
      case "ArrowUp":
      case "k":
      case "w":
        if (!this.canMoveTilesUp()) throw new InvalidMoveError();
        return this.moveTilesUp();
      case "ArrowDown":
      case "j":
      case "s":
        if (!this.canMoveTilesDown()) throw new InvalidMoveError();
        return this.moveTilesDown();
      case "ArrowLeft":
      case "h":
      case "a":
        if (!this.canMoveTilesLeft()) throw new InvalidMoveError();
        return this.moveTilesLeft();
      case "ArrowRight":
      case "l":
      case "d":
        if (!this.canMoveTilesRight()) throw new InvalidMoveError();
        return this.moveTilesRight();
      default:
        throw new InvalidMoveError();
    }
  }

  smoothness() {
    let smoothness = 0;

    // Calculate the sum of pairwise differences between neighboring tiles
    this.cells.forEach((cell) => {
      const neighbors = this.getNeighbors(cell);
      neighbors.forEach((neighbor) => {
        if (cell.tile && neighbor.tile) {
          const diff = Math.abs(
            Math.log2(cell.tile.value) - Math.log2(neighbor.tile.value)
          );
          smoothness += diff;
        }
      });
    });

    return smoothness;
  }

  getNeighbors(cell) {
    const neighbors = [];

    const topNeighbor = this.getCellByPosition(cell.x, cell.y - 1);
    if (topNeighbor) neighbors.push(topNeighbor);

    const bottomNeighbor = this.getCellByPosition(cell.x, cell.y + 1);
    if (bottomNeighbor) neighbors.push(bottomNeighbor);

    const leftNeighbor = this.getCellByPosition(cell.x - 1, cell.y);
    if (leftNeighbor) neighbors.push(leftNeighbor);

    const rightNeighbor = this.getCellByPosition(cell.x + 1, cell.y);
    if (rightNeighbor) neighbors.push(rightNeighbor);

    return neighbors;
  }

  getCellByPosition(x, y) {
    if (x < 0 || x >= this.size || y < 0 || y >= this.size) {
      return null; // Neighbor is outside the grid
    }
    return this.cellsByRow[y][x];
  }

  monotonicity() {
    var totals = [0, 0, 0, 0];

    // Up/Down direction
    for (var x = 0; x < this.size; x++) {
      var current = 0;
      var next = current + 1;
      while (next < this.size) {
        while (next < this.size && !this.cellsByColumn[x][next].tile) {
          next++;
        }
        if (next >= this.size) {
          next--;
        }
        var currentValue = this.cellsByColumn[x][current].tile
          ? Math.log2(this.cellsByColumn[x][current].tile.value)
          : 0;
        var nextValue = this.cellsByColumn[x][next].tile
          ? Math.log2(this.cellsByColumn[x][next].tile.value)
          : 0;
        if (currentValue > nextValue) {
          totals[0] += nextValue - currentValue;
        } else if (nextValue > currentValue) {
          totals[1] += currentValue - nextValue;
        }
        current = next;
        next++;
      }
    }

    // Left/Right direction
    for (var y = 0; y < this.size; y++) {
      var current = 0;
      var next = current + 1;
      while (next < this.size) {
        while (next < this.size && !this.cellsByRow[y][next].tile) {
          next++;
        }
        if (next >= this.size) {
          next--;
        }
        var currentValue = this.cellsByRow[y][current].tile
          ? Math.log2(this.cellsByRow[y][current].tile.value)
          : 0;
        var nextValue = this.cellsByRow[y][next].tile
          ? Math.log2(this.cellsByRow[y][next].tile.value)
          : 0;
        if (currentValue > nextValue) {
          totals[2] += nextValue - currentValue;
        } else if (nextValue > currentValue) {
          totals[3] += currentValue - nextValue;
        }
        current = next;
        next++;
      }
    }

    return Math.max(totals[0], totals[1]) + Math.max(totals[2], totals[3]);
  }

  islands() {
    // Create a 2D matrix to track visited tiles
    const visited = Array.from({ length: this.size }, () =>
      Array(this.size).fill(false)
    );

    let islandCount = 0;

    // Perform a depth-first search (DFS) on each tile
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (!visited[row][col]) {
          const tile = this.grid[row][col];
          if (tile !== null) {
            islandCount++;
            this.dfs(row, col, visited);
          }
        }
      }
    }

    return islandCount;
  }

  dfs(row, col, visited) {
    // Define the four possible directions: up, right, down, left
    const directions = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];

    visited[row][col] = true;

    for (const [dx, dy] of directions) {
      const newRow = row + dx;
      const newCol = col + dy;

      // Check if the new coordinates are within the grid bounds
      if (
        newRow >= 0 &&
        newRow < this.size &&
        newCol >= 0 &&
        newCol < this.size
      ) {
        // Check if the adjacent tile is part of the same island and not visited
        if (!visited[newRow][newCol] && this.grid[newRow][newCol] !== null) {
          this.dfs(newRow, newCol, visited);
        }
      }
    }
  }
}

class Cell {
  #cellElement;
  #x;
  #y;
  #tile;
  #mergeTile;

  constructor(cellElement, x, y) {
    this.#cellElement = cellElement;
    this.#x = x;
    this.#y = y;
  }

  get cellElement() {
    return this.#cellElement;
  }

  set cellElement(val) {
    this.#cellElement = val;
  }

  get tile() {
    return this.#tile;
  }

  set tile(val) {
    this.#tile = val;
  }

  set tile(value) {
    this.#tile = value;
    if (value == null) return;
    this.#tile.x = this.#x;
    this.#tile.y = this.#y;
  }

  get x() {
    return this.#x;
  }

  get y() {
    return this.#y;
  }

  get mergeTile() {
    return this.#mergeTile;
  }

  set mergeTile(value) {
    this.#mergeTile = value;
    if (value == null) return;
    this.#mergeTile.x = this.#x;
    this.#mergeTile.y = this.#y;
  }

  canAccept(tile) {
    return (
      this.tile == null ||
      (this.mergeTile == null && this.tile.value === tile.value)
    );
  }

  mergeTiles(grid) {
    if (this.tile == null || this.mergeTile == null) return;

    const scoreToAdd = this.tile.value + this.mergeTile.value;
    grid.score += scoreToAdd;

    if (scoreToAdd > grid.maxPoint) {
      grid.maxPoint = scoreToAdd;
      // console.log(grid.maxPoint);
    }

    this.tile.value += this.mergeTile.value;

    this.mergeTile.remove();
    this.mergeTile = null;
  }
}

function createCellElements(gridElement, gridSize) {
  const cells = [];

  for (let i = 0; i < gridSize * gridSize; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cells.push(cell);
    gridElement.append(cell);
  }

  return cells;
}
