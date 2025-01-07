const Room = require('../models/Room');
const Player = require('../models/Player');
const WordHuntGame = require('../gameLogic');

const game = new WordHuntGame();
game.loadDictionary();

const createRoom = async (req, res) => {
  try {
    const roomId = req.body.roomId || Math.random().toString(36).substring(2, 10);
    const room = new Room(req.db);
    const existingRoom = await room.findRoom(roomId);
    
    if (existingRoom) {
      return res.status(409).json({ 
        message: 'Room already exists',
        roomId: roomId
      });
    }
    
    const board = game.generateBoard();
    const validWords = game.findAllValidWords(board);
    await room.createRoom(roomId, board, validWords);
    res.json({ roomId, board });

  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: 'Error creating room' });
  }
};

const joinRoom = async (req, res) => {
  const { roomId, playerId, playerName } = req.body;
  const room = new Room(req.db);

  const joinCheck = await room.canAddPlayer(roomId, playerName);
  if (!joinCheck.allowed) {
    return res.status(400).json({ message: joinCheck.reason });
  }

  let roomData = await room.findRoom(roomId);
  if (roomData) {
    let player = roomData.players.find(p => p.playerId === playerId);

    if (!player) {
      roomData.players.push({
        playerId,
        name: playerName,
        score: 0,
        wordsFound: []
      });
      await room.updateRoom(roomId, { players: roomData.players });
    }
    return res.json(roomData);
  } else {
    return res.status(404).json({ message: 'Room not found' });
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

  const room = new Room(req.db);
  let roomData = await room.findRoom(roomId);
  
  if (roomData) {
    let player = roomData.players.find(p => p.playerId === playerId);
    
    if (player) {
      const isValid = !player.wordsFound.includes(word) && 
      roomData.gameState.validWords.includes(word.toUpperCase());
      
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
        res.json({ 
          isValid: false, 
          score: 0,
          updatedScore: player.score,
          playerId: player.playerId
        });
      }
    } else {
      res.status(400).json({ message: 'Player not found in room' });
    }
  } else {
    res.status(404).json({ message: 'Room not found' });
  }
};

const endRound = async (req, res) => {
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
    const newBoard = game.generateBoard();
    const validWords = game.findAllValidWords(newBoard);

    roomData.gameState = {
      board: newBoard,
      status: 'active',
      validWords,
      allValidWords: []
    };

    roomData.players.forEach(player => {
      player.wordsFound = [];
      player.score = 0;
    });

    await room.updateRoom(roomId, {
      gameState: roomData.gameState,
      players: roomData.players
    });

    res.json({
      board: newBoard,
      players: roomData.players,
      validWords
    });
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