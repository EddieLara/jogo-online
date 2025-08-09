// ============ GAME CLIENT =============

// --------- Login & Google Auth ---------
let myId = null;
let myName = null;
let myEmail = null;
let googleUserInfo = null;
const loginScreen = document.getElementById('loginScreen');
const gameCanvas = document.getElementById('gameCanvas');
const chatInput = document.getElementById('chatInput');
let socket = null;

// Google Sign-In v2: manual button using GSI
const GOOGLE_CLIENT_ID = "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";
const loginBtn = document.getElementById('googleLoginBtn');

// Botão de login Google
loginBtn.onclick = () => {
    window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
    });
    window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            alert('Falha ao abrir o popup de login Google!');
        }
    });
};

function handleGoogleLogin(response) {
    // Decodifica o JWT (Google Credential) para pegar email/nome
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    myEmail = payload.email;
    myName = payload.name;
    googleUserInfo = { email: myEmail, name: myName };
    startGameWithGoogle();
}

function startGameWithGoogle() {
    loginScreen.style.display = 'none';
    gameCanvas.style.display = 'block';
    chatInput.style.display = 'none';
    connectSocketWithAuth();
}

// --------- Socket.IO Game ---------
function connectSocketWithAuth() {
    socket = io({ auth: { userInfo: googleUserInfo } });

    socket.on('connect', () => {
        myId = socket.id;
    });
    socket.on('gameStateUpdate', (serverState) => {
        gameState = serverState;
    });
    socket.on('newMessage', (message) => {
        chatMessages.push(message);
        if (chatMessages.length > MAX_MESSAGES) chatMessages.shift();
    });
    socket.on('banMessage', (data) => {
        alert(data.reason);
        document.body.innerHTML = `<h1 style="color:${data.color};text-align:center;margin-top:40vh;">${data.reason}</h1>`;
    });
}

// --------- Game Vars ---------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const movement = { up: false, down: false, left: false, right: false };
let mouse = { x: 0, y: 0 };
let isMenuOpen = false;
let activeMenuTab = 'items';
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 7;
let gameState = { players: {}, arrows: [], timeLeft: 120, startTime: 60, gamePhase: 'waiting', abilityCosts: {} };

// --------- Images ---------
function loadImage(src) { const img = new Image(); img.src = src; return img; }
const human = loadImage('Sprites/Human.png');
const zombie = loadImage('Sprites/Zombie.png');
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
const smallBed = loadImage('Sprites/smallBed.png');
const smallTable = loadImage('Sprites/smallTable.png');
const bigTable = loadImage('Sprites/bigTable.png');
const car = loadImage('Sprites/Car.png');
const skateboardSprite = loadImage('Sprites/Skateboard.png');

// --------- Visual Setup ---------
(function setup() {
    document.body.style.backgroundColor = '#000000';
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    chatInput.style.display = 'none';
    chatInput.style.position = 'absolute';
    chatInput.style.bottom = '20px';
    chatInput.style.left = '50%';
    chatInput.style.transform = 'translateX(-50%)';
    chatInput.style.width = '50%';
    chatInput.style.maxWidth = '800px';
    chatInput.style.padding = '10px';
    chatInput.style.fontSize = '16px';
    chatInput.style.border = '2px solid #555';
    chatInput.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
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
})();

<<<<<<< HEAD
// --------- Input ---------
=======
const socket = io();

