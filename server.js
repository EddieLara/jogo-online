// =============================================================
//                        SERVER.JS COMPLETO
// =============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// =============================================================
//                          CONFIGURAÇÃO
// =============================================================
app.use(express.static('public')); // pasta para o front-end

// =============================================================
//                          VARIÁVEIS GLOBAIS
// =============================================================
let players = {};
let objects = [];
let gameTick = 0;
let bannedPlayers = {}; // {playerName: true}
let tempBans = {}; // {playerName: timestampExpira}

// =============================================================
//                          MAPA & OBJETOS
// =============================================================
function spawnObjects() {
    objects = [];
    // Exemplo: casas, caixas, skateboards, sunshades
    for (let i = 0; i < 20; i++) {
        objects.push({
            id: `box${i}`,
            type: 'box',
            x: Math.random() * 2000,
            y: Math.random() * 1000,
            width: 50,
            height: 50
        });
    }
    for (let i = 0; i < 5; i++) {
        objects.push({
            id: `skate${i}`,
            type: 'skateboard',
            x: Math.random() * 2000,
            y: Math.random() * 1000
        });
    }
}
spawnObjects();

// =============================================================
//                      HELPER FUNCTIONS
// =============================================================
function isDev(socket) {
    return socket.dev === true;
}

function banPlayer(playerName) {
    delete players[playerName];
    bannedPlayers[playerName] = true;
}

function tempBanPlayer(playerName, durationSec) {
    delete players[playerName];
    tempBans[playerName] = Date.now() + durationSec * 1000;
}

function sendToAll(event, data) {
    io.sockets.emit(event, data);
}

function sendGameState() {
    const state = { players, objects, gameTick };
    sendToAll('gameStateUpdate', state);
}

// =============================================================
//                      SOCKET.IO EVENTS
// =============================================================
io.on('connection', socket => {
    console.log('Novo player conectado:', socket.id);

    // =========================================================
    //                    AUTENTICAÇÃO DEV
    // =========================================================
    socket.on('authDev', email => {
        if (email === 'enzosantiagosrv1245@gmail.com') {
            socket.dev = true;
            socket.emit('authSuccess', 'Dev reconhecido');
            console.log('DEV conectado:', socket.id);
        } else {
            socket.dev = false;
        }
    });

    // =========================================================
    //                      NOVO PLAYER
    // =========================================================
    socket.on('newPlayer', playerData => {
        if (bannedPlayers[playerData.name]) {
            socket.emit('banned', 'Você foi banido permanentemente.');
            return;
        }
        if (tempBans[playerData.name] && tempBans[playerData.name] > Date.now()) {
            socket.emit('banned', 'Você está temporariamente banido.');
            return;
        }

        players[playerData.name] = {
            ...playerData,
            x: Math.random() * 2000,
            y: Math.random() * 1000,
            vx: 0,
            vy: 0,
            coins: 0,
            chatBalloons: []
        };
        socket.playerName = playerData.name;
        sendGameState();
    });

    // =========================================================
    //                        MOVIMENTO
    // =========================================================
    socket.on('move', moveData => {
        const player = players[socket.playerName];
        if (!player) return;

        player.vx = moveData.vx;
        player.vy = moveData.vy;
    });

    // =========================================================
    //                        CHAT
    // =========================================================
    socket.on('chat', msg => {
        const player = players[socket.playerName];
        if (!player) return;

        // Adiciona balão sobre o player
        player.chatBalloons.push({ text: msg, timestamp: Date.now() });

        // Limita o tempo do balão
        setTimeout(() => {
            player.chatBalloons.shift();
        }, 5000);

        sendToAll('chatMessage', { name: socket.playerName, message: msg });
    });

    // =========================================================
    //                       COMANDOS DEV
    // =========================================================
    socket.on('command', cmdString => {
        if (!isDev(socket)) return;

        const args = cmdString.split(' ');
        const cmd = args[0];

        if (cmd === '/tp') {
            const targetName = args[1];
            const player = players[targetName];
            if (player) {
                player.x = 100; // exemplo de teleport
                player.y = 100;
                socket.emit('commandSuccess', `/tp executado para ${targetName}`);
            }
        } else if (cmd === '/ban') {
            const targetName = args[1];
            banPlayer(targetName);
            socket.emit('commandSuccess', `/ban executado para ${targetName}`);
        } else if (cmd === '/banTemp') {
            const targetName = args[2];
            const duration = parseInt(args[1], 10);
            tempBanPlayer(targetName, duration);
            socket.emit('commandSuccess', `/banTemp executado para ${targetName} por ${duration} segundos`);
        } else if (cmd === '/coins') {
            const coins = parseInt(args[1], 10);
            const targetName = args[2];
            const player = players[targetName];
            if (player) {
                player.coins += coins;
                socket.emit('commandSuccess', `/coins adicionado: ${coins} para ${targetName}`);
            }
        }
    });

    // =========================================================
    //                     PLAYER DESCONECTA
    // =========================================================
    socket.on('disconnect', () => {
        if (socket.playerName) {
            delete players[socket.playerName];
            sendGameState();
        }
        console.log('Player desconectado:', socket.id);
    });
});

// =============================================================
//                       LOOP DO JOGO
// =============================================================
setInterval(() => {
    gameTick++;

    // Atualiza posição de cada player
    for (let name in players) {
        const p = players[name];
        p.x += p.vx;
        p.y += p.vy;

        // Limites do mapa
        p.x = Math.max(0, Math.min(2000, p.x));
        p.y = Math.max(0, Math.min(1000, p.y));
    }

    sendGameState();
}, 50); // 20 ticks por segundo

// =============================================================
//                       INICIA SERVER
// =============================================================
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
