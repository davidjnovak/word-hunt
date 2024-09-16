const Room = require('./models/Room');
const WordHuntGame = require('./gameLogic');

const game = new WordHuntGame();
game.loadDictionary();

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
        socket.emit('game-board', room.gameState.board);
      }
    });

    socket.on('submit-word', async (roomId, playerId, word) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        let player = room.players.find(p => p.playerId === playerId);
        if (player && !player.wordsFound.includes(word) && game.validateWord(word, room.gameState.board)) {
          player.wordsFound.push(word);
          player.score += game.calculateScore([word]);
          await roomModel.updateRoom(roomId, { players: room.players });
          io.to(roomId).emit('update-player', player);
        } else {
          socket.emit('invalid-word', word);
        }
      }
    });

    socket.on('end-round', async (roomId) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        room.gameState.status = 'finished';
        const allValidWords = game.findAllValidWords(room.gameState.board);
        room.gameState.allValidWords = allValidWords;
        await roomModel.updateRoom(roomId, { gameState: room.gameState });

        io.to(roomId).emit('round-ended', {
          players: room.players,
          allValidWords: allValidWords,
          totalPossibleScore: game.calculateScore(allValidWords)
        });
      }
    });

    socket.on('start-new-round', async (roomId) => {
      let room = await roomModel.findRoom(roomId);
      if (room) {
        const newBoard = game.generateBoard();
        room.gameState = { board: newBoard, status: 'active', allValidWords: [] };
        room.players.forEach(player => {
          player.wordsFound = [];
          player.score = 0;
        });
        await roomModel.updateRoom(roomId, { gameState: room.gameState, players: room.players });
        io.to(roomId).emit('new-round', { board: newBoard, players: room.players });
      }
    });
  });
}

module.exports = { setupSocket };