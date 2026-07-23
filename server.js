// ======================
// INFESTATION.IO - SERVIDOR
// ======================

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000 / 60;
const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 2000;
const INITIAL_PLAYER_SIZE = 60;
const INITIAL_PLAYER_SPEED = 2;
const ROUND_DURATION = 120;
const ABILITY_COSTS = { chameleon: 20, athlete: 10, archer: 10, engineer: 20, ant: 20, spy: 50 };

const devEmails = [
    'enzosantiagosrv1245@gmail.com',
    'eddiemullerlara7@gmail.com'
];

let bannedPlayers = {};
let bannedEmails = {};
let gameState = {};

function isDev(email) {
    return devEmails.includes(email);
}

function isBanned({ id, email }) {
    if (id && bannedPlayers[id]) {
        const ban = bannedPlayers[id];
        if (ban.permanent) return true;
        if (ban.until && Date.now() < ban.until) return true;
        if (ban.until && Date.now() >= ban.until) { delete bannedPlayers[id]; return false; }
        return false;
    }
    if (email && bannedEmails[email]) {
        const ban = bannedEmails[email];
        if (ban.permanent) return true;
        if (ban.until && Date.now() < ban.until) return true;
        if (ban.until && Date.now() >= ban.until) { delete bannedEmails[email]; return false; }
        return false;
    }
    return false;
}

function banPlayer({ id, email }, options = { permanent: true, until: null, reason: '' }) {
    if (id) bannedPlayers[id] = options;
    if (email) bannedEmails[email] = options;
}

function getPlayerByName(name) {
    for (const id in gameState.players) {
        if (gameState.players[id].name === name) return gameState.players[id];
    }
    return null;
}

function clampPosition(x, y) {
    return {
        x: Math.max(0, Math.min(WORLD_WIDTH, x)),
        y: Math.max(0, Math.min(WORLD_HEIGHT, y))
    };
}

function initializeGame() {
    gameState = {
        players: {},
        arrows: [],
        takenAbilities: [],
        abilityCosts: ABILITY_COSTS,
        gamePhase: 'waiting',
        startTime: 60,
        timeLeft: ROUND_DURATION,
        skateboard: { x: 0, y: 0, width: 90, height: 35, spawned: false, ownerId: null }
    };
}

function createNewPlayer(socket, userInfo) {
    const name = userInfo && userInfo.name ? userInfo.name : `Player${Math.floor(100 + Math.random() * 900)}`;
    gameState.players[socket.id] = {
        name,
        id: socket.id,
        x: WORLD_WIDTH / 2 + 500,
        y: WORLD_HEIGHT / 2,
        width: INITIAL_PLAYER_SIZE,
        height: INITIAL_PLAYER_SIZE * 1.25,
        speed: INITIAL_PLAYER_SPEED,
        rotation: 0,
        role: 'human',
        activeAbility: ' ',
        coins: 0,
        isCamouflaged: false,
        camouflageAvailable: true,
        isSprinting: false,
        sprintAvailable: true,
        isAnt: false,
        antAvailable: true,
        isSpying: false,
        spyUsesLeft: 2,
        spyCooldown: false,
        isHidden: false,
        arrowAmmo: 0,
        engineerAbilityUsed: false,
        isInDuct: false,
        footprintCooldown: 0,
        inventory: [],
        hasSkateboard: false,
        input: { movement: { up: false, down: false, left: false, right: false }, mouse: { x: 0, y: 0 }, rotation: 0 },
        email: userInfo && userInfo.email ? userInfo.email : (socket.handshake.auth && socket.handshake.auth.email ? socket.handshake.auth.email : null)
    };
}

