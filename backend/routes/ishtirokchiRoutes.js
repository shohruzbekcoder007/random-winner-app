const express = require('express');
const router = express.Router();
const {
  getIshtirokchilar,
  getIshtirokchi,
  createIshtirokchi,
  updateIshtirokchi,
  deleteIshtirokchi,
  resetWinnerStatus
} = require('../controllers/ishtirokchiController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.route('/')
  .get(getIshtirokchilar)
  .post(adminOnly, createIshtirokchi);

router.route('/:id')
  .get(getIshtirokchi)
  .put(adminOnly, updateIshtirokchi)
  .delete(adminOnly, deleteIshtirokchi);

router.patch('/:id/reset-winner', adminOnly, resetWinnerStatus);

module.exports = router;
