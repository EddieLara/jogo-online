const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
app.use(express.static(__dirname));

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
const BOX_FRICTION = 0.90;
const BOX_PUSH_FORCE = 0.10;
const BOX_COLLISION_DAMPING = 0.90;
const ANGULAR_FRICTION = 0.95;
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
let gameState = {};

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
            { x: 1556, y: 800, width: 80, height: 80, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 }
        ],
        furniture: [
            { id: 'small_bed', x: 300, y: 400, width: 108, height: 200, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'small_bed', x: 1850, y: 400, width: 108, height: 200, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'small_table', x: 2500, y: 600, width: 288, height: 132, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'big_table', x: 500, y: 1400, width: 480, height: 240, vx: 0, vy: 0, rotation: 0, angularVelocity: 0 },
            { id: 'car', x: 3150, y: 150, width: 502, height: 302, vx: 0, vy: 0, rotation: 180, angularVelocity: 0 }
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
function isColliding(rect1, rect2) {
    if (!rect1 || !rect2) {
        return false;
    }
    return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
}
function createNewPlayer(socket) {
    gameState.players[socket.id] = {
        name: `Player${Math.floor(100 + Math.random() * 900)}`,
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
        }
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
        const p2 = vertices[i + 1 == vertices.length ? 0 : i + 1];
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

function updateGameState() {
    const allCollidables = [...gameState.box, ...gameState.furniture];
    for (let i = 0; i < allCollidables.length; i++) {
        const item1 = allCollidables[i];
        for (let j = i + 1; j < allCollidables.length; j++) {
            const item2 = allCollidables[j];
            const mtv = checkCollisionSAT(item1, item2);
            if (mtv) {
                item1.x -= mtv.x / 2;
                item1.y -= mtv.y / 2;
                item2.x += mtv.x / 2;
                item2.y += mtv.y / 2;
                const tempVx = item1.vx;
                const tempVy = item1.vy;
                item1.vx = item2.vx * BOX_COLLISION_DAMPING;
                item1.vy = item2.vy * BOX_COLLISION_DAMPING;
                item2.vx = tempVx * BOX_COLLISION_DAMPING;
                item2.vy = tempVy * BOX_COLLISION_DAMPING;
                const impactForce = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y);
                const torque1 = (mtv.y * impactForce - mtv.x * impactForce) * TORQUE_FACTOR * 0.1;
                const torque2 = -(mtv.y * impactForce - mtv.x * impactForce) * TORQUE_FACTOR * 0.1;
                item1.angularVelocity += torque1;
                item2.angularVelocity += torque2;
            }
        }
        item1.x += item1.vx;
        item1.y += item1.vy;
        item1.rotation += item1.angularVelocity;
        item1.vx *= BOX_FRICTION;
        item1.vy *= BOX_FRICTION;
        item1.angularVelocity *= ANGULAR_FRICTION;
        const obstacles = [...gameState.house.walls, ...gameState.garage.walls, gameState.chest];
        for (const obstacle of obstacles) {
            const mtv = checkCollisionSAT(item1, obstacle);
            if (mtv) {
                item1.x -= mtv.x;
                item1.y -= mtv.y;
                const dot = item1.vx * mtv.x + item1.vy * mtv.y;
                const lenSq = mtv.x * mtv.x + mtv.y * mtv.y;
                if (lenSq > 0) {
                    const reflectionX = item1.vx - 2 * dot * mtv.x / lenSq;
                    const reflectionY = item1.vy - 2 * dot * mtv.y / lenSq;
                    item1.vx = reflectionX * BOX_COLLISION_DAMPING * 0.5;
                    item1.vy = reflectionY * BOX_COLLISION_DAMPING * 0.5;
                }
                item1.angularVelocity *= -0.5;
            }
        }
        if (item1.x < 0) { item1.x = 0; item1.vx *= -0.5; }
        if (item1.x + item1.width > WORLD_WIDTH) { item1.x = WORLD_WIDTH - item1.width; item1.vx *= -0.5; }
        if (item1.y < 0) { item1.y = 0; item1.vy *= -0.5; }
        if (item1.y + item1.height > WORLD_HEIGHT) { item1.y = WORLD_HEIGHT - item1.height; item1.vy *= -0.5; }
    }

    for (const id in gameState.players) {
        const player = gameState.players[id];
        const hitboxWidth = player.width * 0.4;
        const hitboxHeight = player.height * 0.7;
        player.hitbox = {
            width: hitboxWidth,
            height: hitboxHeight,
            x: player.x + (player.width - hitboxWidth) / 2,
            y: player.y + (player.height - hitboxHeight) / 2,
        };

        if (player.hasSkateboard) {
            if (player.activeAbility === 'chameleon' && player.isCamouflaged) {
                player.isCamouflaged = false;
            }
            const originalX = player.x;
            const originalY = player.y;
            const skateSpeed = SKATEBOARD_SPEED_BOOST;
            const angle = player.rotation;
            
            player.x += Math.cos(angle) * skateSpeed;
            player.hitbox.x = player.x + (player.width - player.hitbox.width) / 2;
            let collidedX = false;
            for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) { if (isColliding(player.hitbox, wall)) { collidedX = true; } }
            if (isColliding(player.hitbox, gameState.chest)) { collidedX = true; }
            if (player.x < 0 || player.x + player.width > WORLD_WIDTH) { collidedX = true; }
            if (collidedX) {
                player.x = originalX;
                player.hitbox.x = player.x + (player.width - player.hitbox.width) / 2;
            }

            player.y += Math.sin(angle) * skateSpeed;
            player.hitbox.y = player.y + (player.height - player.hitbox.height) / 2;
            let collidedY = false;
            for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) { if (isColliding(player.hitbox, wall)) { collidedY = true; } }
            if (isColliding(player.hitbox, gameState.chest)) { collidedY = true; }
            if (player.y < 0 || player.y + player.height > WORLD_HEIGHT) { collidedY = true; }
            if (collidedY) {
                player.y = originalY;
                player.hitbox.y = player.y + (player.height - player.hitbox.height) / 2;
            }
        } else if (player.input.movement.up || player.input.movement.down || player.input.movement.left || player.input.movement.right) {
            if (player.activeAbility === 'chameleon' && player.isCamouflaged) {
                player.isCamouflaged = false;
            }
            const originalX = player.x;
            const originalY = player.y;
            if (player.input.movement.left) { player.x -= player.speed; }
            if (player.input.movement.right) { player.x += player.speed; }
            player.hitbox.x = player.x + (player.width - player.hitbox.width) / 2;
            let collidedX = false;
            for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
                if (isColliding(player.hitbox, wall)) { collidedX = true; }
            }
            if (isColliding(player.hitbox, gameState.chest)) { collidedX = true; }
            if (player.x < 0 || player.x + player.width > WORLD_WIDTH) { collidedX = true; }
            if (collidedX) {
                player.x = originalX;
                player.hitbox.x = player.x + (player.width - player.hitbox.width) / 2;
            }
            if (player.input.movement.up) { player.y -= player.speed; }
            if (player.input.movement.down) { player.y += player.speed; }
            player.hitbox.y = player.y + (player.height - player.hitbox.height) / 2;
            let collidedY = false;
            for (const wall of [...gameState.house.walls, ...gameState.garage.walls]) {
                if (isColliding(player.hitbox, wall)) { collidedY = true; }
            }
            if (isColliding(player.hitbox, gameState.chest)) { collidedY = true; }
            if (player.y < 0 || player.y + player.height > WORLD_HEIGHT) { collidedY = true; }
            if (collidedY) {
                player.y = originalY;
                player.hitbox.y = player.y + (player.height - player.hitbox.height) / 2;
            }
        }
        player.isHidden = false;
        for (const sunshade of gameState.sunshades) {
            if (isColliding(player.hitbox, sunshade)) {
                player.isHidden = true;
                break;
            }
        }
        const playerPoly = { ...player.hitbox, rotation: 0 };
        for (const item of allCollidables) {
            const mtv = checkCollisionSAT(playerPoly, item);
            if (mtv) {
                if (player.hasSkateboard) { 
                    player.x -= mtv.x;
                    player.y -= mtv.y;
                    continue;
                }
                let pushDirectionX = 0;
                let pushDirectionY = 0;
                if (player.input.movement.up) { pushDirectionY -= 1; }
                if (player.input.movement.down) { pushDirectionY += 1; }
                if (player.input.movement.left) { pushDirectionX -= 1; }
                if (player.input.movement.right) { pushDirectionX += 1; }
                const pushForceX = pushDirectionX * BOX_PUSH_FORCE;
                const pushForceY = pushDirectionY * BOX_PUSH_FORCE;
                const predictedItem = {
                    ...item,
                    x: item.x + item.vx + pushForceX,
                    y: item.y + item.vy + pushForceY
                };
                let wouldCollideWithWall = false;
                const staticObstacles = [...gameState.house.walls, ...gameState.garage.walls, gameState.chest];
                for (const obstacle of staticObstacles) {
                    if (checkCollisionSAT(predictedItem, obstacle)) {
                        wouldCollideWithWall = true;
                        break;
                    }
                }
                if (wouldCollideWithWall) {
                    player.x -= mtv.x;
                    player.y -= mtv.y;
                } else {
                    player.x -= mtv.x;
                    player.y -= mtv.y;
                    const len = Math.sqrt(pushDirectionX * pushDirectionX + pushDirectionY * pushDirectionY);
                    if (len > 0) {
                        item.vx += pushForceX;
                        item.vy += pushForceY;
                        const contactVectorX = (player.x + player.width / 2) - (item.x + item.width / 2);
                        const contactVectorY = (player.y + player.height / 2) - (item.y + item.height / 2);
                        const torque = (contactVectorX * pushDirectionY - contactVectorY * pushDirectionX) * TORQUE_FACTOR;
                        item.angularVelocity += torque;
                    }
                }
            }
        }
        const allWalls = [...gameState.house.walls, ...gameState.garage.walls];
        for (const wall of allWalls) {
            playerPoly.x = player.x + (player.width - player.hitbox.width) / 2;
            playerPoly.y = player.y + (player.height - player.hitbox.height) / 2;
            const mtv = checkCollisionSAT(playerPoly, wall);
            if (mtv) {
                player.x -= mtv.x;
                player.y -= mtv.y;
            }
        }
    }

    if (gameState.gamePhase === 'running') {
        const players = gameState.players;
        const playerIds = Object.keys(players);
        let humanCount = 0;
        let hasZombies = false;
        for (const id1 of playerIds) {
            const player1 = players[id1];
            if (player1.role === 'zombie') {
                hasZombies = true;
                for (const id2 of playerIds) {
                    if (id1 === id2) continue;
                    const player2 = players[id2];
                    if ((player2.role === 'human' || player2.isSpying) && isColliding(player1.hitbox, player2.hitbox)) {
                        
                        if (player2.hasSkateboard) {
                            player2.hasSkateboard = false;
                            gameState.skateboard.spawned = true;
                            gameState.skateboard.ownerId = null;
                            gameState.skateboard.x = player2.x;
                            gameState.skateboard.y = player2.y + player2.height;
                        }

                        if (player2.isSpying) {
                            player2.isSpying = false;
                        }
                        player2.role = 'zombie';
                        player2.speed *= ZOMBIE_SPEED_BOOST;
                        console.log(`${player2.name} foi infectado!`);
                        io.emit('newMessage', { name: 'Servidor', text: `${player2.name} foi infectado!` });
                    }
                }
            }
        }
        if (hasZombies) {
            for (const id of playerIds) {
                if (players[id].role === 'human' && !players[id].isSpying) {
                    humanCount++;
                }
            }
            if (humanCount === 0 && playerIds.length > 0) {
                console.log("Todos os humanos foram infectados! Reiniciando a partida.");
                io.emit('newMessage', { name: 'Servidor', text: 'Os Zumbis venceram!' });

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
                    player.width = INITIAL_PLAYER_SIZE;
                    player.height = INITIAL_PLAYER_SIZE * 1.25;
                    player.speed = INITIAL_PLAYER_SPEED;
                    if (id !== skateOwnerId) {
                        player.hasSkateboard = false;
                    }
                }
            }
        }
    }
    gameState.arrows.forEach((arrow, index) => {
        arrow.x += Math.cos(arrow.angle) * ARROW_SPEED;
        arrow.y += Math.sin(arrow.angle) * ARROW_SPEED;
        if (arrow.x < 0 || arrow.x > WORLD_WIDTH || arrow.y < 0 || arrow.y > WORLD_HEIGHT) {
            gameState.arrows.splice(index, 1);
        }
    });
}

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);
    createNewPlayer(socket);
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
            if (gameState.takenAbilities.includes(ability)) {
                return;
            }
            player.coins -= cost;
            player.activeAbility = ability;
            gameState.takenAbilities.push(ability);
            if (ability === 'archer') {
                player.arrowAmmo = 100;
            }
        }
    });
