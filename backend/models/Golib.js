const mongoose = require('mongoose');

// G'olib schema - barcha g'oliblar faqat shu jadvalda saqlanadi
const golibSchema = new mongoose.Schema({
  ishtirokchi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ishtirokchi',
    required: true
  },
  tuman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tuman',
    required: true
  },
  viloyat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Viloyat',
    required: true
  },
  tanlanganSana: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Bir ishtirokchi faqat bir marta g'olib bo'lishi mumkin
// sparse: true - null qiymatlarni indeksga qo'shmaydi
golibSchema.index({ ishtirokchi: 1 }, { unique: true, sparse: true });

// Tez qidirish uchun indexlar
golibSchema.index({ tanlanganSana: -1 });
golibSchema.index({ viloyat: 1 });
golibSchema.index({ tuman: 1 });

module.exports = mongoose.model('Golib', golibSchema);
