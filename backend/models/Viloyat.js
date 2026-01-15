const mongoose = require('mongoose');

// Viloyat schema
const viloyatSchema = new mongoose.Schema({
  nomi: {
    type: String,
    required: [true, 'Viloyat nomi kiritilishi shart'],
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

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
