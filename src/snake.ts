const ROWS = 75;
const COLS = 100;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

const COLOR_APPLE = '#EF476F';
const COLOR_SNAKES = ['#FFD166', '#06D6A0', '#118AB2', '#073B4C'];

interface State {
    userID: number,
    sessionID: string,
    websocket: WebSocket
};

let state: State = {
    userID: undefined,
    sessionID: undefined,
    websocket: undefined
};


type Snake = Array<[number, number]>;

enum Direction {
    UP,
    DOWN,
    LEFT,
    RIGHT
}

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

let board = document.getElementById('board');
let cells = new Map();
let apples = new Array();

let snakes: Map<number, Snake> = new Map();

function initBoard() {
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let cell = document.createElement('div');
            cell.style.position = 'absolute';
            cell.style.left = j * CELL_WIDTH + 'px';
            cell.style.top = i * CELL_HEIGHT + 'px';
            cell.style.width = CELL_WIDTH + 'px';
            cell.style.height = CELL_HEIGHT + 'px';
            board.appendChild(cell);
            let coords = new Coordinates(i, j)
            cells.set(coords.hash, cell);
            drawDefaultCell(coords);
        }
    }
}

function drawApples(apples: Array<[number, number]>) {
    for (let coords of apples) {
        const cellCoords = new Coordinates(coords[0], coords[1]);
        let cell = cells.get(cellCoords.hash);
        cell.style.backgroundColor = COLOR_APPLE;
        cell.style.border = 'none';
        cell.style.borderRadius = '50%';
    }
}

function drawSnakes(snakes: Map<number, Array<[number, number]>>) {
    for(const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.length; i++) {
            const cellCoords = new Coordinates(coords[i][0], coords[i][1]);
            assignCell(cellCoords, snakeID);
        }
    };
}

function assignCell(coords: Coordinates, snakeID: number) {
    let cell = cells.get(coords.hash);
    cell.style.backgroundColor = COLOR_SNAKES[snakeID];
}

function clearAllSnakes(snakes: Map<number, Array<Array<number>>>) {
    for(const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.length; i++) {
            const cellCoords = new Coordinates(coords[i][0], coords[i][1]);
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

function showPanel(panel: string) {
    let panelElement = document.getElementById(panel);
    panelElement.style.display = 'flex';
    let boardElement = document.getElementById('board');
    boardElement.style.transition = 'opacity 1s ease-in';
    boardElement.style.opacity = '0.5';
}

function hidePanel(panel: string) {
    let panelElement = document.getElementById(panel);
    panelElement.style.display = 'none';
    let boardElement = document.getElementById('board');
    boardElement.style.transition = 'none';
    boardElement.style.opacity = '1';
}

function getWebsocketServer() {
    if (window.location.host == 'pisskidney.github.io') {
        return 'wss://snakemmo.herokuapp.com/';
    } else if (window.location.host == 'localhost:8000') {
        return 'ws://localhost:8001/';
    } else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}

function sendMoves(e: KeyboardEvent) {
    let event = {
        type: 'play',
        user_id: state.userID,
        direction: ''
    };
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            event.direction = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            event.direction = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            event.direction = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            event.direction = 'right';
            break;
    }
    state.websocket.send(JSON.stringify(event));
}

function receiveMoves({ data }: MessageEvent) {
    const event = JSON.parse(data);
    switch (event.type) {
        case 'tick':
            clearAllSnakes(snakes);
            snakes.clear();
            for (let user_id in event.snakes) {
                snakes.set(parseInt(user_id), event.snakes[user_id]);
            }
            drawSnakes(snakes);

            apples.length = 0;
            for (let coords of event.apples) {
                apples.push(coords);
            }
            drawApples(apples);

            if (event.deaths.includes(state.userID)) {
                showPanel('death-screen');
            }

            break;
        case 'error':
            // showMessage(event.message);
            break;
        default:
            throw new Error(`Unsupported event type: ${event.type}.`);
    }
}

function initGame() {
    // Open the WebSocket connection and register event handlers.
    state.websocket = new WebSocket(getWebsocketServer());
    state.websocket.addEventListener('message', receiveMoves);
    joinGame();
}

function joinGame() {
    state.websocket.addEventListener('open', () => {
        newSnake();
    });
    window.addEventListener('keydown', sendMoves);
}

function newSnake() {
    const event = {
        type: 'join',
        user_id: state.userID,
        session_id: state.sessionID
    };
    state.websocket.send(JSON.stringify(event));
}

window.addEventListener('DOMContentLoaded', () => {
    // Initialize the UI.
    initBoard();
    document.getElementById('join').addEventListener('click', () => {
        let userIDElement = (<HTMLInputElement> document.getElementById('user-id'));
        let sessionIDElement = (<HTMLInputElement> document.getElementById('session-id'));
        if (!userIDElement.value) {
            userIDElement.style.borderColor = 'red';
        } else if (!sessionIDElement.value) {
            sessionIDElement.style.borderColor = 'red';
        } else {
            state.userID = parseInt(userIDElement.value);
            state.sessionID = sessionIDElement.value;
            hidePanel('panel');
            initGame();
        }
    });
    document.getElementById('retry').addEventListener('click', () => {
        hidePanel('death-screen');
        newSnake();
    });
});

