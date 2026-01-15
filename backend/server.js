const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Express ilovasini yaratish
const app = express();

// MongoDB ga ulanish
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Xatolarni ushlab qolish middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server xatosi',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server ${PORT} portda ishlayapti`);
});
