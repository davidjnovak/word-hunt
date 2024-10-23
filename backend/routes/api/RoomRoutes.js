const express = require('express');
const router = express.Router();
const { createRoom, joinRoom, getRoomState, submitWord, endRound, startNewRound } = require('../../controllers/roomController');

router.post('/create', createRoom);
router.post('/join', joinRoom);
router.get('/:roomId', getRoomState);
router.post('/:roomId/submit-word', submitWord);
router.post('/:roomId/end-round', endRound);
router.post('/:roomId/start-new-round', startNewRound);

module.exports = router;