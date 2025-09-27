const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const socketHandler = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3001"
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AOL Chat Server is running' });
});

socketHandler(io);

db.initialize().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 AOL Chat Server running on port ${PORT}`);
    console.log(`📡 Client URL: ${process.env.CLIENT_URL || "http://localhost:3001"}`);
    console.log(`🔧 Max room size: ${process.env.MAX_ROOM_SIZE || 20}`);
    console.log(`📝 Signup enabled: ${process.env.ENABLE_SIGNUP || 'true'}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});