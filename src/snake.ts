const ROWS = 75;
const COLS = 150;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

class Coordinates {
    x: number;
    y: number;

    constructor (x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get hash() {
        return `${this.x}_${this.y}`;
    }
}

function initBoard() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.left = j * (CELL_WIDTH + 1) + 'px';
            cell.style.top = i * (CELL_HEIGHT + 1) + 'px';
            cell.style.width = CELL_WIDTH + 'px';
            cell.style.height = CELL_HEIGHT + 'px';
            let innerCell = document.createElement('div');
            innerCell.style.position = 'absolute';
            innerCell.style.width = '100%';
            innerCell.style.height = '100%';
            cell.appendChild(innerCell);
            board.appendChild(cell);
            let coords = new Coordinates(i, j)
            cells.set(coords.hash, innerCell);
            drawDefaultCell(coords);
        }
    }
}

function drawApples(apples: Array<[number, number]>) {
    for (let coords of apples) {
        const cellCoords = new Coordinates(coords[0], coords[1]);
        let cell = cells.get(cellCoords.hash);
        cell.style.backgroundImage = 'url(assets/images/apple3.png)';
    }
}

function drawSnakes() {
    for(const [snakeID, snake] of state.snakes) {
        for (let i = 0; i < snake.cells.length; i++) {
            const cellCoords = new Coordinates(snake.cells[i][0], snake.cells[i][1]);
            if (i == snake.cells.length - 1) {
                assignHead(cellCoords, snakeID);
                continue;
            }
            assignCell(cellCoords, snakeID);
        }
    };
}

function assignHead(coords: Coordinates, snakeID: number) {
    let cell = cells.get(coords.hash);
    let color = getSnakeColor(snakeID);
    cell.style.backgroundColor = 'pink';
    cell.style.backgroundImage = 'none';
}

function assignCell(coords: Coordinates, snakeID: number) {
    let cell = cells.get(coords.hash);
    let color = getSnakeColor(snakeID);
    cell.style.backgroundColor = color;
    cell.style.backgroundImage = 'none';
}

function clearAllSnakes() {
    for(const [snakeID, snake] of state.snakes) {
        for (let i = 0; i < snake.cells.length; i++) {
            const cellCoords = new Coordinates(snake.cells[i][0], snake.cells[i][1]);
            drawDefaultCell(cellCoords);
        }
    };
}

function drawDefaultCell(coords: Coordinates) {
    let cell = cells.get(coords.hash);
    cell.style.backgroundColor = '#fff';
    cell.style.border = '1px solid #eee';
    cell.style.borderRadius = '0px';
}
