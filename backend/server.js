const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Express ilovasini yaratish
const app = express();

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
app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlayapti (${process.env.NODE_ENV || 'development'} mode)`);
});
