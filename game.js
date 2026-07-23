// ================== GAME CLIENT ==================

let myId = null;
let myName = null;
let myEmail = null;
let googleUserInfo = null;

const loginScreen = document.getElementById('loginScreen');
const gameCanvas = document.getElementById('gameCanvas');
const chatInput = document.getElementById('chatInput');
const commandPanel = document.getElementById('commandPanel');
const hudStatus = document.getElementById('hudStatus');

let socket = null;

const GOOGLE_CLIENT_ID = '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';
const loginBtn = document.getElementById('googleLoginBtn');

loginBtn.onclick = () => {
    if (!window.google || !window.google.accounts) {
        alert('Google Sign-In não está disponível no momento.');
        return;
    }
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
    });
    window.google.accounts.id.prompt(notification => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            alert('Falha ao abrir o popup de login Google.');
        }
    });
};

function handleGoogleLogin(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    myEmail = payload.email;
    myName = payload.name;
    googleUserInfo = { email: myEmail, name: myName };

    if (myEmail !== 'enzosantiagosrv1245@gmail.com') {
        alert('Acesso negado. Apenas desenvolvedores podem entrar.');
        return;
    }

    loginScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    chatInput.style.display = 'block';
    connectSocketWithAuth();
}

function connectSocketWithAuth() {
    socket = io({ auth: { userInfo: googleUserInfo } });

    socket.on('connect', () => {
        myId = socket.id;
        updateHud();
    });

    socket.on('gameStateUpdate', (serverState) => {
        gameState = serverState;
        updateHud();
    });

    socket.on('newMessage', (message) => {
        chatMessages.push(message);
        if (chatMessages.length > MAX_MESSAGES) chatMessages.shift();
    });

    socket.on('commandResponse', (message) => {
        chatMessages.push({ name: 'Sistema', text: message });
        if (chatMessages.length > MAX_MESSAGES) chatMessages.shift();
    });

    socket.on('commandVisibility', (visible) => {
        setCommandPanelVisible(visible);
    });

    socket.on('banMessage', (data) => {
        alert(data.reason);
        document.body.innerHTML = `<h1 style="color:${data.color};text-align:center;margin-top:40vh;">${data.reason}</h1>`;
    });
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const movement = { up: false, down: false, left: false, right: false };
let mouse = { x: 0, y: 0 };
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 7;
let commandPanelVisible = false;

let gameState = {
    players: {},
    arrows: [],
    timeLeft: 120,
    startTime: 60,
    gamePhase: 'waiting',
    abilityCosts: {},
    takenAbilities: [],
    skateboard: null,
    ducts: [],
    box: [],
    furniture: [],
    house: { walls: [] },
    garage: { walls: [] }
};

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}

const human = loadImage('Sprites/Human.png');
const grass = loadImage('Sprites/Grass.png');
const floors = loadImage('Sprites/Floor.png');