io.on('connection', (socket) => {
    const userInfo = socket.handshake.auth && socket.handshake.auth.userInfo
        ? socket.handshake.auth.userInfo
        : { email: socket.handshake.auth?.email, name: null };

    if (isBanned({ id: socket.id, email: userInfo.email })) {
        socket.emit('banMessage', { reason: 'Você foi banido do servidor.', color: 'red' });
        socket.disconnect();
        return;
    }

    console.log('Novo jogador conectado:', socket.id);
    createNewPlayer(socket, userInfo);

    socket.on('playerInput', (inputData) => {
        const player = gameState.players[socket.id];
        if (player) {
            player.input.movement = inputData.movement;
            player.rotation = inputData.rotation;
        }
    });

    socket.on('chooseAbility', (ability) => {
        const player = gameState.players[socket.id];
        const cost = ABILITY_COSTS[ability];
        if (player && player.activeAbility === ' ' && cost !== undefined && player.coins >= cost) {
            if (gameState.takenAbilities.includes(ability)) return;
            player.coins -= cost;
            player.activeAbility = ability;
            gameState.takenAbilities.push(ability);
            if (ability === 'archer') player.arrowAmmo = 100;
        }
    });

    socket.on('playerAction', (actionData) => {
        const player = gameState.players[socket.id];
        if (!player) return;
    });

    socket.on('sendMessage', (text) => {
        const player = gameState.players[socket.id];
        if (!player || !text || text.trim().length === 0) return;
        const message = { name: player.name, text: text.substring(0, 150) };
        io.emit('newMessage', message);
    });

    socket.on('chatCommand', (text) => {
        const player = gameState.players[socket.id];
        if (!player || !text || text.trim().length === 0) return;

        const trimmed = text.trim();
        if (trimmed === 'cmd:on') {
            socket.emit('commandVisibility', true);
            socket.emit('commandResponse', 'Painel de comandos ativado.');
            return;
        }

        if (trimmed === 'cmd:off') {
            socket.emit('commandVisibility', false);
            socket.emit('commandResponse', 'Painel de comandos oculto.');
            return;
        }

        if (!isDev(player.email)) {
            socket.emit('commandResponse', 'Acesso negado para comandos de teleporte.');
            return;
        }

        const parts = trimmed.split(':');
        if (parts[0] !== 'tp' || parts.length < 3) {
            socket.emit('commandResponse', 'Formato inválido. Use tp:playerName:me, tp:all:me ou tp:all:x,y.');
            return;
        }

        const target = parts[1];
        const destination = parts[2];

        if (target === 'all') {
            if (destination === 'me') {
                const destinationPos = clampPosition(player.x, player.y);
                for (const id in gameState.players) {
                    const targetPlayer = gameState.players[id];
                    if (targetPlayer) {
                        targetPlayer.x = destinationPos.x;
                        targetPlayer.y = destinationPos.y;
                    }
                }
                socket.emit('commandResponse', `Todos os jogadores foram teleportados para ${destinationPos.x.toFixed(0)}, ${destinationPos.y.toFixed(0)}.`);
                return;
            }

            const [xStr, yStr] = destination.split(',').map((value) => parseInt(value.trim(), 10));
            if (Number.isNaN(xStr) || Number.isNaN(yStr)) {
                socket.emit('commandResponse', 'Coordenadas inválidas. Use tp:all:x,y.');
                return;
            }
            const destinationPos = clampPosition(xStr, yStr);
            for (const id in gameState.players) {
                const targetPlayer = gameState.players[id];
                if (targetPlayer) {
                    targetPlayer.x = destinationPos.x;
                    targetPlayer.y = destinationPos.y;
                }
            }
            socket.emit('commandResponse', `Todos os jogadores foram teleportados para ${destinationPos.x.toFixed(0)}, ${destinationPos.y.toFixed(0)}.`);
            return;
        }

        if (destination !== 'me') {
            socket.emit('commandResponse', 'Use tp:playerName:me para teletransportar um jogador.');
            return;
        }

        const targetPlayer = getPlayerByName(target);
        if (!targetPlayer) {
            socket.emit('commandResponse', `Jogador ${target} não encontrado.`);
            return;
        }

        targetPlayer.x = player.x;
        targetPlayer.y = player.y;
        socket.emit('commandResponse', `${targetPlayer.name} foi teleportado para você.`);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            if (player.activeAbility !== ' ') {
                gameState.takenAbilities = gameState.takenAbilities.filter((ability) => ability !== player.activeAbility);
            }
            if (player.hasSkateboard) {
                gameState.skateboard.spawned = false;
            }
        }
        delete gameState.players[socket.id];
    });
});

setInterval(() => {
    if (!gameState || !gameState.players) return;
    io.emit('gameStateUpdate', gameState);
}, TICK_RATE);

server.listen(PORT, () => {
    initializeGame();
    console.log(`🚀 Game server running at http://localhost:${PORT}`);
    console.log(`🗺️ Mapa ativo: ${WORLD_WIDTH}x${WORLD_HEIGHT}`);
});
