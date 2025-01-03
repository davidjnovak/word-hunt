<template>
  <div class="game-room">
    <div v-if="roundStatus === 'notStarted'">
      <h2>Welcome! Ready to start a round?</h2>
      <button 
        class="button primary"
        @click="initiateCountdown"
      >
        Start Round
      </button>
    </div>

    <div v-else-if="roundStatus === 'countingDown'">
      <h2>Get Ready! Round starts in {{ countdownValue }}...</h2>
    </div>

    <div v-else-if="roundStatus === 'inProgress'">
      <div class="in-round-top-bar">
        <div 
          class="current-word" 
          :class="highlightClass"
        >
          {{ currentWord }}
        </div>
      </div>
      <div 
        class="game-board board-in-progress"
        @touchstart.prevent="handleTouchStart"
        @touchmove.prevent="handleTouchMove"
        @touchend.prevent="handleTouchEnd"
        @mousedown.prevent="handleMouseDown"
        @mousemove.prevent="handleMouseMove"
        @mouseup.prevent="handleMouseUp"
        @mouseleave.prevent="handleMouseUp"
      >
        <div v-for="(row, rowIndex) in board" :key="rowIndex" class="board-row">
          <div 
            v-for="(letter, colIndex) in row" 
            :key="colIndex" 
            class="board-cell"
            :class="{
              'selected': isSelected(rowIndex, colIndex)
            }"
            :data-row="rowIndex"
            :data-col="colIndex"
          >
            {{ letter }}
            <!-- Color-coded highlight for currently swiped cells -->
            <div 
              class="cell-highlight"
              :class="getCellHighlightClass(rowIndex, colIndex)"
            >
            </div>
          </div>
        </div>
      </div>
      <div class="score-label">Your Score: {{ currentPlayerScore() }}</div>
      <div class="timer-label">Time left: {{ roundTimeLeft }}s</div>
    </div>

    <!-- ROUND ENDED -->
    <div v-else-if="roundStatus === 'ended'">
      <h2>Round Ended</h2>
      <div class="player-list">
        <h3>Players:</h3>
        <ul>
          <li 
            v-for="player in sortedPlayers" 
            :key="player.playerId" 
            :class="{ 'current-player': player.playerId === playerId }"
          >
            {{ player.name }} - Score: {{ player.score }}
            <span v-if="player.playerId === playerId"> (You)</span>
            <div 
              v-if="player.playerId === playerId" 
              class="words-found"
            >
              Words found: {{ player.wordsFound.join(', ') }}
            </div>
          </li>
        </ul>
      </div>
      <button
        class="button success"
        @click="startNewRound"
      >
        Start Next Round
      </button>
      <h4>All Valid Words (sorted by length):</h4>
      <div class="valid-words-grid">
        <span 
          v-for="word in sortedAllValidWords" 
          :key="word"
          :class="{ 'found-word': playerFoundWord(word) }"
        >
          {{ word }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import io from 'socket.io-client';
import config from '../config.js';
import { useToast } from 'vue-toastification';
import { getCookie, setCookie } from '../utils/cookieUtil.js';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();

    // Room / Board Data
    const roomId = ref(null);
    const board = ref([]);
    const players = ref([]);
    const roomData = ref(null);

    // Current Word Data
    const currentWord = ref('');

    // Player Identity
    const playerId = ref('');
    const playerName = ref('');

    // Round Control
    const roundStatus = ref('notStarted');  // 'notStarted' | 'countingDown' | 'inProgress' | 'ended'
    const countdownValue = ref(3);
    const roundTimeLeft = ref(80);
    let countdownInterval = null;
    let roundInterval = null;

    // Drag selection state
    const isDragging = ref(false);
    const selectedCells = ref(new Set());
    const lastCell = ref(null);

    // All valid words at round-end
    const allValidWords = ref([]);
    const totalPossibleScore = ref(0);

    // Socket
    const socket = ref(null);

    // ===================
    // Lifecycle / Setup
    // ===================

    onMounted(() => {
      // Pull player name and ID from cookies or use the router query
      const existingName = getCookie('playerName');
      const existingPlayerId = getCookie('playerId');

      if (existingName) {
        playerName.value = existingName;
      }

      if (existingPlayerId) {
        playerId.value = existingPlayerId;
      } else {
        // Generate a new player ID and store it in cookies
        const newPlayerId = "player-" + Math.random().toString(36).slice(2, 10);
        setCookie('playerId', newPlayerId);
        playerId.value = newPlayerId;
      }

      joinOrCreateRoom();
    });

    watch(roundStatus, (newVal) => {
      // Lock/unlock scroll depending on round status
      if (newVal === 'inProgress') {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'auto';
      }
    });

    // ===================
    // Methods
    // ===================

    const joinOrCreateRoom = async () => {
      if (route.params.roomId) {
        try {
          const response = await axios.post(`${config.apiUrl}/api/rooms/join`, {
            roomId: route.params.roomId,
            playerId: playerId.value,
            playerName: playerName.value
          });
          roomId.value = route.params.roomId;
          board.value = response.data.gameState.board;
          players.value = response.data.players;
          roomData.value = response.data;
          setupSocket();
        } catch (error) {
          // If "Room not found", attempt creation
          if (error.response?.data?.message === "Room not found") {
            try {
              const createResponse = await axios.post(`${config.apiUrl}/api/rooms/create`, {
                roomId: route.params.roomId
              });
              roomId.value = createResponse.data.roomId;
              board.value = createResponse.data.board;
              const joinResponse = await axios.post(`${config.apiUrl}/api/rooms/join`, {
                roomId: route.params.roomId,
                playerId: playerId.value,
                playerName: playerName.value
              });
              players.value = joinResponse.data.players;
              roomData.value = joinResponse.data;
              setupSocket();
            } catch (createError) {
              toast.error("Error creating room: " + createError.response?.data?.message);
              router.push("/");
            }
          } else {
            toast.error(error.response?.data?.message || "Error joining room");
            router.push("/");
          }
        }
      }
    };

  const setupSocket = () => {
    socket.value = io(config.socketUrl);
    socket.value.emit('join-room', roomId.value, playerId.value, route.query.playerName);

    socket.value.on('update-players', (updatedPlayers) => {
      players.value = updatedPlayers;
    });

    socket.value.on('player-joined', (playerName) => {
      toast.success(`${playerName} joined the game!`);
    });

    socket.value.on('update-player', (player) => {
      const index = players.value.findIndex(p => p.playerId === player.playerId);
      if (index !== -1) {
        players.value[index] = player;
      }
    });

    socket.value.on('round-ended', (data) => {
      // Another user ended the round
      handleServerEndRound(data);
    });

    socket.value.on('new-round', (data) => {
      // Another user started a new round
      handleServerNewRound(data);
    });

    socket.value.on('word-result', ({ playerId: updatedPlayerId, isValid, score }) => {
      const playerIndex = players.value.findIndex(p => p.playerId === updatedPlayerId);
      if (playerIndex !== -1) {
        if (isValid) {
          players.value[playerIndex].score += score;
          // Also push the word into wordsFound so we can mark it
          // (the server already does this, but just to keep in sync)
        } else if (updatedPlayerId === playerId.value) {
          toast.error("Invalid word or already found!");
        }
      }
    });
  };

    const initiateCountdown = () => {
      roundStatus.value = 'countingDown';
      countdownValue.value = 3;
      if (countdownInterval) clearInterval(countdownInterval);
      countdownInterval = setInterval(() => {
        countdownValue.value--;
        if (countdownValue.value <= 0) {
          clearInterval(countdownInterval);
          startRound();
        }
      }, 1000);
    };

    const startRound = () => {
      roundStatus.value = 'inProgress';
      roundTimeLeft.value = 80;
      if (roundInterval) clearInterval(roundInterval);

      roundInterval = setInterval(() => {
        roundTimeLeft.value--;
        if (roundTimeLeft.value <= 0) {
          clearInterval(roundInterval);
          endRound(); // auto-end round after 80s
        }
      }, 1000);
    };

    const endRound = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/api/rooms/${roomId.value}/end-round`);
        handleServerEndRound(response.data);
      } catch (error) {
        toast.error('Error ending round');
      }
    };

    const handleServerEndRound = (data) => {
      roundStatus.value = 'ended';
      allValidWords.value = data.allValidWords;
      totalPossibleScore.value = data.totalPossibleScore;
      players.value = data.players; // updated final scores
      clearInterval(roundInterval); 
      clearInterval(countdownInterval); 
      toast.info("Round ended!");
    };

    const startNewRound = async () => {
      try {
        const response = await axios.post(`${config.apiUrl}/api/rooms/${roomId.value}/start-new-round`);
        handleServerNewRound(response.data);
      } catch (error) {
        toast.error('Error starting new round');
      }
    };

    const handleServerNewRound = (data) => {
      board.value = data.board;
      players.value = data.players;
      if (!roomData.value) roomData.value = { gameState: {} };
      roomData.value.gameState.validWords = data.validWords;

      roundStatus.value = 'notStarted';
      allValidWords.value = [];
      totalPossibleScore.value = 0;
      toast.success("New round is ready to start!");
    };

    // ========== Word Submission ==========

    const submitWord = async (word) => {
      if (!word || roundStatus.value !== 'inProgress') return;
      try {
        const response = await axios.post(`${config.apiUrl}/api/rooms/${roomId.value}/submit-word`, {
          playerId: playerId.value,
          word: word,
        });
        if (response.data.isValid) {
          // Update local player's score & found words
          const playerIndex = players.value.findIndex(p => p.playerId === response.data.playerId);
          if (playerIndex !== -1) {
            players.value[playerIndex].score = response.data.updatedScore;
            players.value[playerIndex].wordsFound.push(word.toLowerCase());
          }
        }
      } catch (error) {
        toast.error('Error submitting word');
      }
    };

    const playerFoundWord = (word) => {
      const currentPlayer = players.value.find(p => p.playerId === playerId.value);
      return currentPlayer && currentPlayer.wordsFound.includes(word.toLowerCase());
    };

    const CONFIG = {
      INITIAL_SELECTION_THRESHOLD: 1.0,
      DRAG_SELECTION_THRESHOLD: 0.5,
      CELL_SIZE: 60
    };

    const getCellFromEvent = (event) => {
      const boardEl = event.currentTarget;
      const boardRect = boardEl.getBoundingClientRect();
      let clientX, clientY;

      if (event.type.startsWith('touch')) {
        if (!event.touches[0]) return null;
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }
      
      const relativeX = clientX - boardRect.left;
      const relativeY = clientY - boardRect.top;
      
      const col = Math.floor(relativeX / CONFIG.CELL_SIZE);
      const row = Math.floor(relativeY / CONFIG.CELL_SIZE);
      
      if (row < 0 || row >= 4 || col < 0 || col >= 4) return null;
      
      const cellCenterX = (col + 0.5) * CONFIG.CELL_SIZE;
      const cellCenterY = (row + 0.5) * CONFIG.CELL_SIZE;
      const distanceFromCenter = Math.sqrt(
        Math.pow(relativeX - cellCenterX, 2) + 
        Math.pow(relativeY - cellCenterY, 2)
      );
      
      const threshold = event.type === 'mousedown' || event.type === 'touchstart'
        ? CONFIG.CELL_SIZE * CONFIG.INITIAL_SELECTION_THRESHOLD
        : CONFIG.CELL_SIZE * CONFIG.DRAG_SELECTION_THRESHOLD;
      
      if (distanceFromCenter <= threshold) {
        return { row, col };
      }
      return null;
    };

    const isAdjacent = (cell1, cell2) => {
      if (!cell1 || !cell2) return false;
      const rowDiff = Math.abs(cell1.row - cell2.row);
      const colDiff = Math.abs(cell1.col - cell2.col);
      // Diagonals or orthogonals
      return (rowDiff <= 1 && colDiff <= 1);
    };

    const addToWord = (row, col) => {
      if (row === undefined || col === undefined) return;
      const cellKey = `${row},${col}`;
      if (!selectedCells.value.has(cellKey)) {
        if (!lastCell.value || isAdjacent(lastCell.value, { row, col })) {
          selectedCells.value.add(cellKey);
          lastCell.value = { row, col };
          const newWord = Array.from(selectedCells.value)
            .map(key => {
              const [r, c] = key.split(',').map(Number);
              return board.value[r][c];
            })
            .join('');
          currentWord.value = newWord;
        }
      }
    };

    const handleTouchStart = (event) => {
      isDragging.value = true;
      selectedCells.value.clear();
      currentWord.value = '';
      const cell = getCellFromEvent(event);
      if (cell) addToWord(cell.row, cell.col);
    };

    const handleTouchMove = (event) => {
      if (!isDragging.value) return;
      const cell = getCellFromEvent(event);
      if (cell) addToWord(cell.row, cell.col);
    };

    const handleTouchEnd = () => {
      finalizeSwipe();
    };

    const handleMouseDown = (event) => handleTouchStart(event);
    const handleMouseMove = (event) => handleTouchMove(event);
    const handleMouseUp = () => finalizeSwipe();

    const finalizeSwipe = () => {
      if (currentWord.value && roundStatus.value === 'inProgress') {
        submitWord(currentWord.value);
      }
      isDragging.value = false;
      selectedCells.value.clear();
      currentWord.value = '';
      lastCell.value = null;
    };

    const isSelected = (row, col) => {
      return selectedCells.value.has(`${row},${col}`);
    };

    /**
     * Returns 'valid', 'duplicate', or 'invalid' for the *current* swipe/word.
     */
    const currentSwipeStatus = computed(() => {
      const word = currentWord.value.toUpperCase();
      if (word.length < 3) {
        return 'invalid'; 
      }
      // Is it in the dictionary?
      if (!roomData.value?.gameState?.validWords?.includes(word)) {
        return 'invalid';
      }
      // If the user already found it
      if (playerFoundWord(word)) {
        return 'duplicate';
      }
      // Otherwise it's a valid new word
      return 'valid';
    });

    /**
     * Class for the "cell-highlight" div for each cell that is currently selected.
     * We simply check the computed currentSwipeStatus to decide the color.
     */
    const getCellHighlightClass = (row, col) => {
      if (!isSelected(row, col)) return '';
      if (currentSwipeStatus.value === 'valid') return 'highlight-valid';
      if (currentSwipeStatus.value === 'duplicate') return 'highlight-duplicate';
      // otherwise, 'invalid'
      return 'highlight-invalid';
    };

    /**
     * Also apply a background color to the big "current-word" box
     */
    const highlightClass = computed(() => {
      if (currentSwipeStatus.value === 'valid') return 'valid-word';
      if (currentSwipeStatus.value === 'duplicate') return 'duplicate-word';
      return 'invalid-word';
    });

    // ========== Computed Helpers ==========

    const currentPlayerScore = () => {
      const currentPlayer = players.value.find(p => p.playerId === playerId.value);
      return currentPlayer ? currentPlayer.score : 0;
    };

    // Sort players by score descending
    const sortedPlayers = computed(() => {
      return [...players.value].sort((a, b) => a.score - b.score);
    });

    // Sort valid words by length ascending
    const sortedAllValidWords = computed(() => {
      return [...allValidWords.value].sort((a, b) => b.length - a.length);
    });

    return {
      // Refs
      roomId,
      board,
      players,
      roomData,
      currentWord,
      playerId,
      playerName,
      roundStatus,
      countdownValue,
      roundTimeLeft,
      allValidWords,
      totalPossibleScore,

      // Methods
      initiateCountdown,
      endRound,
      startNewRound,
      currentPlayerScore,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      handleMouseDown,
      handleMouseMove,
      handleMouseUp,
      isSelected,
      getCellHighlightClass,
      playerFoundWord,

      // Computed
      currentSwipeStatus,
      highlightClass,
      sortedPlayers,
      sortedAllValidWords
    };
  }
};
</script>

<style scoped>

.game-room {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

body {
  margin: 0;
  padding: 0;
}

h2 {
  margin-bottom: 20px;
}

.game-board {
  display: inline-block;
  border: 2px solid #333;
  margin-bottom: 20px;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: hidden;
  user-select: none;
  background-color: #fff;
  display: block;
  margin: 0 auto;
  width: fit-content;
}

.board-row {
  display: flex;
}

.board-cell {
  width: 60px;
  height: 60px;
  box-sizing: border-box;
  border: 1px solid #ccc;
  position: relative;
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  line-height: 60px;
  transition: all 0.2s ease;
}

.selected {
  transform: scale(0.98);
}

.cell-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border-radius: 0;
}

.highlight-valid {
  background-color: rgba(76, 175, 80, 0.3);
}

.highlight-duplicate {
  background-color: rgba(255, 235, 59, 0.4);
}

.highlight-invalid {
  background-color: rgba(158, 158, 158, 0.4);
}

.in-round-top-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  min-height: 60px;
}

@media (min-width: 500px) {
  .in-round-top-bar {
    flex-direction: row;
    justify-content: space-around;
  }
}

.score-label, .timer-label {
  font-size: 1.1rem;
  font-weight: bold;
  margin: 10px;
}

.current-word {
  margin: 10px;
  padding: 8px 16px;
  font-size: 1.2rem;
  font-weight: bold;
  min-height: 36px;
  border-radius: 4px;
  transition: background-color 0.3s, color 0.3s;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.valid-word {
  color: #4CAF50;
  background-color: #e8f5e9;
}

.duplicate-word {
  color: #ffca28;
  background-color: #fff8e1;
}

.invalid-word {
  color: #666;
  background-color: #f5f5f5;
}

.button {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 5px;
  font-weight: 600;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.button.primary {
  background-color: #4CAF50;
  color: white;
}

.button.danger {
  background-color: #f44336;
  color: white;
}

.button.success {
  background-color: #2196F3;
  color: white;
}

.player-list {
  margin-top: 20px;
  background-color: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
}

.player-list ul {
  list-style: none;
  padding: 0;
}

.player-list li {
  padding: 10px;
  margin: 5px 0;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.current-player {
  font-weight: bold;
  color: #4CAF50;
  border-left: 4px solid #4CAF50;
  padding-left: 6px;
}

.words-found {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.valid-words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.valid-words-grid span {
  background-color: white;
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-size: 14px;
}

.found-word {
  background-color: #e8f5e9 !important;
  color: #2e7d32;
  font-weight: bold;
}
</style>