const Room = require('../models/Room');
const Player = require('../models/Player');
const WordHuntGame = require('../gameLogic');

const game = new WordHuntGame();
game.loadDictionary();

const createRoom = async (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 10);
  const room = new Room(req.db);
  const board = game.generateBoard();
  await room.createRoom(roomId, board);
  res.json({ roomId, board });
};

const joinRoom = async (req, res) => {
  const { roomId, playerId, playerName } = req.body;
  console.log(playerId, playerName)
  const room = new Room(req.db);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    console.log("players", roomData.players)
    let player = roomData.players.find(p => p.playerId === playerId);
    console.log("player", player)
    if (!player) {
      roomData.players.push({ playerId, name: playerName, score: 0, wordsFound: [] });
      await room.updateRoom(roomId, { players: roomData.players });
    }
    res.json(roomData);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const getRoomState = async (req, res) => {
  const roomId = req.params.roomId;
  const room = new Room(req.db);
  const roomData = await room.findRoom(roomId);
  if (roomData) {
    res.json(roomData);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const submitWord = async (req, res) => {
  const { playerId, word } = req.body;
  const { roomId } = req.params;
  console.log(`Submitting word: ${word} for player: ${playerId} in room: ${roomId}`);

  const room = new Room(req.db);
  let roomData = await room.findRoom(roomId);
  
  if (roomData) {
    console.log('Room found:', roomData);
    console.log('Players in room:', roomData.players);
    
    console.log('Finding player:', playerId);
    let player = roomData.players.find(p => p.playerId === playerId);
    console.log('Player found:', player);
    
    if (player) {
      console.log('Word already found:', player.wordsFound.includes(word));
      console.log('Word validation result:', game.validateWord(word, roomData.gameState.board));
      
      const isValid = !player.wordsFound.includes(word) && game.validateWord(word, roomData.gameState.board);
      
      if (isValid) {
        player.wordsFound.push(word);
        const score = game.calculateScore([word]);
        player.score += score;
        await room.updateRoom(roomId, { players: roomData.players });
        res.json({ 
          isValid: true, 
          score: score, 
          updatedScore: player.score,
          playerId: player.playerId
        });
      } else {
        console.log('Word rejected. Already found or invalid.');
        res.json({ 
          isValid: false, 
          score: 0,
          updatedScore: player.score,
          playerId: player.playerId
        });
      }
    } else {
      console.log('Player not found in room');
      res.status(400).json({ message: 'Player not found in room' });
    }
  } else {
    console.log('Room not found');
    res.status(404).json({ message: 'Room not found' });
  }
};

const endRound = async (req, res) => {
  console.log("endRound")
  const { roomId } = req.params;
  const room = new Room(req.db);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    roomData.gameState.status = 'finished';
    const allValidWords = game.findAllValidWords(roomData.gameState.board);
    roomData.gameState.allValidWords = allValidWords;
    await room.updateRoom(roomId, { gameState: roomData.gameState });

    const playerModel = new Player(req.db);
    for (let player of roomData.players) {
      await playerModel.updatePlayerTotalScore(player.playerId, player.score);
    }

    res.json({
      players: roomData.players,
      allValidWords: allValidWords,
      totalPossibleScore: game.calculateScore(allValidWords)
    });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const startNewRound = async (req, res) => {
  const { roomId } = req.params;
  const room = new Room(req.db);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    const newBoard = req.game.generateBoard();
    roomData.gameState = { board: newBoard, status: 'active', allValidWords: [] };
    roomData.players.forEach(player => {
      player.wordsFound = [];
      player.score = 0;
    });
    await room.updateRoom(roomId, { gameState: roomData.gameState, players: roomData.players });
    res.json({ board: newBoard, players: roomData.players });
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

module.exports = {
  createRoom,
  joinRoom,
  getRoomState,
  submitWord,
  endRound,
  startNewRound
};