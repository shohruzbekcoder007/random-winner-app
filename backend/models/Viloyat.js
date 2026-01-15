const mongoose = require('mongoose');

// Viloyat schema
const viloyatSchema = new mongoose.Schema({
  nomi: {
    type: String,
    required: [true, 'Viloyat nomi kiritilishi shart'],
    unique: true,
    trim: true
  },
  soato: {
    type: String,
    required: [true, 'SOATO kodi kiritilishi shart'],
    unique: true,
    trim: true,
    match: [/^\d{4}$/, 'SOATO kodi 4 raqamdan iborat bo\'lishi kerak (masalan: 1703)']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// SOATO bo'yicha index
viloyatSchema.index({ soato: 1 });

// Virtual field - viloyatga tegishli tumanlar soni
viloyatSchema.virtual('tumanlarSoni', {
  ref: 'Tuman',
  localField: '_id',
  foreignField: 'viloyat',
  count: true
});

// JSON ga o'zgartirganda virtual fieldlarni ham qo'shish
viloyatSchema.set('toJSON', { virtuals: true });
viloyatSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Viloyat', viloyatSchema);
