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

function requestSessionList() {
    let event = {
        type: 'session_list'
    };
    state.websocket.send(JSON.stringify(event));
}

function receiveMessages({ data }: MessageEvent) {
    const event = JSON.parse(data);
    switch (event.type) {
        case 'session_list':
            populateSessionList(event['sessions']);
            break;
        case 'tick':
            clearAllSnakes();
            state.snakes.clear();
            for (let user_id in event.snakes) {
                state.snakes.set(parseInt(user_id), event.snakes[user_id]);
            }
            drawSnakes();

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
function getWebsocketServer() {
    if (window.location.host == 'vermin.io') {
        return 'wss://snakemmo.herokuapp.com/';
    } else if (window.location.host == 'localhost:8000') {
        return 'ws://localhost:8001/';
    } else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}

