class Room {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required');
    }
    this.collection = db.collection('rooms');
  }

  async createRoom(roomId, board, validWords) {
    const room = {
      roomId,
      players: [],
      gameState: { 
        board, 
        status: 'waiting', 
        validWords,
        allValidWords: validWords
      }
    };
    await this.collection.insertOne(room);
    return room;
  }

  async findRoom(roomId) {
    return await this.collection.findOne({ roomId });
  }

  async canAddPlayer(roomId, playerName) {
    const room = await this.findRoom(roomId);
    if (!room) return { allowed: false, reason: 'Room not found' };
    
    if (room.players.length >= 25) {
      return { allowed: false, reason: 'Room is full (max 25 players)' };
    }

    return { allowed: true };
  }

  async updateRoom(roomId, update) {
    return await this.collection.updateOne({ roomId }, { $set: update });
  }
}

module.exports = Room;