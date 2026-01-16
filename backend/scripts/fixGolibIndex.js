/**
 * Bu skript Golib kolleksiyasidagi noto'g'ri indeksni tuzatadi
 *
 * Ishlatish: node scripts/fixGolibIndex.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const fixIndex = async () => {
  try {
    // MongoDB ga ulanish
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB ga ulandi');

    const db = mongoose.connection.db;
    const collection = db.collection('golibs');

    // 1. Mavjud indekslarni ko'rsatish
    console.log('\nMavjud indekslar:');
    const indexes = await collection.indexes();
    console.log(indexes);

    // 2. ishtirokchi_1 indeksini o'chirish (agar mavjud bo'lsa)
    try {
      await collection.dropIndex('ishtirokchi_1');
      console.log('\nishtirokchi_1 indeksi o\'chirildi');
    } catch (err) {
      if (err.code === 27) {
        console.log('\nishtirokchi_1 indeksi mavjud emas');
      } else {
        throw err;
      }
    }

    // 3. null qiymatli g'oliblarni o'chirish
    const nullResult = await collection.deleteMany({ ishtirokchi: null });
    console.log(`\n${nullResult.deletedCount} ta null ishtirokchili yozuv o'chirildi`);

    // 4. Yangi sparse indeksni yaratish
    await collection.createIndex(
      { ishtirokchi: 1 },
      { unique: true, sparse: true }
    );
    console.log('\nYangi sparse indeks yaratildi');

    // 5. Yangilangan indekslarni ko'rsatish
    console.log('\nYangilangan indekslar:');
    const newIndexes = await collection.indexes();
    console.log(newIndexes);

    console.log('\nIndeks muvaffaqiyatli tuzatildi!');
    process.exit(0);
  } catch (error) {
    console.error('Xato:', error);
    process.exit(1);
  }
};

fixIndex();
