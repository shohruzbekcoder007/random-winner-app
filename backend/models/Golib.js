const mongoose = require('mongoose');

// G'olib schema - barcha g'oliblar faqat shu jadvalda saqlanadi
// Ishtirokchi, tuman, viloyat to'liq ma'lumotlari embedded qilingan
const golibSchema = new mongoose.Schema({
  // Ishtirokchi to'liq ma'lumotlari
  ishtirokchi: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    fio: {
      type: String,
      required: true
    },
    telefon: {
      type: String
    },
    manzil: {
      type: String
    }
  },
  // Tuman ma'lumotlari
  tuman: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    nomi: {
      type: String,
      required: true
    },
    soato: {
      type: String
    }
  },
  // Viloyat ma'lumotlari
  viloyat: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    nomi: {
      type: String,
      required: true
    },
    soato: {
      type: String
    }
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
golibSchema.index({ 'ishtirokchi._id': 1 }, { unique: true, sparse: true });

// Tez qidirish uchun indexlar
golibSchema.index({ tanlanganSana: -1 });
golibSchema.index({ 'viloyat._id': 1 });
golibSchema.index({ 'tuman._id': 1 });

module.exports = mongoose.model('Golib', golibSchema);
