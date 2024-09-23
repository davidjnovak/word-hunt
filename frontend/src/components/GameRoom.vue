<template>
    <div class="game-room">
      <div v-if="!roomId">
        <button @click="createRoom">Create Room</button>
        <div>
          <input v-model="joinRoomId" placeholder="Room ID" />
          <button @click="joinRoom">Join Room</button>
        </div>
      </div>
  
      <div v-else>
        <h2>Room ID: {{ roomId }}</h2>
        <div v-if="board.length">
          <div class="game-board">
            <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
              <div v-for="(letter, colIndex) in row" :key="colIndex" class="board-cell">
                {{ letter }}
              </div>
            </div>
          </div>
          <div class="word-input">
            <input v-model="currentWord" placeholder="Enter word" />
            <button @click="submitWord">Submit Word</button>
          </div>
          <button @click="endRound">End Round</button>
          <button @click="startNewRound">Start New Round</button>
        </div>
        <div class="player-list">
          <h3>Players:</h3>
          <ul>
            <li v-for="player in players" :key="player.playerId">
              {{ player.name }} - Score: {{ player.score }}
            </li>
          </ul>
        </div>
        <div v-if="roundEnded">
          <h3>Round Ended</h3>
          <p>Total Possible Score: {{ totalPossibleScore }}</p>
          <h4>All Valid Words:</h4>
          <ul>
            <li v-for="word in allValidWords" :key="word">{{ word }}</li>
          </ul>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  import io from 'socket.io-client';
  
  export default {
    data() {
      return {
        roomId: null,
        joinRoomId: '',
        board: [],
        players: [],
        currentWord: '',
        socket: null,
        roundEnded: false,
        allValidWords: [],
        totalPossibleScore: 0,
      };
    },
    methods: {
      async createRoom() {
        try {
          const response = await axios.post('http://localhost:3000/api/rooms/create');
          this.roomId = response.data.roomId;
          this.board = response.data.board;
          this.setupSocket();
        } catch (error) {
          console.error('Error creating room:', error);
        }
      },
      async joinRoom() {
        try {
          const response = await axios.post('http://localhost:3000/api/rooms/join', {
            roomId: this.joinRoomId,
            playerId: 'player' + Math.random().toString(36).substr(2, 9),
            playerName: 'Player ' + Math.floor(Math.random() * 1000),
          });
          this.roomId = this.joinRoomId;
          this.board = response.data.gameState.board;
          this.players = response.data.players;
          this.setupSocket();
        } catch (error) {
          console.error('Error joining room:', error);
        }
      },
      async submitWord() {
        try {
          await axios.post(`http://localhost:3000/api/rooms/${this.roomId}/submit-word`, {
            playerId: this.socket.id,
            word: this.currentWord,
          });
          this.currentWord = '';
        } catch (error) {
          console.error('Error submitting word:', error);
        }
      },
      async endRound() {
        try {
          const response = await axios.post(`http://localhost:3000/api/rooms/${this.roomId}/end-round`);
          this.roundEnded = true;
          this.allValidWords = response.data.allValidWords;
          this.totalPossibleScore = response.data.totalPossibleScore;
        } catch (error) {
          console.error('Error ending round:', error);
        }
      },
      async startNewRound() {
        try {
          const response = await axios.post(`http://localhost:3000/api/rooms/${this.roomId}/start-new-round`);
          this.board = response.data.board;
          this.players = response.data.players;
          this.roundEnded = false;
          this.allValidWords = [];
          this.totalPossibleScore = 0;
        } catch (error) {
          console.error('Error starting new round:', error);
        }
      },
      setupSocket() {
        this.socket = io('http://localhost:3000');
        this.socket.emit('join-room', this.roomId, this.socket.id, 'Player ' + Math.floor(Math.random() * 1000));
  
        this.socket.on('update-players', (players) => {
          this.players = players;
        });
  
        this.socket.on('update-player', (player) => {
          const index = this.players.findIndex(p => p.playerId === player.playerId);
          if (index !== -1) {
            this.players[index] = player;
          }
        });
  
        this.socket.on('round-ended', (data) => {
          this.roundEnded = true;
          this.allValidWords = data.allValidWords;
          this.totalPossibleScore = data.totalPossibleScore;
          this.players = data.players;
        });
  
        this.socket.on('new-round', (data) => {
          this.board = data.board;
          this.players = data.players;
          this.roundEnded = false;
          this.allValidWords = [];
          this.totalPossibleScore = 0;
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .game-room {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .game-board {
    display: inline-block;
    border: 2px solid #333;
    margin-bottom: 20px;
  }
  
  .board-row {
    display: flex;
  }
  
  .board-cell {
    width: 40px;
    height: 40px;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
  }
  
  .word-input {
    margin-bottom: 20px;
  }
  
  .word-input input {
    margin-right: 10px;
  }
  
  .player-list {
    margin-top: 20px;
  }
  </style>