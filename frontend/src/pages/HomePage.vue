<template>
  <div class="home-page">
    <h1>Word Hunt</h1>
    <div class="actions">
      <button @click="createGameRoom" class="action-button">Create Game Room</button>
      <div class="join-game">
        <input v-model="roomId" placeholder="Enter room ID" class="room-input" />
        <button @click="joinGame" class="action-button">Join Game</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'HomePage',
  setup() {
    const router = useRouter();
    const roomId = ref('');

    const createGameRoom = async () => {
      try {
        console.log('Creating a game room...');
        const response = await axios.post('http://localhost:3000/api/rooms/create');
        console.log('Room created:', response.data);
        const { roomId } = response.data;
        console.log('Navigating to game room:', roomId);
        router.push(`/game/${roomId}`);
      } catch (error) {
        console.error('Error creating room:', error);
        alert('Failed to create a game room. Please try again.');
      }
    };

    const joinGame = () => {
      if (roomId.value) {
        router.push(`/game/${roomId.value}`);
      } else {
        alert('Please enter a room ID to join a game.');
      }
    };

    return {
      roomId,
      createGameRoom,
      joinGame
    };
  }
};
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f0f0f0;
}

h1 {
  font-size: 2.5em;
  color: #333;
  margin-bottom: 2rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.action-button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  color: white;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.action-button:hover {
  background-color: #45a049;
}

.join-game {
  display: flex;
  gap: 0.5rem;
}

.room-input {
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>