const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3000;

app.use(express.static(path.join(__dirname, '../public')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage: storage });

const users = new Map();
const rooms = new Map();
const messageHistory = [];
const MAX_HISTORY = 100;

io.on('connection', (socket) => {
  console.log('新用户连接:', socket.id);

  socket.on('user:join', (username) => {
    users.set(socket.id, {
      id: socket.id,
      username: username,
      joinTime: new Date()
    });

    socket.emit('history:load', messageHistory);

    io.emit('users:update', Array.from(users.values()));

    const systemMessage = `${username} 加入了聊天室`;
    io.emit('message:system', systemMessage);

    messageHistory.push({
      type: 'system',
      message: systemMessage,
      timestamp: new Date()
    });

    if (messageHistory.length > MAX_HISTORY) {
      messageHistory.shift();
    }

    console.log(`${username} 加入聊天室`);
  });

  socket.on('message:send', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const messageData = {
        id: Date.now(),
        username: user.username,
        message: data.message,
        timestamp: new Date(),
        type: 'text'
      };

      io.emit('message:receive', messageData);

      messageHistory.push(messageData);
      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }
    }
  });

  socket.on('file:upload', (data) => {
    const user = users.get(socket.id);
    if (user) {
      const fileData = {
        id: Date.now(),
        username: user.username,
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileData: data.fileData,
        timestamp: new Date(),
        type: 'file'
      };

      io.emit('file:receive', fileData);

      messageHistory.push(fileData);
      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }
    }
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      const systemMessage = `${user.username} 离开了聊天室`;
      io.emit('message:system', systemMessage);

      messageHistory.push({
        type: 'system',
        message: systemMessage,
        timestamp: new Date()
      });

      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }

      users.delete(socket.id);
      io.emit('users:update', Array.from(users.values()));
      console.log(`${user.username} 离开聊天室`);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=================================`);
  console.log(`局域网聊天服务器已启动`);
  console.log(`本地访问: http://localhost:${PORT}`);
  console.log(`局域网访问: http://[本机IP]:${PORT}`);
  console.log(`=================================`);
});
