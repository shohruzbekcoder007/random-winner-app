const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { selectRandomWinnerAsync } = require('./randomWorker');

// Aktiv tanlovlar (bir vaqtda bir nechta tanlash oldini olish)
const activeSelections = new Map();

// Socket autentifikatsiya middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Avtorizatsiya talab qilinadi'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      return next(new Error('Foydalanuvchi topilmadi yoki faol emas'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Noto\'g\'ri token'));
  }
};

// Socket event handlerlarini sozlash
const setupSocketHandlers = (io) => {
  // Autentifikatsiya middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`Foydalanuvchi ulandi: ${socket.user.username} (${socket.id})`);

    // Foydalanuvchini o'z room ga qo'shish
    socket.join(`user:${socket.user._id}`);

    // Agar admin bo'lsa, admin room ga ham qo'shish
    if (socket.user.role === 'admin') {
      socket.join('admins');
    }

    // Random g'olib tanlash so'rovi
    socket.on('random:select', async (data) => {
      const userId = socket.user._id.toString();

      // Agar allaqachon tanlash jarayonida bo'lsa
      if (activeSelections.has(userId)) {
        socket.emit('random:error', {
          message: 'Tanlash jarayoni davom etmoqda. Iltimos kuting.'
        });
        return;
      }

      try {
        // Tanlashni boshlash
        activeSelections.set(userId, true);

        socket.emit('random:started', {
          message: 'G\'olib tanlash boshlandi...'
        });

        // Progress callback
        const onProgress = (progress) => {
          socket.emit('random:progress', progress);
        };

        // Random tanlash (async worker)
        const result = await selectRandomWinnerAsync(
          data?.excludePreviousWinners !== false,
          onProgress
        );

        if (result.success) {
          // Muvaffaqiyatli natija
          socket.emit('random:completed', result);

          // Barcha ulangan foydalanuvchilarga xabar berish
          io.emit('random:newWinner', {
            message: 'Yangi g\'olib tanlandi!',
            golib: result.data.golib
          });
        } else {
          socket.emit('random:error', {
            message: result.message
          });
        }
      } catch (error) {
        console.error('Random select xatosi:', error);
        socket.emit('random:error', {
          message: error.message || 'G\'olib tanlashda xato yuz berdi'
        });
      } finally {
        activeSelections.delete(userId);
      }
    });

    // Tanlash jarayonini bekor qilish
    socket.on('random:cancel', () => {
      const userId = socket.user._id.toString();
      if (activeSelections.has(userId)) {
        activeSelections.delete(userId);
        socket.emit('random:cancelled', {
          message: 'Tanlash bekor qilindi'
        });
      }
    });

    // Ulanish uzilganda
    socket.on('disconnect', (reason) => {
      console.log(`Foydalanuvchi uzildi: ${socket.user.username} (${reason})`);
      const userId = socket.user._id.toString();
      activeSelections.delete(userId);
    });

    // Xato
    socket.on('error', (error) => {
      console.error('Socket xatosi:', error);
    });
  });

  console.log('Socket handlerlar sozlandi');
};

module.exports = { setupSocketHandlers };
