// =============================================================
//                           SCRIPT DO CLIENTE
// =============================================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const socket = io('https://jogo-online-medv.onrender.com');

// --- ASSETS E CONSTANTES ---
function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}
const human = loadImage('Sprites/Human.png');
const box = loadImage('Sprites/Box.png');
const grass = loadImage('Sprites/Grass.png');
const street = loadImage('Sprites/Street.png');
const sand = loadImage('Sprites/Sand.png');
const sea = loadImage('Sprites/Sea.png');
const sunshade = loadImage('Sprites/Sunshade.png');
const sunshadeII = loadImage('Sprites/SunshadeII.png');
const sunshadeIII = loadImage('Sprites/SunshadeII.png');
const ductSprite = loadImage('Sprites/Duct.png');
const chest = loadImage('Sprites/Chest.png');
const floors = loadImage('Sprites/Floor.png');
const garageFloor = loadImage('Sprites/garageFloor.png');
const ant = loadImage('Sprites/Ant.png');

// --- MÓVEIS ---
const smallBed = loadImage('Sprites/smallBed.png');
const smallTable = loadImage('Sprites/smallTable.png');
const bigTable = loadImage('Sprites/bigTable.png');
const car = loadImage('Sprites/Car.png');

// --- ESTADO LOCAL DO CLIENTE ---
let myId = null;
let gameState = { players: {}, arrows: [], timeLeft: 120, startTime: 60, gamePhase: 'waiting', abilityCosts: {} };
const movement = { up: false, down: false, left: false, right: false };
let mouse = { x: 0, y: 0 };
let isMenuOpen = false;
let activeMenuTab = 'items';
const chatInput = document.getElementById('chatInput');
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 7; // Número máximo de mensagens a serem exibidas

// --- COMUNICAÇÃO COM O SERVIDOR ---
socket.on('connect', () => {
    myId = socket.id;
});
socket.on('gameStateUpdate', (serverState) => {
    gameState = serverState;
});
socket.on('newMessage', (message) => {
    chatMessages.push(message);
    // Remove mensagens antigas se o limite for ultrapassado
    if (chatMessages.length > MAX_MESSAGES) {
        chatMessages.shift();
    }
});

// --- INPUT HANDLERS ---
window.addEventListener('keydown', function(event) {
    const key = event.key.toLowerCase();

    // Lógica principal do chat com a tecla "Enter"
    if (key === 'enter') {
        event.preventDefault(); // Impede o comportamento padrão do navegador
        if (isChatting) {
            const messageText = chatInput.value.trim();
            if (messageText) {
                socket.emit('sendMessage', messageText); // Envia a mensagem para o servidor
            }
            chatInput.value = '';
            chatInput.blur(); // Tira o foco do input
        } else {
            chatInput.style.display = 'block'; // Mostra o input
            chatInput.focus(); // Foca no input para digitação
        }
    }

    // Se o usuário pressionar "Escape" enquanto digita, cancela o chat
    if (key === 'escape' && isChatting) {
        chatInput.value = '';
        chatInput.blur();
    }

    // Gerenciamento de foco do chat
    chatInput.onfocus = () => { isChatting = true; };
    chatInput.onblur = () => {
        isChatting = false;
        chatInput.style.display = 'none'; // Esconde o input quando não está em uso
    };

    if (key === 'b') {
        isMenuOpen = !isMenuOpen;
    }

    // Se o menu ou o chat estiverem abertos, não processe os controles do jogo
    if (isMenuOpen || isChatting) {
        return;
    }

    // Controles do jogo (só funcionam se não estiver digitando no chat)
    switch (key) {
        case 'w': case 'arrowup': movement.up = true; break;
        case 's': case 'arrowdown': movement.down = true; break;
        case 'a': case 'arrowleft': movement.left = true; break;
        case 'd': case 'arrowright': movement.right = true; break;
        case 'e': socket.emit('playerAction', { type: 'interact' }); break;
        case 'c': socket.emit('playerAction', { type: 'ability' }); break;
    }
});

