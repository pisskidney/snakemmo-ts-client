const ROWS = 75;
const COLS = 150;
const CELL_WIDTH = 10;
const CELL_HEIGHT = 10;
const COLOR_APPLE = '#EF476F';
const COLOR_SNAKES = ['#FFD166', '#06D6A0', '#118AB2', '#073B4C'];
let state = {
    userID: undefined,
    sessionID: undefined,
    websocket: undefined
};
var Direction;
(function (Direction) {
    Direction[Direction["UP"] = 0] = "UP";
    Direction[Direction["DOWN"] = 1] = "DOWN";
    Direction[Direction["LEFT"] = 2] = "LEFT";
    Direction[Direction["RIGHT"] = 3] = "RIGHT";
})(Direction || (Direction = {}));
class Coordinates {
    constructor(x, y) {
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
let snakes = new Map();
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
            let coords = new Coordinates(i, j);
            cells.set(coords.hash, cell);
            drawDefaultCell(coords);
        }
    }
}
function drawApples(apples) {
    for (let coords of apples) {
        const cellCoords = new Coordinates(coords[0], coords[1]);
        let cell = cells.get(cellCoords.hash);
        cell.style.backgroundColor = COLOR_APPLE;
        cell.style.border = 'none';
        cell.style.borderRadius = '50%';
    }
}
function drawSnakes(snakes) {
    for (const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.length; i++) {
            const cellCoords = new Coordinates(coords[i][0], coords[i][1]);
            assignCell(cellCoords, snakeID);
        }
    }
    ;
}
function assignCell(coords, snakeID) {
    let cell = cells.get(coords.hash);
    cell.style.backgroundColor = COLOR_SNAKES[snakeID];
}
function clearAllSnakes(snakes) {
    for (const [snakeID, coords] of snakes) {
        for (let i = 0; i < coords.length; i++) {
            const cellCoords = new Coordinates(coords[i][0], coords[i][1]);
            drawDefaultCell(cellCoords);
        }
    }
    ;
}
function drawDefaultCell(coords) {
    let cell = cells.get(coords.hash);
    cell.style.backgroundColor = '#fff';
    cell.style.border = '1px solid #eee';
    cell.style.borderRadius = '0px';
}
function showPanel(panel) {
    let panelElement = document.getElementById(panel);
    panelElement.style.display = 'flex';
    let boardElement = document.getElementById('board');
    boardElement.style.transition = 'opacity 1s ease-in';
    boardElement.style.opacity = '0.5';
    boardElement.style.transition = 'filter 1s ease-in';
    boardElement.style.filter = 'grayscale(100%) blur(10px)';
}
function hidePanel(panel) {
    let panelElement = document.getElementById(panel);
    panelElement.style.display = 'none';
    let boardElement = document.getElementById('board');
    boardElement.style.transition = 'none';
    boardElement.style.opacity = '1';
    boardElement.style.filter = 'none';
}
function getWebsocketServer() {
    if (window.location.host == 'pisskidney.github.io') {
        return 'wss://snakemmo.herokuapp.com/';
    }
    else if (window.location.host == 'localhost:8000') {
        return 'ws://localhost:8001/';
    }
    else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}
function sendMoves(e) {
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
function receiveMessages({ data }) {
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
            break;
        default:
            throw new Error(`Unsupported event type: ${event.type}.`);
    }
}
function requestSessionList() {
    console.log('reqeusted session list');
    let event = {
        type: 'session_list'
    };
    state.websocket.send(JSON.stringify(event));
}
function populateSessionList(data) {
    console.log(data);
    let parent = document.querySelector('#session-list .glass');
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
        joinButton.addEventListener('click', function () {
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
    state.websocket = new WebSocket(getWebsocketServer());
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
    initBoard();
    initGame();
    document.getElementById('retry').addEventListener('click', () => {
        hidePanel('death-screen');
        newSnake();
    });
});
//# sourceMappingURL=main.js.map