const ROWS = 75;
const COLS = 150;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;

type State = {
    userID: number,
    sessionID: string,
    websocket: WebSocket,
    assignedColors: Set<string>,
    colorAssignments: Map<number, string>,
};

let state: State = {
    userID: undefined,
    sessionID: undefined,
    websocket: undefined,
    assignedColors: new Set(),
    colorAssignments: new Map()
};


type Snake = {direction: string, cells: Array<[number, number]>};

type Session = {
    name: string,
    icon: string,
    players: number,
    observers: number,
}

type SessionList = {
    [key: string]: Session
}

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
            cell.style.left = j * (CELL_WIDTH + 1) + 'px';
            cell.style.top = i * (CELL_HEIGHT + 1) + 'px';
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
        cell.style.backgroundImage = 'url(assets/images/apple3.png)';
    }
}

function drawSnakes(snakes: Map<number, {direction: string, cells: Array<[number, number]>}>) {
    for(const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.cells.length; i++) {
            const cellCoords = new Coordinates(coords.cells[i][0], coords.cells[i][1]);
            assignCell(cellCoords, snakeID);
        }
    };
}

function assignCell(coords: Coordinates, snakeID: number) {
    let cell = cells.get(coords.hash);
    let color = 'red';
    if (state.colorAssignments.has(snakeID)) {
        color = state.colorAssignments.get(snakeID);
    } else {
        let randomColor = `#${Math.floor(Math.random()*16777215).toString(16)}`;
        state.colorAssignments.set(snakeID, randomColor);
    }
    cell.style.backgroundColor = color;
    cell.style.backgroundImage = 'none';
}

function clearAllSnakes(snakes: Map<number, Snake>) {
    for(const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.cells.length; i++) {
            const cellCoords = new Coordinates(coords.cells[i][0], coords.cells[i][1]);
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
    boardElement.style.transition = 'filter 1s ease-in';
    boardElement.style.filter = 'grayscale(100%) blur(10px)';
}

function hidePanel(panel: string) {
    let panelElement = document.getElementById(panel);
    panelElement.style.display = 'none';
    let boardElement = document.getElementById('board');
    boardElement.style.transition = 'none';
    boardElement.style.opacity = '1';
    boardElement.style.filter = 'none';
}

function getWebsocketServer() {
    if (window.location.host == 'multiplayersnake.io') {
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

function receiveMessages({ data }: MessageEvent) {
    const event = JSON.parse(data);
    switch (event.type) {
        case 'session_list':
            populateSessionList(event['sessions']);
            break;
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

function requestSessionList() {
    let event = {
        type: 'session_list'
    };
    state.websocket.send(JSON.stringify(event));
}

function populateSessionList(data: SessionList) {
    let parent = document.querySelector('#session-list .glass');
    parent.innerHTML = '';
    for (let sessionID in data) {
        let row = document.createElement('div');
        row.classList.add('session-list-row');
        let icon = document.createElement('div');
        icon.classList.add('icon');
        icon.style.backgroundImage = `url(assets/images/${sessionID}.png)`;
        let dataContainer = document.createElement('div');
        let name = document.createElement('div');
        name.innerHTML = data[sessionID].name;
        name.classList.add('name');
        let players = document.createElement('div');
        players.innerHTML = `Players: ${data[sessionID].players}/32`;
        players.classList.add('players');
        let observers = document.createElement('div');
        observers.innerHTML = `Observers: ${data[sessionID].observers}`;
        observers.classList.add('observers');
        let joinButton = document.createElement('button');
        dataContainer.appendChild(name).appendChild(players).appendChild(observers);
        joinButton.innerHTML = '&#8629';
        joinButton.addEventListener('click', function() {
            state.sessionID = sessionID;
            state.userID = Math.random() * 10000;
            joinGame();
            hidePanel('session-list');
        });
        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(dataContainer);
        row.appendChild(joinButton);
        parent.appendChild(row);
    }
}

function initGame() {
    // Open the WebSocket connection and register event handlers.
    state.websocket = new WebSocket(getWebsocketServer());

    // Get session list
    state.websocket.addEventListener('open', () => {
        requestSessionList();
    });

    state.websocket.addEventListener('message', receiveMessages);
}

function joinGame() {
    newSnake();
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
    initGame();
    document.getElementById('retry').addEventListener('click', () => {
        hidePanel('death-screen');
        newSnake();
    });
});