window.addEventListener('keyup', function(event) {
    const key = event.key.toLowerCase();
    switch (key) {
        case 'w': case 'arrowup': movement.up = false; break;
        case 's': case 'arrowdown': movement.down = false; break;
        case 'a': case 'arrowleft': movement.left = false; break;
        case 'd': case 'arrowright': movement.right = false; break;
    }
});
canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});
canvas.addEventListener('mousedown', function(event) {
    if (isMenuOpen) {
        const functionsTabBtn = getFunctionsTabRect();
        const itemsTabBtn = getItemsTabRect();
        if (isClickInside(mouse, functionsTabBtn)) {
            activeMenuTab = 'functions';
            return;
        }
        if (isClickInside(mouse, itemsTabBtn)) {
            activeMenuTab = 'items';
            return;
        }
        if (activeMenuTab === 'functions') {
            const chameleonBtn = getChameleonButtonRect();
            const athleteBtn = getAthleteButtonRect();
            const archerBtn = getArcherButtonRect();
            const engineerBtn = getEngineerButtonRect();
            const antBtn = getAntButtonRect();

            if (isClickInside(mouse, chameleonBtn) && !gameState.takenAbilities.includes('chameleon')) {
                socket.emit('chooseAbility', 'chameleon');
            } else if (isClickInside(mouse, athleteBtn) && !gameState.takenAbilities.includes('athlete')) {
                socket.emit('chooseAbility', 'athlete');
            } else if (isClickInside(mouse, archerBtn) && !gameState.takenAbilities.includes('archer')) {
                socket.emit('chooseAbility', 'archer');
            } else if (isClickInside(mouse, engineerBtn) && !gameState.takenAbilities.includes('engineer')) {
                socket.emit('chooseAbility', 'engineer');
            } else if (isClickInside(mouse, antBtn) && !gameState.takenAbilities.includes('ant')) {
                socket.emit('chooseAbility', 'ant');
            } else {
                return;
            }
            isMenuOpen = false;
        }
    } else {
        socket.emit('playerAction', { type: 'primary_action' });
    }
});

