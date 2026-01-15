const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT token yaratish
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Foydalanuvchi ro'yxatdan o'tishi
// @route   POST /api/auth/register
// @access  Public (faqat admin yaratish uchun)
const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Foydalanuvchi mavjudligini tekshirish
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Bu foydalanuvchi nomi allaqachon mavjud'
      });
    }

    // Yangi foydalanuvchi yaratish
    const user = await User.create({
      username,
      password,
      role: role || 'user'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Register xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Foydalanuvchi login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Foydalanuvchini topish
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri'
      });
    }

    // Parolni tekshirish
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi nomi yoki parol noto\'g\'ri'
      });
    }

    // Faolligini tekshirish
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Foydalanuvchi faol emas'
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Login xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Joriy foydalanuvchi ma'lumotlari
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('GetMe xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Default admin yaratish (bir martalik)
// @route   POST /api/auth/init-admin
// @access  Public
const initAdmin = async (req, res) => {
  try {
    // Admin mavjudligini tekshirish
    const adminExists = await User.findOne({ role: 'admin' });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        message: 'Admin allaqachon mavjud'
      });
    }

    // Default admin yaratish
    const admin = await User.create({
      username: 'admin',
      password: 'admin123',
      role: 'admin'
    });

    res.status(201).json({
      success: true,
      message: 'Admin yaratildi. Username: admin, Password: admin123',
      data: {
        _id: admin._id,
        username: admin.username,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Init admin xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Barcha foydalanuvchilarni olish
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    console.error('Get users xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Foydalanuvchini o'chirish
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    // Adminni o'chirishga ruxsat yo'q
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Admin foydalanuvchini o\'chirish mumkin emas'
      });
    }

    await user.deleteOne();

    res.json({
      success: true,
      message: 'Foydalanuvchi o\'chirildi'
    });
  } catch (error) {
    console.error('Delete user xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Foydalanuvchi faolligini o'zgartirish
// @route   PATCH /api/auth/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        isActive: user.isActive
      },
      message: user.isActive ? 'Foydalanuvchi faollashtirildi' : 'Foydalanuvchi o\'chirildi'
    });
  } catch (error) {
    console.error('Toggle user active xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

module.exports = {
  register,
  login,
  getMe,
  initAdmin,
  getUsers,
  deleteUser,
  toggleUserActive
};
