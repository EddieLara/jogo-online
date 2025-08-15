// =============================================================
//                         GAME.JS COMPLETO
// =============================================================

const socket = io();

// =============================================================
//                       CONFIGURAÇÃO DO CANVAS
// =============================================================
const canvas = document.getElementById('gameCanvas');
canvas.width = 2300;
canvas.height = 1090;
const ctx = canvas.getContext('2d');

// =============================================================
//                       VARIÁVEIS GLOBAIS
// =============================================================
let playerName = '';
let players = {};
let objects = [];
let devMode = false;

// =============================================================
//                    AUTENTICAÇÃO DEV
// =============================================================
function authenticateDev(email) {
    socket.emit('authDev', email);
}

socket.on('authSuccess', msg => {
    devMode = true;
    console.log(msg);
});

// =============================================================
//                      NOVO PLAYER
// =============================================================
function joinGame(name) {
    playerName = name;
    socket.emit('newPlayer', { name });
}

// =============================================================
//                          MOVIMENTO
// =============================================================
const keys = {};
document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

function handleMovement() {
    let vx = 0, vy = 0;
    if (keys['ArrowUp'] || keys['w']) vy -= 5;
    if (keys['ArrowDown'] || keys['s']) vy += 5;
    if (keys['ArrowLeft'] || keys['a']) vx -= 5;
    if (keys['ArrowRight'] || keys['d']) vx += 5;

    socket.emit('move', { vx, vy });
}

// =============================================================
//                          CHAT
// =============================================================
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        const msg = chatInput.value;
        if (!msg) return;

        if (devMode && msg.startsWith('/')) {
            socket.emit('command', msg);
        } else {
            socket.emit('chat', msg);
        }

        chatInput.value = '';
    }
});

socket.on('chatMessage', data => {
    // Mensagem normal no chat
    const chatBox = document.getElementById('chatBox');
    chatBox.innerHTML += `<div>${data.name}: ${data.message}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;
});

// =============================================================
//                     RECEBER ESTADO DO JOGO
// =============================================================
socket.on('gameStateUpdate', state => {
    players = state.players;
    objects = state.objects;
});

// =============================================================
//                     EXECUTAR COMANDO DEV
// =============================================================
socket.on('commandSuccess', msg => {
    console.log('Comando executado:', msg);
});

socket.on('banned', msg => {
    alert(msg);
});

// =============================================================
//                     RENDERIZAÇÃO
// =============================================================
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Objetos
    for (let obj of objects) {
        if (obj.type === 'box') {
            ctx.fillStyle = 'brown';
            ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
        if (obj.type === 'skateboard') {
            ctx.fillStyle = 'gray';
            ctx.fillRect(obj.x, obj.y, 40, 10);
        }
    }

    // Players
    for (let name in players) {
        const p = players[name];
        ctx.fillStyle = name === playerName ? 'blue' : 'red';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Balões de chat
        for (let i = 0; i < p.chatBalloons.length; i++) {
            const b = p.chatBalloons[i];
            ctx.fillStyle = 'white';
            ctx.fillRect(p.x - 50, p.y - 60 - i * 25, 100, 20);
            ctx.fillStyle = 'black';
            ctx.fillText(b.text, p.x - 45, p.y - 45 - i * 25);
        }

        // Nome
        ctx.fillStyle = 'white';
        ctx.fillText(name, p.x - 20, p.y - 30);
    }

    requestAnimationFrame(draw);
}

// =============================================================
//                     LOOP PRINCIPAL
// =============================================================
function gameLoop() {
    handleMovement();
    requestAnimationFrame(gameLoop);
}

// =============================================================
//                     INICIA JOGO
// =============================================================
draw();
gameLoop();

// =============================================================
//                     AUTENTICAÇÃO DEV EXEMPLO
// =============================================================
// authenticateDev('enzosantiagosrv1245@gmail.com');
// joinGame('Enzo'); // substituir pelo nome do player