// --- FUNÇÃO DE DESENHO ---
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
    let cameraX = me.x - canvas.width / 2;
    let cameraY = me.y - canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);

    // DESENHA MUNDO
    ctx.drawImage(grass, 0, 0, 3100, 2000);
    ctx.drawImage(floors, 200, 200, 2697, 1670);
    ctx.drawImage(garageFloor, 2000, 1200, 700, 600);
    ctx.drawImage(sea, 4965, 0, 1300, 2000);
    ctx.drawImage(sand, 4080, 0, 1850, 2000);
    ctx.drawImage(street, 3090, 0, 1000, 2000);
    ctx.drawImage(chest, 2890, 825, 200, 240);

    const furnitureSprites = { small_bed: smallBed, small_table: smallTable, big_table: bigTable, car: car };
    for (const duct of gameState.ducts) {
        ctx.drawImage(ductSprite, duct.x, duct.y, duct.width, duct.height);
    }
    if (gameState.box) {
        for (const b of gameState.box) {
            ctx.save();
            ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
            ctx.rotate(b.rotation);
            ctx.drawImage(box, -b.width / 2, -b.height / 2, b.width, b.height);
            ctx.restore();
        }
    }
    if (gameState.furniture) {
        for (const item of gameState.furniture) {
            const sprite = furnitureSprites[item.id];
            if (sprite) {
                ctx.save();
                ctx.translate(item.x + item.width / 2, item.y + item.height / 2);
                ctx.rotate(item.rotation);
                ctx.drawImage(sprite, -item.width / 2, -item.height / 2, item.width, item.height);
                ctx.restore();
            }
        }
    }

    ctx.fillStyle = '#4b3621';
    ctx.strokeStyle = '#785634ff';
    ctx.lineWidth = 15;
    for (const wall of gameState.house.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
    for (const wall of gameState.garage.walls) {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
    ctx.strokeStyle = '#c38a51ff';
    ctx.lineWidth = 3;
    for (const wall of gameState.house.walls) {
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }
    for (const wall of gameState.garage.walls) {
        ctx.strokeRect(wall.x, wall.y, wall.width, wall.height);
    }

    // DESENHA JOGADORES
    for (const playerId in gameState.players) {
        const player = gameState.players[playerId];
        if (player.isInDuct) continue;
        if (player.isHidden && playerId !== myId) continue;
        ctx.save();
        ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
        if (playerId === myId) {
            ctx.rotate(getPlayerAngle(player));
        } else {
            ctx.rotate(player.rotation);
        }
        if (player.isCamouflaged) {
            ctx.drawImage(box, -player.width / 2, -player.height / 2, player.width, player.height);
        } else if (player.isAnt) {
            ctx.drawImage(ant, -player.width / 2, -player.height / 2, player.width, player.height);
        } else {
            ctx.drawImage(human, -player.width / 2, -player.height / 2, player.width, player.height);
        }
        ctx.restore();

        if (!player.isAnt && !player.isCamouflaged && !player.isHidden) {
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 5;
            ctx.textAlign = 'center';
            ctx.font = '18px Arial';
            ctx.strokeText(player.name, player.x + player.width / 2, player.y - 20);
            ctx.fillText(player.name, player.x + player.width / 2, player.y - 20);
        }
    }

    ctx.drawImage(sunshade, 4200, 1000, 320, 340);
    ctx.drawImage(sunshadeII, 4350, 600, 320, 340);
    ctx.drawImage(sunshadeIII, 4440, 1400, 320, 340);

    for (const arrow of gameState.arrows) {
        ctx.fillStyle = arrow.color || 'red';
        ctx.fillRect(arrow.x, arrow.y, arrow.width, arrow.height);
    }
    ctx.restore();

    // DESENHA INTERFACE (HUD)
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    if (gameState.gamePhase === 'waiting') {
        const seconds = gameState.startTime % 60;
        ctx.fillText(`0:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 80);
        ctx.font = '30px Arial';
        ctx.fillText('Start of the round in...', canvas.width / 2, 40);
    } else {
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 50);
    }

    // Contador de moedas
    ctx.font = '30px Arial';
    ctx.fillStyle = 'gold';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${me.coins}`, canvas.width - 20, 50);

    ctx.font = '30px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.fillText(`SPEED: ${me.speed.toFixed(2)}`, canvas.width - 20, canvas.height - 10);
    ctx.textAlign = 'left';
    ctx.fillText(`SKILL: ${me.activeAbility.toUpperCase()}`, 10, canvas.height - 10);
    if (me.activeAbility === 'archer') {
        ctx.fillText(`AMMO: ${me.arrowAmmo}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'engineer') {
        ctx.font = '24px Arial';
        const statusText = me.engineerAbilityUsed ? 'USED' : 'AVAILABLE';
        ctx.fillStyle = me.engineerAbilityUsed ? 'red' : 'lightgreen';
        ctx.fillText(`VENTS: ${statusText}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'athlete') {
        ctx.font = '24px Arial';
        ctx.fillStyle = me.sprintAvailable ? 'lightgreen' : 'red';
        ctx.fillText(`SPRINT: ${me.sprintAvailable ? 'READY' : 'RELOADING'}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'chameleon') {
        ctx.font = '24px Arial';
        ctx.fillStyle = me.camouflageAvailable ? 'lightgreen' : 'red';
        ctx.fillText(`CAMOUFLAGE: ${me.camouflageAvailable ? 'READY' : 'RELOADING'}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'ant') {
        ctx.font = '24px Arial';
        let statusText;
        if (me.isAnt) {
            statusText = 'ACTIVE';
            ctx.fillStyle = 'yellow';
        } else if (me.antAvailable) {
            statusText = 'READY';
            ctx.fillStyle = 'lightgreen';
        } else {
            statusText = 'RELOADING';
            ctx.fillStyle = 'red';
        }
        ctx.fillText(`ANT: ${statusText}`, 10, canvas.height - 50);
    }

    drawChat();

    if (isMenuOpen) {
        drawMenu();
    }
}

function drawChat() {
    if (chatMessages.length === 0) return;

    ctx.save();
    const chatBoxX = canvas.width / 2 - 400;
    const chatBoxY = canvas.height - 50 - (chatMessages.length * 25);
    const chatBoxWidth = 800;
    const chatBoxHeight = (chatMessages.length * 25) + 10;

    // Fundo semitransparente para legibilidade
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);

    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    chatMessages.forEach((msg, index) => {
        // Formato: "NomeDoJogador: mensagem"
        const fullMessage = `${msg.name}: ${msg.text}`;

        // Cor do nome do jogador (pode personalizar)
        ctx.fillStyle = 'gold';
        ctx.fillText(msg.name + ':', chatBoxX + 10, chatBoxY + 5 + (index * 25));

        // Cor do texto da mensagem
        ctx.fillStyle = 'white';
        const nameWidth = ctx.measureText(msg.name + ': ').width;
        ctx.fillText(msg.text, chatBoxX + 10 + nameWidth, chatBoxY + 5 + (index * 25));
    });

    ctx.restore();
}

// --- FUNÇÕES AUXILIARES ---
function drawMenu() {
    const me = gameState.players[myId];
    if (!me) {
        return;
    }
    const menuWidth = 1500, menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2, menuY = (canvas.height - menuHeight) / 2;
    ctx.fillStyle = '#4d4c4cff';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    const functionsTabBtn = getFunctionsTabRect();
    const itemsTabBtn = getItemsTabRect();
    ctx.fillStyle = '#444';
    ctx.fillRect(functionsTabBtn.x, functionsTabBtn.y, functionsTabBtn.width, functionsTabBtn.height);
    ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
    ctx.fillStyle = '#000000ff';
    if (activeMenuTab === 'functions') {
        ctx.fillRect(functionsTabBtn.x, functionsTabBtn.y, functionsTabBtn.width, functionsTabBtn.height);
    } else {
        ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
    }
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SKILLS', functionsTabBtn.x + functionsTabBtn.width / 2, functionsTabBtn.y + 40);
    ctx.fillText('ITEMS', itemsTabBtn.x + itemsTabBtn.width / 2, itemsTabBtn.y + 40);
    if (activeMenuTab === 'functions') {
        ctx.font = '50px Arial';
        ctx.fillText('CHOOSE A SKILL', canvas.width / 2, menuY + 140);
        if (me.activeAbility === ' ') {
            const buttons = [
                { text: 'CHAMELEON', ability: 'chameleon', rect: getChameleonButtonRect() },
                { text: 'ATHLETE', ability: 'athlete', rect: getAthleteButtonRect() },
                { text: 'ARCHER', ability: 'archer', rect: getArcherButtonRect() },
                { text: 'ENGINEER', ability: 'engineer', rect: getEngineerButtonRect() },
                { text: 'ANT', ability: 'ant', rect: getAntButtonRect() }
            ];

            buttons.forEach(btn => {
                const isTaken = gameState.takenAbilities.includes(btn.ability);
                const cost = gameState.abilityCosts[btn.ability] || 0;
                const canAfford = me.coins >= cost;

                // Desenha o contorno e o texto do botão
                ctx.fillStyle = isTaken ? '#888' : (canAfford ? 'white' : 'red');
                ctx.strokeStyle = isTaken ? '#555' : (canAfford ? 'white' : 'grey');
                ctx.lineWidth = 3;
                ctx.strokeRect(btn.rect.x - 10, btn.rect.y - 10, btn.rect.width + 10, btn.rect.height + 10);

                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                const buttonText = isTaken ? `${btn.text}` : btn.text;
                ctx.fillText(buttonText, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);

                // Desenha o custo ao lado do botão
                ctx.font = '30px Arial';
                ctx.textAlign = 'left';
                ctx.fillStyle = canAfford ? 'gold' : 'grey';
                ctx.fillText(`🪙 ${cost}`, btn.rect.x + btn.rect.width + 30, btn.rect.y + 35);
            });

        } else {
            ctx.font = '40px Arial';
            ctx.fillStyle = 'grey';
            ctx.fillText('SKILL ALREADY CHOSEN!', canvas.width / 2, canvas.height / 2);
        }
    } else if (activeMenuTab === 'items') {
        ctx.font = '50px Arial';
        ctx.fillText('SHOP', canvas.width / 2, menuY + 140);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'grey';
        ctx.fillText(me.inventory.length === 0 ? ' ' : me.inventory.join(', '), canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS "B" TO CLOSE', canvas.width / 2, menuY + menuHeight - 20);
}

function isClickInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
}
function getPlayerAngle(player) {
    if (!player) {
        return 0;
    }
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    return Math.atan2(dy, dx);
}
function getFunctionsTabRect() {
    const mX = (canvas.width - 1500) / 2;
    const mY = (canvas.height - 900) / 2;
    return { x: mX + 10, y: mY + 10, width: 200, height: 60 };
}
function getItemsTabRect() {
    const mX = (canvas.width - 1500) / 2;
    const mY = (canvas.height - 900) / 2;
    return { x: mX + 220, y: mY + 10, width: 200, height: 60 };
}
function getChameleonButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 200, width: 300, height: 50 };
}
function getAthleteButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 275, width: 300, height: 50 };
}
function getArcherButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 350, width: 300, height: 50 };
}
function getEngineerButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 425, width: 300, height: 50 };
}
function getAntButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 500, width: 300, height: 50 };
}

// --- GAME LOOP ---
function gameLoop() {
    if (myId && gameState.players[myId]) {
        const me = gameState.players[myId];
        const rot = getPlayerAngle(me);
        socket.emit('playerInput', { movement: movement, mouse: mouse, rotation: rot });
    }
    draw();
    requestAnimationFrame(gameLoop);
}
gameLoop();