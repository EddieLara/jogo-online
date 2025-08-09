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
app.use(express.static(__dirname)); // serve index.html, game.js, Sprites, etc

// ======= CONFIGURAÇÕES DO JOGO =========
const PORT = process.env.PORT || 3000;
const TICK_RATE = 1000 / 60;
const WORLD_WIDTH = 6000;
const WORLD_HEIGHT = 2000;
const INITIAL_PLAYER_SIZE = 60;
const INITIAL_PLAYER_SPEED = 2;
const MAX_PLAYER_SPEED = 5;
const SPEED_PER_PIXEL_OF_GROWTH = 0.05;
const GROWTH_AMOUNT = 0.2;
const ZOMBIE_DECAY_AMOUNT = 0.25;
const DUCT_TRAVEL_TIME = 1000 / 20;
const CAMOUFLAGE_COOLDOWN = 45000;
const SPRINT_COOLDOWN = 45000;
const SPRINT_DURATION = 10000;
const ANT_TRANSFORMATION_DURATION = 20000;
const ANT_COOLDOWN = 45000;
const ANT_SIZE_FACTOR = 0.1;
const ANT_SPEED_FACTOR = 0.7;
const ARROW_SPEED = 20;
const ARROW_KNOCKBACK = 30;
const ARROW_LIFESPAN_AFTER_HIT = 1000;
const BOX_FRICTION = 0.94;
const BOX_PUSH_FORCE = 0.15;
const BOX_COLLISION_DAMPING = 0.80;
const ANGULAR_FRICTION = 0.80;
const TORQUE_FACTOR = 0.000008;
const ZOMBIE_SPEED_BOOST = 1.15;
const SPY_DURATION = 20000;
const SPY_COOLDOWN = 45000;
const ROUND_DURATION = 120;
const SKATEBOARD_SPEED_BOOST = 7;
const SKATEBOARD_WIDTH = 90;
const SKATEBOARD_HEIGHT = 35;
const ABILITY_COSTS = {
    chameleon: 20,
    athlete: 10,
    archer: 10,
    engineer: 20,
    ant: 20,
    spy: 50
};

// ===== BANIMENTO & DEV =====
const devEmails = [
    "enzosantiagosrv1245@gmail.com",
    "eddiemullerlara7@gmail.com"
];
let bannedPlayers = {}; // { id: { permanent: true, until: null, reason: "" }, ... }
let bannedEmails = {};  // { email: { permanent: true, until: null, reason: "" }, ... }

function isDev(email) {
    return devEmails.includes(email);
}
function isBanned({ id, email }) {
    if (id && bannedPlayers[id]) {
        const ban = bannedPlayers[id];
        if (ban.permanent) return true;
        if (ban.until && Date.now() < ban.until) return true;
        if (ban.until && Date.now() >= ban.until) {
            delete bannedPlayers[id];
            return false;
        }
        return false;
    }
    if (email && bannedEmails[email]) {
        const ban = bannedEmails[email];
        if (ban.permanent) return true;
        if (ban.until && Date.now() < ban.until) return true;
        if (ban.until && Date.now() >= ban.until) {
            delete bannedEmails[email];
            return false;
        }
        return false;
    }
    return false;
}
function banPlayer({ id, email }, options = { permanent: true, until: null, reason: "" }) {
    if (id) bannedPlayers[id] = options;
    if (email) bannedEmails[email] = options;
}

