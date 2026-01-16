const mongoose = require('mongoose');

// Tuman schema
const tumanSchema = new mongoose.Schema({
  nomi: {
    type: String,
    required: [true, 'Tuman nomi kiritilishi shart'],
    trim: true
  },
  soato: {
    type: String,
    required: [true, 'SOATO kodi kiritilishi shart'],
    unique: true,
    trim: true,
    match: [/^\d{7}$/, 'SOATO kodi 7 raqamdan iborat bo\'lishi kerak (masalan: 1703401)']
  },
  viloyat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Viloyat',
    required: [true, 'Viloyat tanlanishi shart']
  },
  isActive: {
    type: Boolean,
    default: false  // false = ishtirok etmaydi (default), true = ishtirok etadi
  }
}, {
  timestamps: true
});

// Bir viloyatda bir xil nomli tuman bo'lmasligi uchun
tumanSchema.index({ nomi: 1, viloyat: 1 }, { unique: true });

// SOATO bo'yicha index
tumanSchema.index({ soato: 1 });

// Aggregation so'rovlari uchun index
tumanSchema.index({ viloyat: 1, isActive: 1 });

// Virtual field - tumandagi ishtirokchilar soni
tumanSchema.virtual('ishtirokchilarSoni', {
  ref: 'Ishtirokchi',
  localField: '_id',
  foreignField: 'tuman',
  count: true
});

// JSON ga o'zgartirganda virtual fieldlarni ham qo'shish
tumanSchema.set('toJSON', { virtuals: true });
tumanSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Tuman', tumanSchema);
