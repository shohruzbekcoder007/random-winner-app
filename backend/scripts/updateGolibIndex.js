/**
 * Golib jadvalidagi eski indexni o'chirib, yangi embedded field uchun index yaratish
 * ishtirokchi -> ishtirokchi._id
 */

const mongoose = require('mongoose');
require('dotenv').config();

const updateGolibIndex = async () => {
  try {
    console.log('MongoDB ga ulanmoqda...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB ulandi');

    const db = mongoose.connection.db;
    const collection = db.collection('golibs');

    // Mavjud indexlarni ko'rish
    console.log('\nMavjud indexlar:');
    const indexes = await collection.indexes();
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    // Eski indexni o'chirish (agar mavjud bo'lsa)
    try {
      await collection.dropIndex('ishtirokchi_1');
      console.log('\n✓ Eski "ishtirokchi_1" index o\'chirildi');
    } catch (err) {
      if (err.code === 27) {
        console.log('\n⚠ "ishtirokchi_1" index mavjud emas');
      } else {
        throw err;
      }
    }

    // Yangi indexni yaratish
    try {
      await collection.createIndex(
        { 'ishtirokchi._id': 1 },
        { unique: true, sparse: true }
      );
      console.log('✓ Yangi "ishtirokchi._id_1" index yaratildi');
    } catch (err) {
      if (err.code === 85) {
        console.log('⚠ "ishtirokchi._id_1" index allaqachon mavjud');
      } else {
        throw err;
      }
    }

    // Yangi indexlarni ko'rish
    console.log('\nYangilangan indexlar:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n✓ Index yangilash tugadi');
    process.exit(0);
  } catch (error) {
    console.error('Xato:', error.message);
    process.exit(1);
  }
};

updateGolibIndex();
