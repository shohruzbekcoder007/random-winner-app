const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { setupSocketHandlers } = require('./socket/socketHandler');

// Express ilovasini yaratish
const app = express();

// HTTP server yaratish (Socket.IO uchun)
const server = http.createServer(app);

// Socket.IO sozlash
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Socket.IO ni global qilish (boshqa modullarda ishlatish uchun)
app.set('io', io);

// MongoDB ga ulanish
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (development uchun)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Statik fayllar uchun
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routelar
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/viloyat', require('./routes/viloyatRoutes'));
app.use('/api/tuman', require('./routes/tumanRoutes'));
app.use('/api/ishtirokchi', require('./routes/ishtirokchiRoutes'));
app.use('/api/golib', require('./routes/golibRoutes'));
app.use('/api/random', require('./routes/randomRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Asosiy route
app.get('/', (req, res) => {
  res.json({ message: "Random g'olib tanlash API ishlayapti!" });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Socket.IO event handlerlarini sozlash
setupSocketHandlers(io);

// Unhandled rejection va exception
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err.message);
  process.exit(1);
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlayapti (${process.env.NODE_ENV || 'development'} mode)`);
  console.log('Socket.IO tayyor');
});
