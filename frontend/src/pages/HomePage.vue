<template>
  <div class="home-page">
    <h1>Word Crack</h1>
    <div class="actions">
      <input 
        v-model="playerName" 
        placeholder="Enter your name" 
        class="room-input" 
      />
      <input 
        v-model="gameId" 
        placeholder="Enter game ID" 
        class="room-input"
      />
      <button 
        @click="joinOrCreateGame" 
        class="action-button"
        :disabled="!isFormValid"
      >
        Join/Create Game
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { setCookie, getCookie } from '../utils/cookieUtil.js';
import { useToast } from 'vue-toastification';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const gameId = ref('');
    const playerName = ref('');
    const toast = useToast();

    const isFormValid = computed(() => {
      return playerName.value.trim() && gameId.value.trim();
    });

    onMounted(() => {
      const redirectedGameId = route.query.gameId;
      if (redirectedGameId) {
        gameId.value = redirectedGameId;
      }
      const existingName = getCookie('playerName');
      if (existingName) {
        playerName.value = existingName;
      }
    });

    const joinOrCreateGame = () => {
      if (!isFormValid.value) {
        toast.error('Please fill in both name and game ID.');
        return;
      }
      setCookie('playerName', playerName.value.trim());
      router.push(`/game/${gameId.value.trim()}`);
    };

    return {
      gameId,
      playerName,
      joinOrCreateGame,
      isFormValid
    };
  }
};
</script>

<style scoped>

:root {
  background-color: #f0f0f0;
}

.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 60px auto 0; 
  max-width: 400px;
  padding: 0 20px;
  box-sizing: border-box;
}

h1 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 2.5em;
  color: #333;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.room-input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
  box-sizing: border-box;
}

.action-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;
}

.action-button:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-2px);
}

.action-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
</style>