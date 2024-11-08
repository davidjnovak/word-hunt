<template>
    <div class="player-scores">
      <h3>Player Scores</h3>
      <ul>
        <li v-for="player in players" :key="player.playerId">
          {{ player.name }}: {{ player.score }}
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  export default {
    name: 'PlayerScores',
    props: {
      players: {
        type: Array,
        required: true
      }
    }
  };
  </script>
  
  <style scoped>
  .player-scores {
    margin-top: 20px;
  }
  </style>