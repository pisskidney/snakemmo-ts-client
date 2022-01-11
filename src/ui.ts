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

function populateSessionList(data: SessionList) {
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