socket.on('playerAction', (actionData) => {
    const player = gameState.players[socket.id];
    if (!player) return;

    if (actionData.type === 'primary_action') {
        if (player.activeAbility === 'archer' && player.arrowAmmo > 0) {
            player.arrowAmmo--;
            gameState.arrows.push({
                x: player.x + player.width / 2,
                y: player.y + player.height / 2,
                width: 10, height: 10, color: 'red',
                angle: player.rotation,
                ownerId: player.id
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
        if (player && text && text.trim().length > 0) {
            const message = {
                name: player.name,
                text: text.substring(0, 150)
            };
            io.emit('newMessage', message);
        }
    });
    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        const player = gameState.players[socket.id];
        if (player) {
            if (player.activeAbility !== ' ') {
                gameState.takenAbilities = gameState.takenAbilities.filter(ability => ability !== player.activeAbility);
            }
            if (player.hasSkateboard) {
                spawnSkateboard();
            }
        }
        delete gameState.players[socket.id];
    });
});
setInterval(() => {
    if (!gameState || !gameState.players) {
        return;
    }
    updateGameState();
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
                    console.log(`A rodada começou! ${zombiePlayer.name} é o Zumbi inicial!`);
                    io.emit('newMessage', { name: 'Servidor', text: `A infecção começou! ${zombiePlayer.name} é o zumbi!` });
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
            console.log("O tempo acabou! Humanos venceram a rodada.");
            io.emit('newMessage', { name: 'Servidor', text: 'O tempo acabou! Os Humanos sobreviveram!' });

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
    console.log(`🚀 Servidor do jogo rodando em http://localhost:${PORT}`);
});