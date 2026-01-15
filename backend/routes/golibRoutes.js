const express = require('express');
const router = express.Router();
const {
  getGoliblar,
  getLatestGolib,
  getGolib,
  deleteGolib,
  getStats
} = require('../controllers/golibController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.get('/', getGoliblar);
router.get('/latest', getLatestGolib);
router.get('/stats', getStats);
router.get('/:id', getGolib);
router.delete('/:id', adminOnly, deleteGolib);

module.exports = router;
