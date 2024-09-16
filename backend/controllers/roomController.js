const Room = require('../models/Room');
const Player = require('../models/Player');
const WordHuntGame = require('../gameLogic');

const game = new WordHuntGame();
game.loadDictionary();

const createRoom = async (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 10);
  const room = new Room(req.app.locals.client);
  const board = game.generateBoard();
  await room.createRoom(roomId, board);
  res.json({ roomId, board });
};

const joinRoom = async (req, res) => {
  const { roomId, playerId, playerName } = req.body;
  const room = new Room(req.app.locals.client);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    let player = roomData.players.find(p => p.playerId === playerId);
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
  const room = new Room(req.app.locals.client);
  const roomData = await room.findRoom(roomId);
  if (roomData) {
    res.json(roomData);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const submitWord = async (req, res) => {
  const { roomId, playerId, word } = req.body;
  const room = new Room(req.app.locals.client);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    let player = roomData.players.find(p => p.playerId === playerId);
    if (player && !player.wordsFound.includes(word) && game.validateWord(word, roomData.gameState.board)) {
      player.wordsFound.push(word);
      player.score += game.calculateScore([word]);
      await room.updateRoom(roomId, { players: roomData.players });
      res.json(player);
    } else {
      res.status(400).json({ message: 'Invalid word or word already found' });
    }
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const endRound = async (req, res) => {
  const { roomId } = req.params;
  const room = new Room(req.app.locals.client);
  let roomData = await room.findRoom(roomId);
  if (roomData) {
    roomData.gameState.status = 'finished';
    const allValidWords = game.findAllValidWords(roomData.gameState.board);
    roomData.gameState.allValidWords = allValidWords;
    await room.updateRoom(roomId, { gameState: roomData.gameState });

    const playerModel = new Player(req.app.locals.client);
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
  const room = new Room(req.app.locals.client);
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