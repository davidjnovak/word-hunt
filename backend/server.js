const express = require('express');
const http = require('http');
const { MongoClient, ServerApiVersion } = require('mongodb');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const roomRoutes = require('./routes/roomRoutes');
const { setupSocket } = require('./socket');

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

client.connect()
  .then(() => {
    console.log("MongoDB connected...");
  })
  .catch(err => {
    console.error("Failed to connect to MongoDB", err);
  });

app.use(cors());
app.use(express.json());

app.use('/api/rooms', roomRoutes);

setupSocket(io, client);

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});

module.exports = client;