function setup() {
    document.body.style.backgroundColor = '#000';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';

    chatInput.style.display = 'none';
    chatInput.style.position = 'absolute';
    chatInput.style.bottom = '20px';
    chatInput.style.left = '50%';
    chatInput.style.transform = 'translateX(-50%)';
    chatInput.style.width = '52%';
    chatInput.style.maxWidth = '760px';
    chatInput.style.padding = '12px 14px';
    chatInput.style.fontSize = '16px';
    chatInput.style.border = '2px solid rgba(255,255,255,0.2)';
    chatInput.style.backgroundColor = 'rgba(0,0,0,0.78)';
    chatInput.style.color = 'white';
    chatInput.style.borderRadius = '8px';
    chatInput.style.outline = 'none';
    chatInput.style.zIndex = '10';

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

setup();

function updateHud() {
    if (hudStatus) {
        if (myId && gameState.players && gameState.players[myId]) {
            const me = gameState.players[myId];
            hudStatus.textContent = `Jogador: ${me.name} | Mapa: 6000x2000 | Comandos: cmd:on / cmd:off`;
        } else {
            hudStatus.textContent = 'Aguardando conexão...';
        }
    }
}

function setCommandPanelVisible(visible) {
    commandPanelVisible = visible;
    if (commandPanel) {
        commandPanel.style.display = visible ? 'block' : 'none';
        if (visible) {
            commandPanel.innerHTML = [
                '<strong>Comandos formais</strong>',
                '<div>cmd:on</div>',
                '<div>cmd:off</div>',
                '<div>tp:playerName:me</div>',
                '<div>tp:all:me</div>',
                '<div>tp:all:15,17</div>'
            ].join('');
        }
    }
}

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const me = gameState.players[myId];

    if (key === 'enter') {
        event.preventDefault();
        if (isChatting) {
            const msg = chatInput.value.trim();
            if (msg) {
                if (msg.startsWith('cmd:') || msg.startsWith('tp:')) {
                    socket.emit('chatCommand', msg);
                } else {
                    socket.emit('sendMessage', msg);
                }
            }
            chatInput.value = '';
            chatInput.blur();
        } else {
            chatInput.style.display = 'block';
            chatInput.focus();
        }
        return;
    }

    if (key === 'escape' && isChatting) {
        chatInput.value = '';
        chatInput.blur();
    }

    chatInput.onfocus = () => {
        isChatting = true;
    };

    chatInput.onblur = () => {
        isChatting = false;
        chatInput.style.display = 'none';
    };

    if (isChatting) return;

    switch (key) {
        case 'w':
        case 'arrowup':
            movement.up = true;
            break;
        case 's':
        case 'arrowdown':
            movement.down = true;
            break;
        case 'a':
        case 'arrowleft':
            movement.left = true;
            break;
        case 'd':
        case 'arrowright':
            movement.right = true;
            break;
        case 'e':
            if (me && me.role !== 'zombie') socket.emit('playerAction', { type: 'interact' });
            break;
        case 'c':
            if (me && me.role !== 'zombie') socket.emit('playerAction', { type: 'ability' });
            break;
        case 'g':
            socket.emit('playerAction', { type: 'drop_skateboard' });
            break;
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    switch (key) {
        case 'w':
        case 'arrowup':
            movement.up = false;
            break;
        case 's':
        case 'arrowdown':
            movement.down = false;
            break;
        case 'a':
        case 'arrowleft':
            movement.left = false;
            break;
        case 'd':
        case 'arrowright':
            movement.right = false;
            break;
    }
});

canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    const me = gameState.players[myId];
    if (!me) return;
    socket.emit('playerAction', { type: 'primary_action' });
});

function getPlayerAngle(player) {
    if (!player) return 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    return Math.atan2(dy, dx);
}

function drawBalloonChat(player, msg) {
    if (!player) return;
    ctx.save();
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    const x = player.x + player.width / 2;
    const y = player.y - 40;
    ctx.strokeText(msg, x, y);
    ctx.fillText(msg, x, y);
    ctx.restore();
}

function draw() {
    if (!myId || !gameState.players || !gameState.players[myId]) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '30px Arial';
        ctx.fillText('Aguardando estado do jogo...', canvas.width / 2, canvas.height / 2);
        return;
    }

    const me = gameState.players[myId];
    const cameraX = me.x - canvas.width / 2;
    const cameraY = me.y - canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    ctx.drawImage(grass, 0, 0, 3100, 2000);
    ctx.drawImage(floors, 200, 200, 2697, 1670);

    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (!player) continue;
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        ctx.drawImage(human, -player.width / 2, -player.height / 2, player.width, player.height);
        ctx.restore();

        if (player.chatMessage) drawBalloonChat(player, player.chatMessage);
    }
    ctx.restore();
}

function gameLoop() {
    if (myId && gameState.players[myId]) {
        const me = gameState.players[myId];
        const rot = getPlayerAngle(me);
        socket.emit('playerInput', { movement, mouse, rotation: rot });
    }
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
