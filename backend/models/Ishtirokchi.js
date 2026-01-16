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
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

ishtirokchiSchema.index({ isActive: 1 });
ishtirokchiSchema.index({ tuman: 1, isActive: 1 });

module.exports = mongoose.model('Ishtirokchi', ishtirokchiSchema);
