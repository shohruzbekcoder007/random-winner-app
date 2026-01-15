const express = require('express');
const router = express.Router();
const {
  selectRandomWinner,
  getSelectionStats,
  resetAllWinners,
  debugStats
} = require('../controllers/randomController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.post('/select', selectRandomWinner);
router.get('/stats', getSelectionStats);
router.get('/debug', debugStats);
router.post('/reset-all-winners', adminOnly, resetAllWinners);

module.exports = router;
