const express = require('express');
const router = express.Router();
const {
  getViloyatlar,
  getViloyat,
  createViloyat,
  updateViloyat,
  deleteViloyat,
  toggleActive
} = require('../controllers/viloyatController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Barcha routelar himoyalangan
router.use(protect);

router.route('/')
  .get(getViloyatlar)
  .post(adminOnly, createViloyat);

router.route('/:id')
  .get(getViloyat)
  .put(adminOnly, updateViloyat)
  .delete(adminOnly, deleteViloyat);

// Toggle active - oddiy userlar ham foydalana oladi
router.patch('/:id/toggle-active', toggleActive);

module.exports = router;
