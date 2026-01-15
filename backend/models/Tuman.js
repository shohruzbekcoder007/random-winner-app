const mongoose = require('mongoose');

// Tuman schema
const tumanSchema = new mongoose.Schema({
  nomi: {
    type: String,
    required: [true, 'Tuman nomi kiritilishi shart'],
    trim: true
  },
  viloyat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Viloyat',
    required: [true, 'Viloyat tanlanishi shart']
  },
  isActive: {
    type: Boolean,
    default: true  // true = ishtirok etadi, false = ishtirok etmaydi
  }
}, {
  timestamps: true
});

// Bir viloyatda bir xil nomli tuman bo'lmasligi uchun
tumanSchema.index({ nomi: 1, viloyat: 1 }, { unique: true });

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
