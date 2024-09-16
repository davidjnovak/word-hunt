const express = require('express');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const roomRoutes = require('./routes/roomRoutes');
const { setupSocket } = require('./socket');
const WordHuntGame = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const game = new WordHuntGame();

async function startServer() {
  try {
    await client.connect();
    console.log("MongoDB connected...");

    await game.loadDictionary();
    console.log("Dictionary loaded...");

    app.use(cors());
    app.use(express.json());

    app.use((req, res, next) => {
      req.game = game;
      next();
    });

    app.use('/api/rooms', roomRoutes);

    setupSocket(io, client, game);

    server.listen(3000, () => {
      console.log('Server is running on port 3000');
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

startServer();

module.exports = { client, game };