function parseCommand(text) {
    // comandos de staff: /tp player, /ban player, /ban temp player 9 days
    const tpRegex = /^\/tp\s+("?)([a-zA-Z0-9_-]+)"?/i;
    const banRegex = /^\/ban\s+("?)([a-zA-Z0-9_-]+)"?/i;
    const banTempRegex = /^\/ban\s+temp\s+("?)([a-zA-Z0-9_-]+)"?\s+(\d+)\s*(seconds?|minutes?|hours?|days?|weeks?|months?|years?)/i;
    let match;
    if ((match = text.match(tpRegex))) {
        return { cmd: 'tp', playerName: match[2] };
    }
    if ((match = text.match(banRegex))) {
        return { cmd: 'ban', playerName: match[2] };
    }
    if ((match = text.match(banTempRegex))) {
        return {
            cmd: 'ban_temp',
            playerName: match[2],
            amount: parseInt(match[3]),
            unit: match[4]
        };
    }
    return null;
}
function getPlayerByName(name) {
    for (const id in gameState.players) {
        if (gameState.players[id].name === name) {
            return gameState.players[id];
        }
    }
    return null;
}

// ===== ESTADO DO JOGO =====
let gameState = {};
let nextArrowId = 0;

function spawnSkateboard() {
    if (!gameState.skateboard) return;
    const streetArea = { x: 3090, y: 0, width: 1000, height: 2000 };
    gameState.skateboard.x = streetArea.x + Math.random() * (streetArea.width - SKATEBOARD_WIDTH);
    gameState.skateboard.y = streetArea.y + Math.random() * (streetArea.height - SKATEBOARD_HEIGHT);
    gameState.skateboard.spawned = true;
    gameState.skateboard.ownerId = null;
    console.log(`Skateboard spawned at ${gameState.skateboard.x.toFixed(0)}, ${gameState.skateboard.y.toFixed(0)}`);
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
        skateboard: {
            x: 0,
            y: 0,
            width: SKATEBOARD_WIDTH,
            height: SKATEBOARD_HEIGHT,
            spawned: false,
            ownerId: null
        },
        box: [
            // Caixas Originais
            { x: 1000, y: 1500, width: 128, height: 128, vx: 0, vy: 0, rotation: 100, angularVelocity: 0 },
            { x: 2720, y: 1670, width: 128, height: 128, vx: 0, vy: 0, rotation: 200, angularVelocity: 0 },
            { x: 1050, y: 600, width: 128, height: 128, vx: 0, vy: 0, rotation: 120, angularVelocity: 0 },
            { x: 2850, y: 1150, width: 192, height: 192, vx: 0, vy: 0, rotation: 300, angularVelocity: 0 },
            { x: 1600, y: 1350, width: 192, height: 192, vx: 0, vy: 0, rotation: 170, angularVelocity: 0 },
            { x: 2450, y: 300, width: 90, height: 90, vx: 0, vy: 0, rotation: 150, angularVelocity: 0 },
            { x: 2560, y: 320, width: 120, height: 120, vx: 0, vy: 0, rotation: 300, angularVelocity: 0 },
            { x: 2680, y: 290, width: 90, height: 90, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { x: 1400, y: 800, width: 56, height: 56, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { x: 1456, y: 800, width: 100, height: 100, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { x: 1556, y: 800, width: 80, height: 80, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            // --- Novas Caixas Adicionadas ---
            { x: 800, y: 300, width: 90, height: 90, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { x: 1700, y: 700, width: 128, height: 128, vx: 0, vy: 0, rotation: 45, angularVelocity: 0 },
            { x: 2300, y: 900, width: 80, height: 80, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { x: 450, y: 950, width: 100, height: 100, vx: 0, vy: 0, rotation: 15, angularVelocity: 0 }
        ],
        furniture: [
            // Móveis Originais
            { id: 'small_bed', x: 300, y: 400, width: 108, height: 200, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'small_bed', x: 1850, y: 400, width: 108, height: 200, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'small_table', x: 2500, y: 600, width: 288, height: 132, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'big_table', x: 500, y: 1400, width: 480, height: 240, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'car', x: 3150, y: 150, width: 502, height: 302, vx: 0, vy: 0, rotation: 180, angularVelocity: 0 },
            // --- Novos Móveis Adicionados ---
            { id: 'small_bed', x: 1000, y: 400, width: 108, height: 200, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'small_table', x: 2100, y: 1400, width: 288, height: 132, vx: 0, vy: 0, rotation: 90, angularVelocity: 0 },
            { id: 'small_table', x: 850, y: 900, width: 288, height: 132, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 }
        ],
        chest: { x: 2890, y: 825, width: 200, height: 240 },
        ducts: [
            { x: 3150, y: 480, width: 80, height: 80 }, { x: 270, y: 1670, width: 80, height: 80 },
            { x: 2450, y: 300, width: 80, height: 80 }, { x: 3940, y: 1440, width: 80, height: 80 },
            { x: 2070, y: 1650, width: 80, height: 80 }
        ],
        sunshades: [
            { x: 4200, y: 1000, width: 320, height: 340 }, { x: 4350, y: 600, width: 320, height: 340 },
            { x: 4440, y: 1400, width: 320, height: 340 }
        ],
        house: { x: 200, y: 200, width: 2690, height: 900, wallThickness: 70, walls: [] },
        garage: { x: 800, y: 1200, width: 700, height: 600, wallThickness: 70, walls: [] },
    };
    buildWalls(gameState.house);
    buildWalls(gameState.garage);
}

function buildWalls(structure) {
    const s = structure;
    const wt = s.wallThickness;
    s.walls = [];
    if (s === gameState.house) {
        s.walls.push({ x: s.x, y: s.y, width: s.width, height: wt });
        s.walls.push({ x: s.x, y: s.y + s.height - wt, width: 750, height: wt });
        s.walls.push({ x: s.x + 1000, y: s.y + s.height - wt, width: s.width - 1820, height: wt });
        s.walls.push({ x: s.x + 2000, y: s.y + s.height - wt, width: s.width - 2000, height: wt });
        s.walls.push({ x: s.x, y: s.y, width: wt, height: 600 });
        s.walls.push({ x: s.x + s.width - wt, y: s.y, width: wt, height: s.height - 600 });
        s.walls.push({ x: s.x + s.width - wt, y: 800, width: wt, height: s.height - 600 });
        s.walls.push({ x: s.x, y: s.y + 830, width: wt, height: 790 });
        s.walls.push({ x: 1240, y: s.y + 830, width: wt, height: s.height - 110 });
        s.walls.push({ x: s.x, y: s.y + 1550, width: 1110, height: wt });
        s.walls.push({ x: s.x + 700, y: s.y, width: wt, height: 600 });
        s.walls.push({ x: s.x, y: s.y + 600 - wt, width: 500 + wt, height: wt });
        s.walls.push({ x: s.x + 900, y: s.y + 600 - wt, width: 600, height: wt });
        s.walls.push({ x: s.x + 1500, y: s.y + 530, width: 500, height: wt });
        s.walls.push({ x: s.x + 1500, y: s.y, width: wt, height: 350 + 250 });
        s.walls.push({ x: s.x + 2150, y: s.y, width: wt, height: s.height - 300 });
    } else if (s === gameState.garage) {
        s.walls.push({ x: s.x + 1400, y: s.y, width: s.width - 200, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y + s.height - wt, width: s.width, height: wt });
        s.walls.push({ x: s.x + 1200, y: s.y, width: wt, height: s.height });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y, width: wt, height: s.height - 460 });
        s.walls.push({ x: s.x + s.width - wt + 1200, y: s.y + 460, width: wt, height: 140 });
    }
}

function createNewPlayer(socket, userInfo) {
    let name = userInfo && userInfo.name ? userInfo.name : `Player${Math.floor(100 + Math.random() * 900)}`;
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
        input: {
            movement: { up: false, down: false, left: false, right: false },
            mouse: { x: 0, y: 0 },
            rotation: 0
        },
        email: userInfo && userInfo.email ? userInfo.email : (socket.handshake.auth && socket.handshake.auth.email ? socket.handshake.auth.email : null)
    };
}

function getVertices(rect) {
    const vertices = [];
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    const angle = rect.rotation || 0;
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const halfWidth = rect.width / 2;
    const halfHeight = rect.height / 2;
    const points = [
        { x: -halfWidth, y: -halfHeight }, { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight }, { x: -halfWidth, y: halfHeight }
    ];
    for (const p of points) {
        vertices.push({
            x: cx + p.x * cos - p.y * sin,
            y: cy + p.x * sin + p.y * cos
        });
    }
    return vertices;
}
function getAxes(vertices) {
    const axes = [];
    for (let i = 0; i < vertices.length; i++) {
        const p1 = vertices[i];
        const p2 = i + 1 == vertices.length ? vertices[0] : vertices[i + 1];
        const edge = { x: p1.x - p2.x, y: p1.y - p2.y };
        const normal = { x: -edge.y, y: edge.x };
        const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
        axes.push({ x: normal.x / length, y: normal.y / length });
    }
    return [axes[0], axes[1]];
}
function project(vertices, axis) {
    let min = Infinity;
    let max = -Infinity;
    for (const v of vertices) {
        const dotProduct = v.x * axis.x + v.y * axis.y;
        min = Math.min(min, dotProduct);
        max = Math.max(max, dotProduct);
    }
    return { min, max };
}
function checkCollisionSAT(poly1, poly2) {
    const vertices1 = getVertices(poly1);
    const vertices2 = getVertices(poly2);
    const axes = [...getAxes(vertices1), ...getAxes(vertices2)];
    let minOverlap = Infinity;
    let smallestAxis = null;
    for (const axis of axes) {
        const proj1 = project(vertices1, axis);
        const proj2 = project(vertices2, axis);
        const overlap = Math.min(proj1.max, proj2.max) - Math.max(proj1.min, proj2.min);
        if (overlap <= 0) {
            return null;
        }
        if (overlap < minOverlap) {
            minOverlap = overlap;
            smallestAxis = axis;
        }
    }
    const mtv = { x: smallestAxis.x * minOverlap, y: smallestAxis.y * minOverlap };
    const centerVector = {
        x: (poly2.x + poly2.width / 2) - (poly1.x + poly1.width / 2),
        y: (poly2.y + poly2.height / 2) - (poly1.y + poly1.height / 2)
    };
    if ((centerVector.x * mtv.x + centerVector.y * mtv.y) < 0) {
        mtv.x *= -1;
        mtv.y *= -1;
    }
    return mtv;
}

// Você pode colocar aqui a função isColliding, se ela existir em outro arquivo

// ================= SOCKET.IO ===================
io.on('connection', (socket) => {
    // Usuário pode passar email/nome via socket.handshake.auth
    const userInfo = socket.handshake.auth && socket.handshake.auth.userInfo
        ? socket.handshake.auth.userInfo
        : { email: socket.handshake.auth && socket.handshake.auth.email, name: null };

    // Ban check
    if (isBanned({ id: socket.id, email: userInfo.email })) {
        socket.emit('banMessage', { reason: "Você foi banido do servidor.", color: "red" });
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

        if (actionData.type === 'primary_action') {
            if (player.activeAbility === 'archer' && player.arrowAmmo > 0) {
                player.arrowAmmo--;
                gameState.arrows.push({
                    id: nextArrowId++,
                    x: player.x + player.width / 2,
                    y: player.y + player.height / 2,
                    width: 10, height: 10, color: 'red',
                    angle: player.rotation,
                    ownerId: player.id,
                    hasHit: false
                });
            }
        }

        if (actionData.type === 'ability') {
            if (player.activeAbility === 'chameleon' && player.camouflageAvailable) {
                player.isCamouflaged = true;
                player.camouflageAvailable = false;
                setTimeout(() => {
                    if (gameState.players[socket.id]) player.camouflageAvailable = true;
                }, CAMOUFLAGE_COOLDOWN);
            }
            if (player.activeAbility === 'athlete' && player.sprintAvailable) {
                player.isSprinting = true;
                player.sprintAvailable = false;
                const originalSpeed = player.speed;
                player.speed *= 2;
                setTimeout(() => {
                    if (gameState.players[socket.id]) {
                        player.isSprinting = false;
                        player.speed = originalSpeed;
                    }
                }, SPRINT_DURATION);
                setTimeout(() => {
                    if (gameState.players[socket.id]) player.sprintAvailable = true;
                }, SPRINT_COOLDOWN);
            }
            if (player.activeAbility === 'ant' && player.antAvailable) {
                player.antAvailable = false;
                player.isAnt = true;
                const originalWidth = player.width;
                const originalHeight = player.height;
                const originalSpeed = player.speed;
                player.width *= ANT_SIZE_FACTOR;
                player.height *= ANT_SIZE_FACTOR;
                player.speed *= ANT_SPEED_FACTOR;
                setTimeout(() => {
                    if (gameState.players[socket.id]) {
                        player.isAnt = false;
                        player.width = originalWidth;
                        player.height = originalHeight;
                        player.speed = originalSpeed;
                    }
                }, ANT_TRANSFORMATION_DURATION);
                setTimeout(() => {
                    if (gameState.players[socket.id]) player.antAvailable = true;
                }, ANT_COOLDOWN);
            }
            if (player.activeAbility === 'spy' && player.spyUsesLeft > 0 && !player.spyCooldown && !player.isSpying) {
                player.isSpying = true;
                player.spyUsesLeft--;
                player.spyCooldown = true;
                setTimeout(() => {
                    if (gameState.players[socket.id]) {
                        player.isSpying = false;
                    }
                }, SPY_DURATION);
                setTimeout(() => {
                    if (gameState.players[socket.id]) {
                        player.spyCooldown = false;
                    }
                }, SPY_COOLDOWN);
            }
            if (player.activeAbility === 'engineer' && !player.engineerAbilityUsed && !player.isInDuct) {
                for (let i = 0; i < gameState.ducts.length; i++) {
                    if (isColliding(player.hitbox, gameState.ducts[i])) {
                        player.isInDuct = true;
                        player.engineerAbilityUsed = true;
                        const exitDuct = gameState.ducts[(i + 1) % gameState.ducts.length];
                        setTimeout(() => {
                            if (gameState.players[socket.id]) {
                                player.x = exitDuct.x + exitDuct.width / 2 - player.width / 2;
                                player.y = exitDuct.y + exitDuct.height / 2 - player.height / 2;
                                player.isInDuct = false;
                            }
                        }, DUCT_TRAVEL_TIME);
                        break;
                    }
                }
            }
        }

        if (actionData.type === 'drop_skateboard') {
            if (player.hasSkateboard) {
                player.hasSkateboard = false;
                const skate = gameState.skateboard;
                skate.spawned = true;
                skate.ownerId = null;
                skate.x = player.x;
                skate.y = player.y;
            }
        }

        if (actionData.type === 'interact') {
            if (!player.hasSkateboard && gameState.skateboard && gameState.skateboard.spawned && !gameState.skateboard.ownerId) {
                const skate = gameState.skateboard;
                const dx = (player.x + player.width / 2) - (skate.x + skate.width / 2);
                const dy = (player.y + player.height / 2) - (skate.y + skate.height / 2);
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 100) {
                    player.hasSkateboard = true;
                    skate.ownerId = player.id;
                    skate.spawned = false;
                    return;
                }
            }
            if (player.activeAbility === 'engineer' && !player.engineerAbilityUsed && !player.isInDuct) {
                for (let i = 0; i < gameState.ducts.length; i++) {
                    if (isColliding(player.hitbox, gameState.ducts[i])) {
                        player.isInDuct = true;
                        player.engineerAbilityUsed = true;
                        const exitDuct = gameState.ducts[(i + 1) % gameState.ducts.length];
                        setTimeout(() => {
                            if (gameState.players[socket.id]) {
                                player.x = exitDuct.x + exitDuct.width / 2 - player.width / 2;
                                player.y = exitDuct.y + exitDuct.height / 2 - player.height / 2;
                                player.isInDuct = false;
                            }
                        }, DUCT_TRAVEL_TIME);
                        break;
                    }
                }
            }
        }
    });

    socket.on('sendMessage', (text) => {
        const player = gameState.players[socket.id];
        if (!player || !text || text.trim().length === 0) return;
        // comandos dev
        const email = player.email;
        const isDevUser = isDev(email);
        const command = parseCommand(text.trim());
        if (isDevUser && command) {
            if (command.cmd === 'tp') {
                const target = getPlayerByName(command.playerName);
                if (target) {
                    player.x = target.x;
                    player.y = target.y;
                    io.emit('newMessage', { name: 'Servidor', text: `${player.name} teleportou para ${target.name}!` });
                } else {
                    socket.emit('newMessage', { name: 'Servidor', text: `Jogador ${command.playerName} não encontrado.` });
                }
            }
            else if (command.cmd === 'ban') {
                const toBan = getPlayerByName(command.playerName);
                if (toBan) {
                    banPlayer({ id: toBan.id, email: toBan.email }, { permanent: true, reason: "Banido por admin!" });
                    io.to(toBan.id).emit('banMessage', { reason: "Você foi banido do servidor.", color: "red" });
                    io.emit('newMessage', { name: 'Servidor', text: `${toBan.name} foi banido permanentemente!` });
                    io.sockets.sockets.get(toBan.id)?.disconnect();
                } else {
                    socket.emit('newMessage', { name: 'Servidor', text: `Jogador ${command.playerName} não encontrado.` });
                }
            }
            else if (command.cmd === 'ban_temp') {
                const toBan = getPlayerByName(command.playerName);
                if (toBan) {
                    // tempo em ms
                    let timeMs = 0;
                    switch (command.unit.toLowerCase()) {
                        case 'second':
                        case 'seconds': timeMs = command.amount * 1000; break;
                        case 'minute':
                        case 'minutes': timeMs = command.amount * 60 * 1000; break;
                        case 'hour':
                        case 'hours': timeMs = command.amount * 60 * 60 * 1000; break;
                        case 'day':
                        case 'days': timeMs = command.amount * 24 * 60 * 60 * 1000; break;
                        case 'week':
                        case 'weeks': timeMs = command.amount * 7 * 24 * 60 * 60 * 1000; break;
                        case 'month':
                        case 'months': timeMs = command.amount * 30 * 24 * 60 * 60 * 1000; break;
                        case 'year':
                        case 'years': timeMs = command.amount * 365 * 24 * 60 * 60 * 1000; break;
                        default: timeMs = command.amount * 1000;
                    }
                    banPlayer({ id: toBan.id, email: toBan.email }, { permanent: false, until: Date.now() + timeMs, reason: `Banido por admin por ${command.amount} ${command.unit}` });
                    io.to(toBan.id).emit('banMessage', { reason: `Você foi banido temporariamente (${command.amount} ${command.unit})!`, color: "red" });
                    io.emit('newMessage', { name: 'Servidor', text: `${toBan.name} foi banido temporariamente por ${command.amount} ${command.unit}!` });
                    io.sockets.sockets.get(toBan.id)?.disconnect();
                } else {
                    socket.emit('newMessage', { name: 'Servidor', text: `Jogador ${command.playerName} não encontrado.` });
                }
            }
            return;
        }
        // normal chat
        const message = {
            name: player.name,
            text: text.substring(0, 150)
        };
        io.emit('newMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            if (player.activeAbility !== ' ') {
                gameState.takenAbilities = gameState.takenAbilities.filter(ability => ability !== player.activeAbility);
            }
            if (player.hasSkateboard) spawnSkateboard();
        }
        delete gameState.players[socket.id];
    });
});

// ================== GAME LOOP ====================
setInterval(() => {
    if (!gameState || !gameState.players) {
        return;
    }
    // updateGameState(); // Sua função de lógica, não mostrada aqui para foco no login/ranking.
    io.emit('gameStateUpdate', gameState);
}, TICK_RATE);

setInterval(() => {
    if (!gameState || !gameState.players || Object.keys(gameState.players).length === 0) {
        return;
    }

    if (gameState.gamePhase === 'waiting') {
        gameState.startTime--;
        if (gameState.startTime <= 0) {
            gameState.gamePhase = 'running';
            gameState.timeLeft = ROUND_DURATION;

            const playerIds = Object.keys(gameState.players);
            if (playerIds.length > 0) {
                const randomIndex = Math.floor(Math.random() * playerIds.length);
                const zombieId = playerIds[randomIndex];
                const zombiePlayer = gameState.players[zombieId];
                if (zombiePlayer) {

                    if (zombiePlayer.hasSkateboard) {
                        zombiePlayer.hasSkateboard = false;
                        gameState.skateboard.spawned = true;
                        gameState.skateboard.ownerId = null;
                        gameState.skateboard.x = zombiePlayer.x;
                        gameState.skateboard.y = zombiePlayer.y + zombiePlayer.height;
                    }

                    zombiePlayer.role = 'zombie';
                    zombiePlayer.speed *= ZOMBIE_SPEED_BOOST;
                    console.log(`The round has started! ${zombiePlayer.name} is the initial Zombie!`);
                    io.emit('newMessage', { name: 'Server', text: `The infection has begun! ${zombiePlayer.name} is the zombie!` });
                }
            }
        }
    }

    else if (gameState.gamePhase === 'running') {
        gameState.timeLeft--;

        for (const id in gameState.players) {
            const player = gameState.players[id];
            player.coins += 1;

            if (player.role === 'zombie') {
                if (!player.isAnt && player.width > INITIAL_PLAYER_SIZE) {
                    player.width -= ZOMBIE_DECAY_AMOUNT;
                    player.height -= ZOMBIE_DECAY_AMOUNT;
                }
            } else {
                if (!player.isAnt) {
                    player.width += GROWTH_AMOUNT;
                    player.height += GROWTH_AMOUNT;
                }
            }

            if (!player.isSprinting && !player.isAnt) {
                const sizeDifference = player.width - INITIAL_PLAYER_SIZE;
                let newSpeed = INITIAL_PLAYER_SPEED + (sizeDifference * SPEED_PER_PIXEL_OF_GROWTH);

                if (player.role === 'zombie') {
                    player.speed = Math.max(1.5, newSpeed);
                } else {
                    player.speed = Math.min(newSpeed, MAX_PLAYER_SPEED);
                }
            }
        }

        if (gameState.timeLeft <= 0) {
            console.log("Time's up! Humans won the round.");
            io.emit('newMessage', { name: 'Server', text: "Time's up! The Humans survived!" });

            const skateWasOnGround = gameState.skateboard.spawned;
            let skateOwnerId = null;
            for (const id in gameState.players) {
                if (gameState.players[id].hasSkateboard) {
                    skateOwnerId = id;
                    break;
                }
            }

            const currentPlayers = gameState.players;
            initializeGame();
            gameState.players = currentPlayers;

            if (skateWasOnGround || !skateOwnerId) {
                spawnSkateboard();
            } else {
                gameState.skateboard.ownerId = skateOwnerId;
                gameState.skateboard.spawned = false;
            }

            for (const id in gameState.players) {
                const player = gameState.players[id];
                player.x = WORLD_WIDTH / 2 + 500;
                player.y = WORLD_HEIGHT / 2;
                player.role = 'human';
                player.activeAbility = ' ';
                player.isCamouflaged = false;
                player.camouflageAvailable = true;
                player.isSprinting = false;
                player.sprintAvailable = true;
                player.isAnt = false;
                player.antAvailable = true;
                player.isSpying = false;
                player.spyUsesLeft = 2;
                player.spyCooldown = false;
                player.isHidden = false;
                player.arrowAmmo = 0;
                player.engineerAbilityUsed = false;
                player.isInDuct = false;

                if (id !== skateOwnerId) {
                    player.hasSkateboard = false;
                }
            }
        }
    }
}, 1000);

server.listen(PORT, () => {
    initializeGame();
    spawnSkateboard();
    console.log(`🚀 Game server running at http://localhost:${PORT}`);
});