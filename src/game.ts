import { State, SessionList } from './types';

const COLOR_SNAKES = ['#FFD166', '#06D6A0', '#118AB2', '#073B4C'];

let state: State = {
    userID: undefined,
    sessionID: undefined,
    websocket: undefined,
    assignedColors: new Set(),
    colorAssignments: new Map(),
    snakes: new Map(),
    apples: new Array(),
    cells: new Map()
};

let board = document.getElementById('board');

function getSnakeColor(snakeID: number) : string {
    let defaultColor = 'pink';
    if (state.colorAssignments.has(snakeID)) {
        return state.colorAssignments.get(snakeID);
    }
    for (let candidate of COLOR_SNAKES) {
        if (!state.assignedColors.has(candidate)) {
            state.assignedColors.add(candidate);
            state.colorAssignments.set(snakeID, candidate);
            return candidate;
        }
    }
    return defaultColor;
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

window.addEventListener('DOMContentLoaded', () => {
    initBoard();
    initGame();
    document.getElementById('retry').addEventListener('click', () => {
        hidePanel('death-screen');
        newSnake();
    });
});

