const { ObjectId } = require('mongodb');

class Player {
  constructor(client) {
    this.collection = client.db('word-hunt').collection('players');
  }

  async updatePlayerTotalScore(playerId, score) {
    return await this.collection.updateOne(
      { _id: ObjectId(playerId) },
      { $inc: { totalScore: score } },
      { upsert: true }
    );
  }
}

module.exports = Player;
