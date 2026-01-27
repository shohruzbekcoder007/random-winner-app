const express = require('express');
const router = express.Router();
const {
  getTumanlar,
  getTuman,
  createTuman,
  updateTuman,
  deleteTuman,
  toggleActive,
  bulkToggleActive
} = require('../controllers/tumanController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.route('/')
  .get(getTumanlar)
  .post(adminOnly, createTuman);

// Bulk toggle - oddiy userlar ham foydalana oladi
router.patch('/bulk-toggle', bulkToggleActive);

router.route('/:id')
  .get(getTuman)
  .put(adminOnly, updateTuman)
  .delete(adminOnly, deleteTuman);

// Toggle active - oddiy userlar ham foydalana oladi
router.patch('/:id/toggle-active', toggleActive);

module.exports = router;