function loadImage(src) {
    const img = new Image();
    img.src = src;
    return img;
}
const human = loadImage('Sprites/Human.png');
const zombie = loadImage('Sprites/Zombie.png');
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
const smallBed = loadImage('Sprites/smallBed.png');
const smallTable = loadImage('Sprites/smallTable.png');
const bigTable = loadImage('Sprites/bigTable.png');
const car = loadImage('Sprites/Car.png');
const skateboardSprite = loadImage('Sprites/Skateboard.png');
let myId = null;
let gameState = { players: {}, arrows: [], timeLeft: 120, startTime: 60, gamePhase: 'waiting', abilityCosts: {} };
const movement = { up: false, down: false, left: false, right: false };
let mouse = { x: 0, y: 0 };
let isMenuOpen = false;
let activeMenuTab = 'abilities';
const chatInput = document.getElementById('chatInput');
let isChatting = false;
let chatMessages = [];
const MAX_MESSAGES = 7;
socket.on('connect', () => {
    myId = socket.id;
});
socket.on('gameStateUpdate', (serverState) => {
    gameState = serverState;
});
socket.on('newMessage', (message) => {
    chatMessages.push(message);
    if (chatMessages.length > MAX_MESSAGES) {
        chatMessages.shift();
    }
});
>>>>>>> 4ea81ec2aaee5dd9ca5d23fc30f778e89bff4a1a
window.addEventListener('keydown', function (event) {
    const key = event.key.toLowerCase();
    const me = gameState.players[myId];

    if (key === 'enter') {
        event.preventDefault();
        if (isChatting) {
            const messageText = chatInput.value.trim();
            if (messageText) socket.emit('sendMessage', messageText);
            chatInput.value = '';
            chatInput.blur();
        } else {
            chatInput.style.display = 'block';
            chatInput.focus();
        }
    }
    if (key === 'escape' && isChatting) {
        chatInput.value = '';
        chatInput.blur();
    }
    chatInput.onfocus = () => { isChatting = true; };
<<<<<<< HEAD
    chatInput.onblur = () => { isChatting = false; chatInput.style.display = 'none'; };
    if (key === 'b') isMenuOpen = !isMenuOpen;
    if (isMenuOpen || isChatting) return;
=======
    chatInput.onblur = () => {
        isChatting = false;
        chatInput.style.display = 'none';
    };
    if (key === 'b') {
        if (me && me.role !== 'zombie') {
            isMenuOpen = !isMenuOpen;
        }
    }
    if (isMenuOpen || isChatting) {
        return;
    }
>>>>>>> 4ea81ec2aaee5dd9ca5d23fc30f778e89bff4a1a
    switch (key) {
        case 'w': case 'arrowup': movement.up = true; break;
        case 's': case 'arrowdown': movement.down = true; break;
        case 'a': case 'arrowleft': movement.left = true; break;
        case 'd': case 'arrowright': movement.right = true; break;
        case 'e':
            if (me && me.role !== 'zombie') {
                socket.emit('playerAction', { type: 'interact' });
            }
            break;
        case 'c':
            if (me && me.role !== 'zombie') {
                socket.emit('playerAction', { type: 'ability' });
            }
            break;
        case 'g': socket.emit('playerAction', { type: 'drop_skateboard' }); break;
    }
});
window.addEventListener('keyup', function (event) {
    const key = event.key.toLowerCase();
    switch (key) {
        case 'w': case 'arrowup': movement.up = false; break;
        case 's': case 'arrowdown': movement.down = false; break;
        case 'a': case 'arrowleft': movement.left = false; break;
        case 'd': case 'arrowright': movement.right = false; break;
    }
});
canvas.addEventListener('mousemove', function (event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = event.clientX - rect.left;
    mouse.y = event.clientY - rect.top;
});
canvas.addEventListener('mousedown', function (event) {
    if (isMenuOpen) {
        const me = gameState.players[myId];
        if (!me) return;

        const abilitiesTabBtn = getAbilitiesTabRect();
        const itemsTabBtn = getItemsTabRect();
        if (isClickInside(mouse, abilitiesTabBtn)) {
            activeMenuTab = 'abilities';
            return;
        }
        if (isClickInside(mouse, itemsTabBtn)) {
            activeMenuTab = 'items';
            return;
        }

        if (activeMenuTab === 'abilities' && me.activeAbility === ' ') {
            const abilities = getAbilitiesLayout().buttons;
            for (const btn of abilities) {
                const cost = gameState.abilityCosts[btn.ability] || 0;
                const canAfford = me.coins >= cost;
                const isTaken = gameState.takenAbilities.includes(btn.ability);
                if (isClickInside(mouse, btn.rect) && !isTaken && canAfford) {
                    socket.emit('chooseAbility', btn.ability);
                    isMenuOpen = false;
                    return;
                }
            }
        }
    } else {
        socket.emit('playerAction', { type: 'primary_action' });
    }
});

