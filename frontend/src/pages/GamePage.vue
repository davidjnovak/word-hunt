<template>
  <div class="game-room">
    <h2 v-if="roomId">Room ID: {{ roomId }}</h2>
    <div v-if="board.length">
      <div class="game-board">
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
          <div v-for="(letter, colIndex) in row" :key="colIndex" class="board-cell">
            {{ letter }}
          </div>
        </div>
      </div>
      <div class="word-input">
        <input v-model="currentWord" placeholder="Enter word" @keyup.enter="submitWord" />
        <button @click="submitWord">Submit Word</button>
      </div>
      <button @click="endRound">End Round</button>
      <button @click="startNewRound">Start New Round</button>
    </div>
    <div class="player-list">
      <h3>Players:</h3>
      <ul>
        <li v-for="player in players" :key="player.playerId" :class="{ 'current-player': player.playerId === playerId }">
          {{ player.name }} - Score: {{ player.score }}
          <span v-if="player.playerId === playerId"> (You)</span>
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
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import io from 'socket.io-client';

export default {
  setup() {
    const route = useRoute();
    const roomId = ref(null);
    const board = ref([]);
    const players = ref([]);
    const currentWord = ref('');
    const socket = ref(null);
    const roundEnded = ref(false);
    const allValidWords = ref([]);
    const totalPossibleScore = ref(0);
    const playerId = ref('');
    const playerName = ref(route.query.playerName || '');

    const setupSocket = () => {
      socket.value = io('http://localhost:3000');
      socket.value.emit('join-room', roomId.value, playerId.value, 'Player ' + playerName.value + Math.floor(Math.random() * 1000));

      socket.value.on('update-players', (updatedPlayers) => {
        players.value = updatedPlayers;
      });

      socket.value.on('update-player', (player) => {
        const index = players.value.findIndex(p => p.playerId === player.playerId);
        if (index !== -1) {
          players.value[index] = player;
        }
      });

      socket.value.on('round-ended', (data) => {
        roundEnded.value = true;
        allValidWords.value = data.allValidWords;
        totalPossibleScore.value = data.totalPossibleScore;
        players.value = data.players;
      });

      socket.value.on('new-round', (data) => {
        board.value = data.board;
        players.value = data.players;
        roundEnded.value = false;
        allValidWords.value = [];
        totalPossibleScore.value = 0;
      });

      socket.value.on('word-result', ({ playerId: updatedPlayerId, isValid, score }) => {
        const playerIndex = players.value.findIndex(p => p.playerId === updatedPlayerId);
        if (playerIndex !== -1) {
          if (isValid) {
            players.value[playerIndex].score += score;
          }
        }
      });
    };

    const joinOrCreateRoom = async () => {
      if (route.params.roomId) {
        // Join existing room
        try {
          playerId.value = 'player' + Math.random().toString(36).substr(2, 9);
          const response = await axios.post('http://localhost:3000/api/rooms/join', {
            roomId: route.params.roomId,
            playerId: playerId.value,
            playerName: 'Player ' + playerName.value + Math.floor(Math.random() * 1000),
          });
          roomId.value = route.params.roomId;
          board.value = response.data.gameState.board;
          players.value = response.data.players;
          setupSocket();
        } catch (error) {
          console.error('Error joining room:', error);
        }
      } else {
        // Create new room
        try {
          const response = await axios.post('http://localhost:3000/api/rooms/create');
          roomId.value = response.data.roomId;
          board.value = response.data.board;
          playerId.value = 'player' + Math.random().toString(36).substr(2, 9);
          setupSocket();
        } catch (error) {
          console.error('Error creating room:', error);
        }
      }
    };

    onMounted(() => {
      joinOrCreateRoom();
    });

    watch(() => route.params.roomId, (newRoomId) => {
      if (newRoomId && newRoomId !== roomId.value) {
        joinOrCreateRoom();
      }
    });

    const submitWord = async () => {
      if (currentWord.value.trim() === '') return;

      const word = currentWord.value.trim().toUpperCase();

      // Clear the input field immediately
      currentWord.value = '';

      try {
        const response = await axios.post(`http://localhost:3000/api/rooms/${roomId.value}/submit-word`, {
          playerId: playerId.value,
          word: word,
        });

        // Update the player's score based on the server response
        if (response.data.isValid) {
          const playerIndex = players.value.findIndex(p => p.playerId === playerId.value);
          if (playerIndex !== -1) {
            players.value[playerIndex].score += response.data.score;
          }
        }
      } catch (error) {
        console.error('Error submitting word:', error);
      }
    };

    const endRound = async () => {
      try {
        const response = await axios.post(`http://localhost:3000/api/rooms/${roomId.value}/end-round`);
        roundEnded.value = true;
        allValidWords.value = response.data.allValidWords;
        totalPossibleScore.value = response.data.totalPossibleScore;
      } catch (error) {
        console.error('Error ending round:', error);
      }
    };

    const startNewRound = async () => {
      try {
        const response = await axios.post(`http://localhost:3000/api/rooms/${roomId.value}/start-new-round`);
        board.value = response.data.board;
        players.value = response.data.players;
        roundEnded.value = false;
        allValidWords.value = [];
        totalPossibleScore.value = 0;
      } catch (error) {
        console.error('Error starting new round:', error);
      }
    };

    return {
      roomId,
      board,
      players,
      currentWord,
      roundEnded,
      allValidWords,
      totalPossibleScore,
      submitWord,
      endRound,
      startNewRound,
      playerId,
      playerName,
    };
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

.current-player {
  font-weight: bold;
  color: #4CAF50;
}
</style>