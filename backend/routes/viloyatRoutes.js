const express = require('express');
const router = express.Router();
const {
  getViloyatlar,
  getViloyat,
  createViloyat,
  updateViloyat,
  deleteViloyat
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

module.exports = router;
