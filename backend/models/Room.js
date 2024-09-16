const { ObjectId } = require('mongodb');

class Room {
  constructor(client) {
    this.collection = client.db('word-hunt').collection('rooms');
  }

  async createRoom(roomId, board) {
    const room = {
      roomId,
      players: [],
      gameState: { board, status: 'waiting', allValidWords: [] }
    };
    await this.collection.insertOne(room);
    return room;
  }

  async findRoom(roomId) {
    return await this.collection.findOne({ roomId });
  }

  async updateRoom(roomId, update) {
    return await this.collection.updateOne({ roomId }, { $set: update });
  }
}

module.exports = Room;
