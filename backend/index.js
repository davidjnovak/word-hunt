const express = require('express');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const WordHuntGame = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["https://word-finder-6aaaf.web.app", "http://localhost:8080"],
    credentials: true,
    methods: ["GET", "POST"]
  }
});

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function startServer() {
  try {
    await client.connect();
    console.log("MongoDB connected...");

    const database = client.db('word-hunt');

    
    app.use(cors({
      origin: ["https://wordcrack.lol", "http://localhost:5002"],
      methods: ["GET", "POST", "OPTIONS"],
      credentials: true
    }));

    app.use(express.json());

    const game = new WordHuntGame();
    await game.loadDictionary();
    console.log("Dictionary loaded...");

    app.use((req, res, next) => {
      req.db = database;
      req.game = game;
      next();
    });

    const roomRoutes = require('./routes/api/RoomRoutes');
    app.use('/api/rooms', roomRoutes);

    io.on('connection', (socket) => {
      console.log('New client connected');
      
      socket.on('join-room', (roomId, playerId, playerName) => {
        socket.join(roomId);
        // Add player to room logic here
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
        // Handle player disconnect logic here
      });
    });

    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (err) {
    console.error("Failed to start server", err);
    await client.close();
    process.exit(1);
  }
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});