<<<<<<< HEAD
function isClickInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
}

function getPlayerAngle(player) {
    if (!player) return 0;
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
function getSpyButtonRect() {
    const mY = (canvas.height - 400) / 2;
    return { x: canvas.width / 2 - 150, y: mY + 575, width: 300, height: 50 };
}

// --------- Ranking (PÓDIO) ---------
function drawPodiumRanking() {
    // ranking: top 10 jogadores online, por moedas (coins)
    let sorted = Object.values(gameState.players)
        .filter(p => p && typeof p.coins === "number")
        .sort((a, b) => b.coins - a.coins)
        .slice(0, 10);

    if (sorted.length === 0) return;
    const pad = 20, rowH = 35, width = 340, height = sorted.length * rowH + pad * 2 + 14;
    const x = canvas.width - width - 24, y = 18;

    // Fundo
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = "#181818";
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#27ae60";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    // Título
    ctx.font = "22px Arial";
    ctx.fillStyle = "#27ae60";
    ctx.textAlign = "center";
    ctx.fillText("🏆 PÓDIGO (Ranking)", x + width / 2, y + pad+2);

    // Linhas dos jogadores
    ctx.font = "19px Arial";
    sorted.forEach((player, idx) => {
        ctx.fillStyle = idx === 0 ? "#ffd700" : idx === 1 ? "#b5b5b5" : idx === 2 ? "#cd7f32" : "#fff";
        ctx.textAlign = "left";
        ctx.fillText(`${idx + 1}.`, x + pad, y + pad + 32 + idx * rowH);
        ctx.fillText(player.name, x + pad + 30, y + pad + 32 + idx * rowH);
        ctx.textAlign = "right";
        ctx.fillStyle = "#fff";
        ctx.fillText(`🪙 ${player.coins}`, x + width - pad, y + pad + 32 + idx * rowH);
    });
    ctx.restore();
}

function drawChat() {
    if (chatMessages.length === 0) return;
    ctx.save();
    const chatBoxX = 10;
    const chatBoxY = canvas.height - 200 - (chatMessages.length * 25);
    const chatBoxWidth = 500;
    const chatBoxHeight = (chatMessages.length * 25) + 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    chatMessages.forEach((msg, index) => {
        const fullMessage = `${msg.name}: ${msg.text}`;
        ctx.fillStyle = msg.name === 'Servidor' ? 'yellow' : 'gold';
        ctx.fillText(msg.name + ':', chatBoxX + 10, chatBoxY + 5 + (index * 25));
        ctx.fillStyle = 'white';
        const nameWidth = ctx.measureText(msg.name + ': ').width;
        ctx.fillText(msg.text, chatBoxX + 10 + nameWidth, chatBoxY + 5 + (index * 25));
    });
    ctx.restore();
}

function drawMenu() {
    const me = gameState.players[myId];
    if (!me) return;
    const menuWidth = 1500, menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2, menuY = (canvas.height - menuHeight) / 2;
    ctx.fillStyle = '#4d4c4cff';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    const functionsTabBtn = getFunctionsTabRect();
    const itemsTabBtn = getItemsTabRect();
    ctx.fillStyle = activeMenuTab === 'functions' ? '#000000ff' : '#444';
    ctx.fillRect(functionsTabBtn.x, functionsTabBtn.y, functionsTabBtn.width, functionsTabBtn.height);
    ctx.fillStyle = activeMenuTab === 'items' ? '#000000ff' : '#444';
    ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HABILIDADES', functionsTabBtn.x + functionsTabBtn.width / 2, functionsTabBtn.y + 40);
    ctx.fillText('ITENS', itemsTabBtn.x + itemsTabBtn.width / 2, itemsTabBtn.y + 40);
    if (activeMenuTab === 'functions') {
        ctx.font = '50px Arial';
        ctx.fillText('ESCOLHA UMA HABILIDADE', canvas.width / 2, menuY + 140);
        if (me.activeAbility === ' ') {
            const buttons = [
                { text: 'CAMALEÃO', ability: 'chameleon', rect: getChameleonButtonRect() },
                { text: 'ATLETA', ability: 'athlete', rect: getAthleteButtonRect() },
                { text: 'ARQUEIRO', ability: 'archer', rect: getArcherButtonRect() },
                { text: 'ENGENHEIRO', ability: 'engineer', rect: getEngineerButtonRect() },
                { text: 'FORMIGA', ability: 'ant', rect: getAntButtonRect() },
                { text: 'ESPIÃO', ability: 'spy', rect: getSpyButtonRect() }
            ];
            buttons.forEach(btn => {
                const isTaken = gameState.takenAbilities.includes(btn.ability);
                const cost = gameState.abilityCosts[btn.ability] || 0;
                const canAfford = me.coins >= cost;
                ctx.fillStyle = isTaken ? '#888' : (canAfford ? 'white' : 'white');
                ctx.strokeStyle = isTaken ? '#555' : (canAfford ? 'white' : 'white');
                ctx.lineWidth = 3;
                ctx.strokeRect(btn.rect.x - 10, btn.rect.y - 10, btn.rect.width + 10, btn.rect.height + 10);
                ctx.font = '40px Arial';
                ctx.textAlign = 'center';
                const buttonText = isTaken ? `${btn.text} (INDISPONÍVEL)` : btn.text;
                ctx.fillText(buttonText, btn.rect.x + btn.rect.width / 2, btn.rect.y + 35);
                ctx.font = '30px Arial';
                ctx.textAlign = 'left';
                ctx.fillStyle = canAfford ? 'gold' : 'red';
                ctx.fillText(`🪙 ${cost}`, btn.rect.x + btn.rect.width + 30, btn.rect.y + 35);
            });
        } else {
            ctx.font = '40px Arial';
            ctx.fillStyle = 'grey';
            ctx.fillText('HABILIDADE JÁ ESCOLHIDA!', canvas.width / 2, canvas.height / 2);
        }
    } else if (activeMenuTab === 'items') {
        ctx.font = '50px Arial';
        ctx.fillText('LOJA', canvas.width / 2, menuY + 140);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'grey';
        ctx.fillText(me.inventory.length === 0 ? 'Inventário vazio' : me.inventory.join(', '), canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRESSIONE "B" PARA FECHAR', canvas.width / 2 + 580, menuY + menuHeight - 20);
}

// --------- Render ---------
=======
>>>>>>> 4ea81ec2aaee5dd9ca5d23fc30f778e89bff4a1a
function draw() {
    if (!myId || !gameState.players || !gameState.players[myId]) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.font = '30px Arial';
        ctx.fillText('Waiting for game state...', canvas.width / 2, canvas.height / 2);
        return;
    }
    const me = gameState.players[myId];
    let cameraX = me.x - canvas.width / 2;
    let cameraY = me.y - canvas.height / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-cameraX, -cameraY);
    ctx.drawImage(grass, 0, 0, 3100, 2000);
    ctx.drawImage(floors, 200, 200, 2697, 1670);
    ctx.drawImage(garageFloor, 2000, 1200, 700, 600);
    ctx.drawImage(sea, 4965, 0, 1300, 2000);
    ctx.drawImage(sand, 4080, 0, 1850, 2000);
    ctx.drawImage(street, 3090, 0, 1000, 2000);
    ctx.drawImage(chest, 2890, 825, 200, 240);

    if (gameState.skateboard && gameState.skateboard.spawned) {
        const skate = gameState.skateboard;
        ctx.drawImage(skateboardSprite, skate.x, skate.y, skate.width, skate.height);
    }

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

        if (player.hasSkateboard && gameState.skateboard) {
            const skate = gameState.skateboard;
            ctx.drawImage(skateboardSprite, -skate.width / 2, player.height / 2 - 55, skate.width, skate.height);
        }

        if (player.role === 'zombie' || player.isSpying) {
            ctx.drawImage(zombie, -player.width / 2, -player.height / 2, player.width, player.height);
        } else if (player.isCamouflaged) {
            ctx.drawImage(box, -player.width / 2, -player.height / 2, player.width, player.height);
        } else if (player.isAnt) {
            ctx.drawImage(ant, -player.width / 2, -player.height / 2, player.width, player.height);
        } else {
            ctx.drawImage(human, -player.width / 2, -player.height / 2, player.width, player.height);
        }
        ctx.restore();
        
        if (!player.isAnt && !player.isCamouflaged && !player.isHidden) {
            ctx.fillStyle = (player.role === 'zombie' || player.isSpying) ? '#2ecc71' : 'white';
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
    ctx.font = '40px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    if (gameState.gamePhase === 'waiting') {
        const seconds = gameState.startTime % 60;
        ctx.fillText(`0:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 80);
        ctx.font = '30px Arial';
        ctx.fillText('The round starts in...', canvas.width / 2, 40);
    } else {
        const minutes = Math.floor(gameState.timeLeft / 60);
        const seconds = gameState.timeLeft % 60;
        ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, canvas.width / 2, 50);
        if (me.role === 'zombie') {
            ctx.font = '30px Arial';
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('INFECT THE HUMANS!', canvas.width / 2, 90);
        } else {
            ctx.font = '30px Arial';
            ctx.fillStyle = 'cyan';
            ctx.fillText('SURVIVE!', canvas.width / 2, 90);
        }
    }
    ctx.font = '30px Arial';
    ctx.fillStyle = 'gold';
    ctx.textAlign = 'right';
    ctx.fillText(`🪙 ${me.coins}`, canvas.width - 20, 50);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'white';
    ctx.fillText(`SPEED: ${me.speed.toFixed(2)}`, canvas.width - 20, canvas.height - 10);
    ctx.textAlign = 'left';
    ctx.fillText(`ABILITY: ${me.activeAbility.toUpperCase()}`, 10, canvas.height - 10);
    if (me.activeAbility === 'archer') {
        ctx.fillText(`AMMO: ${me.arrowAmmo}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'engineer') {
        ctx.font = '24px Arial';
        const statusText = me.engineerAbilityUsed ? 'USED' : 'AVAILABLE';
        ctx.fillStyle = me.engineerAbilityUsed ? 'red' : 'lightgreen';
        ctx.fillText(`DUCTS: ${statusText}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'athlete') {
        ctx.font = '24px Arial';
        ctx.fillStyle = me.sprintAvailable ? 'lightgreen' : 'red';
        ctx.fillText(`SPRINT: ${me.sprintAvailable ? 'READY' : 'RECHARGING'}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'chameleon') {
        ctx.font = '24px Arial';
        ctx.fillStyle = me.camouflageAvailable ? 'lightgreen' : 'red';
        ctx.fillText(`CAMOUFLAGE: ${me.camouflageAvailable ? 'READY' : 'RECHARGING'}`, 10, canvas.height - 50);
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
            statusText = 'RECHARGING';
            ctx.fillStyle = 'red';
        }
        ctx.fillText(`ANT: ${statusText}`, 10, canvas.height - 50);
    }
    if (me.activeAbility === 'spy') {
        ctx.font = '24px Arial';
        let statusText;
        if (me.isSpying) {
            statusText = 'ACTIVE';
            ctx.fillStyle = 'yellow';
        } else if (me.spyUsesLeft > 0 && !me.spyCooldown) {
            statusText = 'READY';
            ctx.fillStyle = 'lightgreen';
        } else {
            statusText = 'RECHARGING';
            ctx.fillStyle = 'red';
        }
        if (me.spyUsesLeft === 0 && !me.isSpying) {
            statusText = 'NO USES';
            ctx.fillStyle = 'darkred';
        }
        ctx.fillText(`SPYING: ${statusText}`, 10, canvas.height - 50);
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.fillText(`USES LEFT: ${me.spyUsesLeft}`, 10, canvas.height - 80);
    }
    drawChat();
    drawPodiumRanking();
    if (isMenuOpen) {
        drawMenu();
    }
}
<<<<<<< HEAD
=======
function drawChat() {
    if (chatMessages.length === 0) return;
    ctx.save();
    const chatBoxX = 10;
    const chatBoxY = canvas.height - 200 - (chatMessages.length * 25);
    const chatBoxWidth = 500;
    const chatBoxHeight = (chatMessages.length * 25) + 10;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(chatBoxX, chatBoxY, chatBoxWidth, chatBoxHeight);
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    chatMessages.forEach((msg, index) => {
        ctx.fillStyle = msg.name === 'Server' ? 'yellow' : 'gold';
        ctx.fillText(msg.name + ':', chatBoxX + 10, chatBoxY + 5 + (index * 25));
        ctx.fillStyle = 'white';
        const nameWidth = ctx.measureText(msg.name + ': ').width;
        ctx.fillText(msg.text, chatBoxX + 10 + nameWidth, chatBoxY + 5 + (index * 25));
    });
    ctx.restore();
}

function getAbilitiesLayout() {
    const abilities = [
        { text: 'CHAMELEON', ability: 'chameleon', description: 'Turn into a box to hide.' },
        { text: 'ATHLETE', ability: 'athlete', description: 'Sprint for a short duration.' },
        { text: 'ARCHER', ability: 'archer', description: 'Shoot arrows to slow enemies.' },
        { text: 'ENGINEER', ability: 'engineer', description: 'Travel instantly between ducts.' },
        { text: 'ANT', ability: 'ant', description: 'Shrink to a tiny size.' },
        { text: 'SPY', ability: 'spy', description: 'Disguise as a zombie.' }
    ];

    const menuWidth = 1500, menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2, menuY = (canvas.height - menuHeight) / 2;

    const cols = 3;
    const btnWidth = 400;
    const btnHeight = 150;
    const gap = 50;
    const totalGridWidth = cols * btnWidth + (cols - 1) * gap;
    const startX = menuX + (menuWidth - totalGridWidth) / 2;
    const startY = menuY + 220;

    const buttons = abilities.map((ability, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
            ...ability,
            rect: {
                x: startX + col * (btnWidth + gap),
                y: startY + row * (btnHeight + gap),
                width: btnWidth,
                height: btnHeight
            }
        };
    });
    return { buttons };
}

function drawMenu() {
    const me = gameState.players[myId];
    if (!me) return;
    const menuWidth = 1500, menuHeight = 900;
    const menuX = (canvas.width - menuWidth) / 2, menuY = (canvas.height - menuHeight) / 2;
    ctx.fillStyle = '#4d4c4cff';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
    ctx.strokeStyle = '#000000ff';
    ctx.lineWidth = 5;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
    const abilitiesTabBtn = getAbilitiesTabRect();
    const itemsTabBtn = getItemsTabRect();
    ctx.fillStyle = activeMenuTab === 'abilities' ? '#000000ff' : '#444';
    ctx.fillRect(abilitiesTabBtn.x, abilitiesTabBtn.y, abilitiesTabBtn.width, abilitiesTabBtn.height);
    ctx.fillStyle = activeMenuTab === 'items' ? '#000000ff' : '#444';
    ctx.fillRect(itemsTabBtn.x, itemsTabBtn.y, itemsTabBtn.width, itemsTabBtn.height);
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ABILITIES', abilitiesTabBtn.x + abilitiesTabBtn.width / 2, abilitiesTabBtn.y + 40);
    ctx.fillText('ITEMS', itemsTabBtn.x + itemsTabBtn.width / 2, itemsTabBtn.y + 40);

    if (activeMenuTab === 'abilities') {
        ctx.font = '50px Arial';
        ctx.fillText('CHOOSE AN ABILITY', canvas.width / 2, menuY + 140);
        if (me.activeAbility === ' ') {
            const { buttons } = getAbilitiesLayout();
            buttons.forEach(btn => {
                const isTaken = gameState.takenAbilities.includes(btn.ability);
                const cost = gameState.abilityCosts[btn.ability] || 0;
                const canAfford = me.coins >= cost;
                ctx.fillStyle = isTaken ? '#333' : (canAfford ? '#282828' : '#1a1a1a');
                ctx.fillRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);
                ctx.strokeStyle = isTaken ? '#555' : (canAfford ? 'white' : '#666');
                ctx.lineWidth = 3;
                ctx.strokeRect(btn.rect.x, btn.rect.y, btn.rect.width, btn.rect.height);

                ctx.textAlign = 'center';
                ctx.font = '40px Arial';
                ctx.fillStyle = isTaken ? '#888' : (canAfford ? 'white' : '#999');
                ctx.fillText(btn.text, btn.rect.x + btn.rect.width / 2, btn.rect.y + 45);

                ctx.font = '20px Arial';
                ctx.fillStyle = isTaken ? '#777' : (canAfford ? '#ccc' : '#888');
                ctx.fillText(btn.description, btn.rect.x + btn.rect.width / 2, btn.rect.y + 80);

                ctx.font = '30px Arial';
                ctx.fillStyle = canAfford ? 'gold' : 'red';
                const costText = `🪙 ${cost}`;
                ctx.textAlign = 'right';
                ctx.fillText(costText, btn.rect.x + btn.rect.width - 20, btn.rect.y + btn.rect.height - 15);
                
                if (isTaken) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.textAlign = 'center';
                    ctx.font = 'bold 30px Arial';
                    ctx.fillText('TAKEN', btn.rect.x + btn.rect.width / 2, btn.rect.y + 115);
                }
            });
        } else {
            ctx.font = '40px Arial';
            ctx.fillStyle = 'grey';
            ctx.textAlign = 'center';
            ctx.fillText('ABILITY ALREADY CHOSEN!', canvas.width / 2, canvas.height / 2);
        }
    } else if (activeMenuTab === 'items') {
        ctx.font = '50px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SHOP', canvas.width / 2, menuY + 140);
        ctx.font = '30px Arial';
        ctx.fillStyle = 'grey';
        ctx.fillText(me.inventory.length === 0 ? 'Inventory empty' : me.inventory.join(', '), canvas.width / 2, canvas.height / 2);
    }
    ctx.font = '20px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('PRESS "B" TO CLOSE', canvas.width / 2 + 580, menuY + menuHeight - 20);
}
function isClickInside(pos, rect) {
    return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y > rect.y && pos.y < rect.y + rect.height;
}
function getPlayerAngle(player) {
    if (!player) return 0;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const dx = mouse.x - cx;
    const dy = mouse.y - cy;
    return Math.atan2(dy, dx);
}
function getAbilitiesTabRect() {
    const mX = (canvas.width - 1500) / 2;
    const mY = (canvas.height - 900) / 2;
    return { x: mX + 10, y: mY + 10, width: 200, height: 60 };
}
function getItemsTabRect() {
    const mX = (canvas.width - 1500) / 2;
    const mY = (canvas.height - 900) / 2;
    return { x: mX + 220, y: mY + 10, width: 200, height: 60 };
}
>>>>>>> 4ea81ec2aaee5dd9ca5d23fc30f778e89bff4a1a

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