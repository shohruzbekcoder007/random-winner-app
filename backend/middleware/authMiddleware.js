const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT tokenni tekshirish middleware
const protect = async (req, res, next) => {
  let token;

  // Authorization headerdan tokenni olish
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Tokenni ajratib olish
      token = req.headers.authorization.split(' ')[1];

      // Tokenni verify qilish
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Foydalanuvchini topish (parolsiz)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Foydalanuvchi topilmadi'
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Foydalanuvchi faol emas'
        });
      }

      next();
    } catch (error) {
      console.error('Auth middleware xatosi:', error);
      return res.status(401).json({
        success: false,
        message: 'Token yaroqsiz'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Avtorizatsiya talab qilinadi'
    });
  }
};

// Faqat admin uchun middleware
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Faqat admin uchun ruxsat berilgan'
    });
  }
};

module.exports = { protect, adminOnly };
