const express = require('express');
const app = express();
const http = require('http');
const fs = require('fs');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const PORT = process.env.PORT || 3000;

let chatLog = {};
const bannedUsers = new Set();

app.use(express.static('public'));

app.get('/admin', (req, res) => {
  res.sendFile(__dirname + '/public/admin.html');
});

io.on('connection', (socket) => {
  let currentRoom = null;
  let username = null;
  let isAdmin = false;

  socket.on('join', ({ name, password, room }) => {
    if (bannedUsers.has(name)) {
      socket.emit('banned');
      return;
    }
    username = name;
    currentRoom = room;
    isAdmin = password === 'sennin114514';

    socket.join(room);
    if (!chatLog[room]) chatLog[room] = [];
    socket.emit('chat log', chatLog[room]);

    const message = `${username}が入室しました`;
    io.to(room).emit('system', message);
    io.to('admin').emit('log', `[${room}] ${message}`);

    if (isAdmin) {
      socket.join('admin');
    }
  });

  socket.on('chat message', (msg) => {
    const message = { user: username, text: msg, time: Date.now(), read: false };
    chatLog[currentRoom].push(message);
    io.to(currentRoom).emit('chat message', message);
    io.to('admin').emit('log', `[${currentRoom}] ${username}: ${msg}`);
  });

  socket.on('image', (data) => {
    const message = { user: username, image: data, time: Date.now(), read: false };
    chatLog[currentRoom].push(message);
    io.to(currentRoom).emit('image', message);
    io.to('admin').emit('log', `[${currentRoom}] ${username}が画像を送信`);
  });

  socket.on('video', (data) => {
    const message = { user: username, video: data, time: Date.now(), read: false };
    chatLog[currentRoom].push(message);
    io.to(currentRoom).emit('video', message);
    io.to('admin').emit('log', `[${currentRoom}] ${username}が動画を送信`);
  });

  socket.on('read', () => {
    chatLog[currentRoom].forEach(m => m.read = true);
  });

  socket.on('disconnect', () => {
    if (currentRoom && username) {
      const message = `${username}が退室しました`;
      io.to(currentRoom).emit('system', message);
      io.to('admin').emit('log', `[${currentRoom}] ${message}`);
    }
  });

  socket.on('admin broadcast', ({ message, room }) => {
    if (isAdmin) {
      if (room === 'all') {
        io.emit('system', `[管理者] ${message}`);
      } else {
        io.to(room).emit('system', `[管理者] ${message}`);
      }
    }
  });

  socket.on('ban user', (name) => {
    if (isAdmin) {
      bannedUsers.add(name);
      io.emit('banned user', name);
    }
  });

  socket.on('reset', () => {
    if (isAdmin) {
      chatLog = {};
      io.emit('system', '[管理者] サーバーがリセットされました');
    }
  });

  socket.on('keyword list', () => {
    if (isAdmin) {
      const keywords = new Set();
      for (const room in chatLog) {
        chatLog[room].forEach(msg => {
          if (msg.text && msg.text.includes('あいことば')) {
            keywords.add(msg.text);
          }
        });
      }
      socket.emit('keywords', Array.from(keywords));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
