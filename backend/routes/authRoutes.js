const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  initAdmin,
  getUsers,
  deleteUser,
  toggleUserActive
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/init-admin', initAdmin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/register', protect, adminOnly, register);

// Admin only routes - foydalanuvchilarni boshqarish
router.get('/users', protect, adminOnly, getUsers);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.patch('/users/:id/toggle-active', protect, adminOnly, toggleUserActive);

module.exports = router;
