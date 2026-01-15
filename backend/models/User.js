const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Foydalanuvchi schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Foydalanuvchi nomi kiritilishi shart'],
    unique: true,
    trim: true,
    minlength: [3, 'Foydalanuvchi nomi kamida 3 ta belgidan iborat bolishi kerak']
  },
  password: {
    type: String,
    required: [true, 'Parol kiritilishi shart'],
    minlength: [6, 'Parol kamida 6 ta belgidan iborat bolishi kerak']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Parolni saqlashdan oldin hash qilish
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Parolni tekshirish metodi
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
