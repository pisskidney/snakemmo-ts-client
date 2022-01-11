type State = {
    userID: number,
    sessionID: string,
    websocket: WebSocket,
    assignedColors: Set<string>,
    colorAssignments: Map<number, string>,
    snakes: Map<number, Snake>,
    apples: Array<Coordinates>,
    cells: Map<Coordinates, HTMLElement>
};

type Session = {
    name: string,
    icon: string,
    players: number,
    observers: number,
}

type SessionList = {
    [key: string]: Session
}

type Snake = {
    direction: string,
    cells: Array<Array<number>>
}

export { State, SessionList, Snake };
