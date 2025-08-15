// ==========================
// INFESTATION.IO - CLIENT
// ==========================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const socket = io(); // Conexão Socket.IO
let playerId = null;
let gameState = null;
let messages = []; // Para chat normal
let balloonMessages = []; // Para chat acima do player

// --- CONFIGURAÇÕES ---
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const MAX_CHAT_MESSAGES = 10;

// --- INPUT ---
const inputState = {
    movement: { up: false, down: false, left: false, right: false },
    rotation: 0
};

// --- ENVIO DE INPUT ---
function sendInput() {
    socket.emit('playerInput', inputState);
}
setInterval(sendInput, 1000 / 60);

// --- MOVIMENTO ---
document.addEventListener('keydown', (e) => {
    if (e.key === 'w') inputState.movement.up = true;
    if (e.key === 's') inputState.movement.down = true;
    if (e.key === 'a') inputState.movement.left = true;
    if (e.key === 'd') inputState.movement.right = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'w') inputState.movement.up = false;
    if (e.key === 's') inputState.movement.down = false;
    if (e.key === 'a') inputState.movement.left = false;
    if (e.key === 'd') inputState.movement.right = false;
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    inputState.rotation = Math.atan2(mouseY - CANVAS_HEIGHT / 2, mouseX - CANVAS_WIDTH / 2);
});

// --- AÇÕES DO JOGADOR ---
document.addEventListener('mousedown', (e) => {
    socket.emit('playerAction', { type: 'primary_action' });
});

document.addEventListener('keydown', (e) => {
    if (e.key === ' ') socket.emit('playerAction', { type: 'ability' });
    if (e.key === 'e') socket.emit('playerAction', { type: 'interact' });
    if (e.key === 'q') socket.emit('playerAction', { type: 'drop_skateboard' });
});

// --- ESCUTA DE ESTADO DO JOGO ---
socket.on('connect', () => {
    playerId = socket.id;
});

socket.on('gameStateUpdate', (state) => {
    gameState = state;
});

// --- CHAT ---
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && chatInput.value.trim() !== '') {
        const text = chatInput.value.trim();
        socket.emit('sendMessage', text);

        // Adiciona balão acima do player
        balloonMessages.push({ text, playerId: playerId, duration: 200 });

        chatInput.value = '';
    }
});

socket.on('newMessage', (msg) => {
    messages.push(msg);
    if (messages.length > MAX_CHAT_MESSAGES) messages.shift();
});

// --- RENDER ---
function drawPlayer(player) {
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.rotation);
    ctx.fillStyle = player.role === 'zombie' ? 'green' : 'blue';
    ctx.fillRect(-player.width/2, -player.height/2, player.width, player.height);
    ctx.restore();

    // Balão acima do player
    balloonMessages.forEach((bm) => {
        if (bm.playerId === player.id) {
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(bm.text, player.x, player.y - player.height/2 - 10);
            bm.duration--;
        }
    });
}

// --- RENDER CAIXAS E MÓVEIS ---
function drawRect(obj, color = 'gray') {
    ctx.save();
    ctx.translate(obj.x + obj.width/2, obj.y + obj.height/2);
    ctx.rotate(obj.rotation || 0);
    ctx.fillStyle = color;
    ctx.fillRect(-obj.width/2, -obj.height/2, obj.width, obj.height);
    ctx.restore();
}

// --- RENDER DO CANVAS ---
function render() {
    if (!gameState || !gameState.players) return;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const me = gameState.players[playerId];
    if (!me) return;

    // Centraliza câmera
    ctx.save();
    ctx.translate(CANVAS_WIDTH/2 - me.x, CANVAS_HEIGHT/2 - me.y);

    // Desenha casa, garagem, caixas e móveis
    gameState.box.forEach(b => drawRect(b, 'brown'));
    gameState.furniture.forEach(f => drawRect(f, 'darkgray'));

    // Skateboard
    if (gameState.skateboard) drawRect(gameState.skateboard, 'yellow');

    // Jogadores
    for (const id in gameState.players) {
        drawPlayer(gameState.players[id]);
    }

    ctx.restore();

    // Chat HUD
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i < messages.length; i++) {
        ctx.fillText(messages[i].name + ': ' + messages[i].text, 10, 20 + i * 20);
    }

    // Limpa balões expirados
    balloonMessages = balloonMessages.filter(bm => bm.duration > 0);

    requestAnimationFrame(render);
}

render();
