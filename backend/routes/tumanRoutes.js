const express = require('express');
const router = express.Router();
const {
  getTumanlar,
  getTuman,
  createTuman,
  updateTuman,
  deleteTuman,
  toggleActive
} = require('../controllers/tumanController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.route('/')
  .get(getTumanlar)
  .post(adminOnly, createTuman);

router.route('/:id')
  .get(getTuman)
  .put(adminOnly, updateTuman)
  .delete(adminOnly, deleteTuman);

router.patch('/:id/toggle-active', adminOnly, toggleActive);

module.exports = router;
