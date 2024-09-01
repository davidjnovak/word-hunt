import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import GameRoom from '../pages/GameRoom.vue';
import Leaderboard from '../pages/Leaderboard.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/game/:roomId', component: GameRoom },
  { path: '/leaderboard', component: Leaderboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
