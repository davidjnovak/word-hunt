const Room = require('./models/Room');

function setupSocket(io, client) {
  const roomModel = new Room(client);

  io.on('connection', (socket) => {
    socket.on('join-room', async (roomId, playerId, playerName) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        socket.join(roomId);
        let player = room.players.find(p => p.playerId === playerId);
        if (!player) {
          room.players.push({ playerId, name: playerName, score: 0, wordsFound: [] });
          await roomModel.updateRoom(roomId, { players: room.players });
        }
        io.to(roomId).emit('update-players', room.players);
      }
    });

    socket.on('submit-word', async (roomId, playerId, word) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        let player = room.players.find(p => p.playerId === playerId);
        if (player && !player.wordsFound.includes(word)) {
          player.wordsFound.push(word);
          player.score += calculateWordScore(word);
          await roomModel.updateRoom(roomId, { players: room.players });
          socket.emit('update-player', player);
        }
      }
    });

    socket.on('end-round', async (roomId) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        room.gameState.status = 'finished';
        await roomModel.updateRoom(roomId, { gameState: room.gameState });

        // Update total scores in Players collection
        const playerModel = new Player(client);
        for (let player of room.players) {
          await playerModel.updatePlayerTotalScore(player.playerId, player.score);
        }

        io.to(roomId).emit('end-round', room.players);
      }
    });
  });
}

function calculateWordScore(word) {
  // Scoring logic based on word length or other criteria
  return word.length;
}

module.exports = { setupSocket };
