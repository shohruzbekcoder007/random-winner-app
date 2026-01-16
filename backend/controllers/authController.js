const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { catchAsync, AppError } = require('../middleware/errorHandler');

// JWT token yaratish
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Foydalanuvchi ro'yxatdan o'tishi
// @route   POST /api/auth/register
// @access  Public (faqat admin yaratish uchun)
const register = catchAsync(async (req, res, next) => {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return next(new AppError('Foydalanuvchi nomi va parol kiritilishi shart', 400));
  }

  // Foydalanuvchi mavjudligini tekshirish
  const userExists = await User.findOne({ username });
  if (userExists) {
    return next(new AppError('Bu foydalanuvchi nomi allaqachon mavjud', 400));
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
});

// @desc    Foydalanuvchi login
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new AppError('Foydalanuvchi nomi va parol kiritilishi shart', 400));
  }

  // Foydalanuvchini topish
  const user = await User.findOne({ username });

  if (!user) {
    return next(new AppError('Foydalanuvchi nomi yoki parol noto\'g\'ri', 401));
  }

  // Parolni tekshirish
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new AppError('Foydalanuvchi nomi yoki parol noto\'g\'ri', 401));
  }

  // Faolligini tekshirish
  if (!user.isActive) {
    return next(new AppError('Foydalanuvchi faol emas', 401));
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
});

// @desc    Joriy foydalanuvchi ma'lumotlari
// @route   GET /api/auth/me
// @access  Private
const getMe = catchAsync(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json({
    success: true,
    data: user
  });
});

// @desc    Default admin yaratish (bir martalik)
// @route   POST /api/auth/init-admin
// @access  Public
const initAdmin = catchAsync(async (req, res, next) => {
  // Admin mavjudligini tekshirish
  const adminExists = await User.findOne({ role: 'admin' });

  if (adminExists) {
    return next(new AppError('Admin allaqachon mavjud', 400));
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
});

// @desc    Barcha foydalanuvchilarni olish
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = catchAsync(async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json({
    success: true,
    count: users.length,
    data: users
  });
});

// @desc    Foydalanuvchini o'chirish
// @route   DELETE /api/auth/users/:id
// @access  Private/Admin
const deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('Foydalanuvchi topilmadi', 404));
  }

  // Adminni o'chirishga ruxsat yo'q
  if (user.role === 'admin') {
    return next(new AppError('Admin foydalanuvchini o\'chirish mumkin emas', 400));
  }

  await user.deleteOne();

  res.json({
    success: true,
    message: 'Foydalanuvchi o\'chirildi'
  });
});

// @desc    Foydalanuvchi faolligini o'zgartirish
// @route   PATCH /api/auth/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('Foydalanuvchi topilmadi', 404));
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
});

module.exports = {
  register,
  login,
  getMe,
  initAdmin,
  getUsers,
  deleteUser,
  toggleUserActive
};
