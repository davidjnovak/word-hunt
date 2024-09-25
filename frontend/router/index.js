import { createRouter, createWebHistory } from 'vue-router';
import Home from '../src/pages/Home.vue';
import GameRoom from '../src/pages/GameRoom.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/game/:roomId', component: GameRoom },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
