<template>
  <div>
    <h1>Welcome to Word Hunt</h1>
    <button @click="createGameRoom">Create Game Room</button>
    <input v-model="roomLink" placeholder="Enter room link" />
    <button @click="joinGame">Join Game</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const roomLink = ref('');
const router = useRouter();

const createGameRoom = async () => {
  const response = await axios.post('http://localhost:3000/api/rooms/create');
  const { roomId } = response.data;
  router.push(`/game/${roomId}`);
};

const joinGame = () => {
  router.push(`/game/${roomLink.value}`);
};
</script>
