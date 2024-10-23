const { ObjectId } = require('mongodb');

class Player {
  constructor(db) {
    if (!db) {
      throw new Error('Database connection is required');
    }
    this.collection = db.collection('players');
  }

  async updatePlayerTotalScore(playerId, score) {
    return await this.collection.updateOne(
      { _id: ObjectId.createFromTime(playerId) },
      { $inc: { totalScore: score } },
      { upsert: true }
    );
  }
}

module.exports = Player;