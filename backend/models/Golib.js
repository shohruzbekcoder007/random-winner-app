const mongoose = require('mongoose');

// G'olib schema
const golibSchema = new mongoose.Schema({
  viloyat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Viloyat',
    required: true
  },
  tuman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tuman',
    required: true
  },
  ishtirokchi: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ishtirokchi',
    required: true
  },
  tanlanganSana: {
    type: Date,
    default: Date.now
  },
  // Qo'shimcha ma'lumotlar - tanlangan paytdagi holatni saqlash
  viloyatNomi: {
    type: String,
    required: true
  },
  tumanNomi: {
    type: String,
    required: true
  },
  ishtirokchiFio: {
    type: String,
    required: true
  },
  ishtirokchiTelefon: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Golib', golibSchema);
