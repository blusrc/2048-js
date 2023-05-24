const DEFAULT_GRID_SIZE = 4;
const DEFAULT_CELL_SIZE = 19;
const DEFAULT_CELL_GAP = 2;

export default class Grid {
  #cells;
  #score;

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
    this.#score = 0;
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

  get #emptyCells() {
    return this.#cells.filter((cell) => cell.tile == null);
  }

  randomEmptyCell() {
    const randomIndex = Math.floor(Math.random() * this.#emptyCells.length);
    return this.#emptyCells[randomIndex];
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

  get tile() {
    return this.#tile;
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
