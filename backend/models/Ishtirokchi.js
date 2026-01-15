const mongoose = require('mongoose');

// Ishtirokchi schema
const ishtirokchiSchema = new mongoose.Schema({
  fio: {
    type: String,
    required: [true, 'FIO kiritilishi shart'],
    trim: true
  },
  tuman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tuman',
    required: [true, 'Tuman tanlanishi shart']
  },
  telefon: {
    type: String,
    trim: true,
    default: ''
  },
  isWinner: {
    type: Boolean,
    default: false  // G'olib bo'lganmi yoki yo'qmi
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// FIO va tuman kombinatsiyasi unique bo'lishi
ishtirokchiSchema.index({ fio: 1, tuman: 1 }, { unique: true });

module.exports = mongoose.model('Ishtirokchi', ishtirokchiSchema);
