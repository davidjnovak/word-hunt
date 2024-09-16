const Room = require('../models/Room');
const Player = require('../models/Player');

const createRoom = async (req, res) => {
  const roomId = Math.random().toString(36).substring(2, 10);
  const room = new Room(req.app.locals.client);
  await room.createRoom(roomId);
  res.json({ roomId });
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
    if (player && !player.wordsFound.includes(word)) {
      player.wordsFound.push(word);
      player.score += calculateWordScore(word);
      await room.updateRoom(roomId, { players: roomData.players });
      res.json(player);
    } else {
      res.status(400).json({ message: 'Word already found or player not found' });
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
    await room.updateRoom(roomId, { gameState: roomData.gameState });

    const playerModel = new Player(req.app.locals.client);
    for (let player of roomData.players) {
      await playerModel.updatePlayerTotalScore(player.playerId, player.score);
    }

    res.json(roomData.players);
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

function calculateWordScore(word) {
  return word.length;
}

module.exports = {
  createRoom,
  joinRoom,
  getRoomState,
  submitWord,
  endRound
};
