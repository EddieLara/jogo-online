const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = '738743537606-a45hjckrjste7899rhbp938c612rkel2.apps.googleusercontent.com';
const ALLOWED_EMAIL = 'enzosantiagosrv1245@gmail.com';
const client = new OAuth2Client(CLIENT_ID);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let gameState = { players: {}, banned: {} };

// ================= LOGIN GOOGLE ===================
app.post('/verify-token', async (req, res) => {
    const { token } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload.email;
        const name = payload.name;

        if(email !== ALLOWED_EMAIL){
            return res.json({ success: false });
        }

        res.json({ success: true, user: { name, email } });
    } catch(err){
        console.error(err);
        res.json({ success: false });
    }
});

// ================= SOCKET.IO ===================
io.on('connection', (socket) => {
    const userInfo = socket.handshake.auth.userInfo;
    if(!userInfo || userInfo.email !== ALLOWED_EMAIL){
        socket.emit('banMessage', { reason: 'Acesso negado', color: 'red' });
        socket.disconnect();
        return;
    }

    if(gameState.banned[userInfo.email]){
        socket.emit('banMessage', { reason: 'Você está banido', color: 'red' });
        socket.disconnect();
        return;
    }

    console.log('Novo jogador conectado:', userInfo.name);

    // Criar player
    gameState.players[socket.id] = {
        id: socket.id,
        name: userInfo.name,
        email: userInfo.email,
        x: Math.floor(Math.random()*2000),
        y: Math.floor(Math.random()*1000),
        width: 60,
        height: 75,
        role: 'human',
        coins: 0,
        chatMessage: ''
    };

    // ================= CHAT ===================
    socket.on('sendMessage', msg => {
        if(!msg) return;
        gameState.players[socket.id].chatMessage = msg;

        io.emit('newMessage', { name: userInfo.name, text: msg });
    });

    // ================= COMANDOS ===================
    socket.on('command', data => {
        const [cmd, ...args] = data.split(' ');
        const player = gameState.players[socket.id];

        if(!player) return;

        switch(cmd.toLowerCase()){
            case '/ban':
                {
                    const targetName = args[0];
                    const duration = args[1]; // opcional: temp ban
                    const target = Object.values(gameState.players).find(p => p.name===targetName);
                    if(target){
                        if(duration){
                            gameState.banned[target.email] = Date.now() + parseInt(duration)*1000;
                        } else {
                            gameState.banned[target.email] = Infinity;
                        }
                        io.to(target.id).emit('banMessage', { reason: 'Você foi banido', color: 'red' });
                        io.sockets.sockets.get(target.id).disconnect();
                    }
                }
                break;

            case '/tp':
                {
                    const targetName = args[0];
                    const target = Object.values(gameState.players).find(p => p.name===targetName);
                    if(target){
                        player.x = target.x + 50;
                        player.y = target.y + 50;
                    }
                }
                break;

            case '/coins':
                {
                    const amount = parseInt(args[0]);
                    const targetName = args[1];
                    const target = Object.values(gameState.players).find(p => p.name===targetName);
                    if(target && !isNaN(amount)){
                        target.coins += amount;
                    }
                }
                break;
        }
    });

    // ================= DISCONNECT ===================
    socket.on('disconnect', () => {
        delete gameState.players[socket.id];
    });
});

// ================= GAME LOOP ===================
setInterval(() => {
    // Remove bans temporários expirados
    for(const email in gameState.banned){
        if(gameState.banned[email] !== Infinity && Date.now() > gameState.banned[email]){
            delete gameState.banned[email];
        }
    }

    io.emit('gameStateUpdate', gameState);
}, 1000/60);

server.listen(3000, () => console.log('Servidor rodando na porta 3000'));
