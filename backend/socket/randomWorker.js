const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');
const Golib = require('../models/Golib');

/**
 * Random g'olib tanlash (async, progress bilan)
 * @param {boolean} excludePreviousWinners - Avvalgi g'oliblarni chiqarib tashlash
 * @param {function} onProgress - Progress callback funksiyasi
 * @returns {Promise<object>} Natija
 */
const selectRandomWinnerAsync = async (excludePreviousWinners = true, onProgress = () => {}) => {
  try {
    // 1-QADAM: Avvalgi g'oliblar ro'yxatini olish
    onProgress({
      step: 1,
      totalSteps: 6,
      message: 'Avvalgi g\'oliblar tekshirilmoqda...',
      percent: 5
    });

    let previousWinnerIds = [];
    if (excludePreviousWinners) {
      const previousWinners = await Golib.find().select('ishtirokchi._id');
      previousWinnerIds = previousWinners.map(g => g.ishtirokchi._id);
    }

    // 2-QADAM: Ishtirokchi filter
    onProgress({
      step: 2,
      totalSteps: 6,
      message: 'Viloyatlar aniqlanmoqda...',
      percent: 15
    });

    const ishtirokchiMatch = {
      isActive: true
    };
    if (excludePreviousWinners && previousWinnerIds.length > 0) {
      ishtirokchiMatch._id = { $nin: previousWinnerIds };
    }

    // Faol ishtirokchilari bor viloyatlarni topish
    const viloyatStats = await Ishtirokchi.aggregate([
      { $match: ishtirokchiMatch },
      {
        $lookup: {
          from: 'tumen',
          localField: 'tuman',
          foreignField: '_id',
          as: 'tumanInfo'
        }
      },
      { $unwind: '$tumanInfo' },
      { $match: { 'tumanInfo.isActive': true } },
      {
        $lookup: {
          from: 'viloyats',
          localField: 'tumanInfo.viloyat',
          foreignField: '_id',
          as: 'viloyatInfo'
        }
      },
      { $unwind: '$viloyatInfo' },
      { $match: { 'viloyatInfo.isActive': true } },
      {
        $group: {
          _id: '$viloyatInfo._id',
          viloyatNomi: { $first: '$viloyatInfo.nomi' },
          ishtirokchilarSoni: { $sum: 1 }
        }
      }
    ]);

    if (viloyatStats.length === 0) {
      return {
        success: false,
        message: 'Tanlanishi mumkin bo\'lgan ishtirokchi topilmadi. ' +
          (excludePreviousWinners ? 'Barcha ishtirokchilar allaqachon g\'olib bo\'lgan.' : '')
      };
    }

    // 3-QADAM: Random viloyat tanlash
    onProgress({
      step: 3,
      totalSteps: 6,
      message: 'Viloyat tanlanmoqda...',
      percent: 35
    });

    const totalIshtirokchilar = viloyatStats.reduce((sum, v) => sum + v.ishtirokchilarSoni, 0);
    let randomIndex = Math.floor(Math.random() * totalIshtirokchilar);

    let selectedViloyatId = null;
    let selectedViloyatNomi = null;

    for (const viloyat of viloyatStats) {
      randomIndex -= viloyat.ishtirokchilarSoni;
      if (randomIndex < 0) {
        selectedViloyatId = viloyat._id;
        selectedViloyatNomi = viloyat.viloyatNomi;
        break;
      }
    }

    onProgress({
      step: 3,
      totalSteps: 6,
      message: `Viloyat tanlandi: ${selectedViloyatNomi}`,
      percent: 45,
      viloyat: selectedViloyatNomi
    });

    // 4-QADAM: Tanlangan viloyatdagi faol tumanlarni topish
    onProgress({
      step: 4,
      totalSteps: 6,
      message: 'Tuman tanlanmoqda...',
      percent: 55
    });

    const tumanStats = await Ishtirokchi.aggregate([
      { $match: ishtirokchiMatch },
      {
        $lookup: {
          from: 'tumen',
          localField: 'tuman',
          foreignField: '_id',
          as: 'tumanInfo'
        }
      },
      { $unwind: '$tumanInfo' },
      {
        $match: {
          'tumanInfo.isActive': true,
          'tumanInfo.viloyat': selectedViloyatId
        }
      },
      {
        $group: {
          _id: '$tumanInfo._id',
          tumanNomi: { $first: '$tumanInfo.nomi' },
          ishtirokchilarSoni: { $sum: 1 }
        }
      }
    ]);

    if (tumanStats.length === 0) {
      return {
        success: false,
        message: 'Tanlangan viloyatda faol tuman topilmadi'
      };
    }

    // Random tuman tanlash
    const totalTumanIshtirokchilar = tumanStats.reduce((sum, t) => sum + t.ishtirokchilarSoni, 0);
    let tumanRandomIndex = Math.floor(Math.random() * totalTumanIshtirokchilar);

    let selectedTumanId = null;
    let selectedTumanNomi = null;

    for (const tuman of tumanStats) {
      tumanRandomIndex -= tuman.ishtirokchilarSoni;
      if (tumanRandomIndex < 0) {
        selectedTumanId = tuman._id;
        selectedTumanNomi = tuman.tumanNomi;
        break;
      }
    }

    onProgress({
      step: 4,
      totalSteps: 6,
      message: `Tuman tanlandi: ${selectedTumanNomi}`,
      percent: 70,
      viloyat: selectedViloyatNomi,
      tuman: selectedTumanNomi
    });

    // 5-QADAM: Random ishtirokchi tanlash
    onProgress({
      step: 5,
      totalSteps: 6,
      message: 'G\'olib tanlanmoqda...',
      percent: 85
    });

    const randomIshtirokchi = await Ishtirokchi.aggregate([
      {
        $match: {
          ...ishtirokchiMatch,
          tuman: selectedTumanId
        }
      },
      { $sample: { size: 1 } }
    ]);

    if (randomIshtirokchi.length === 0) {
      return {
        success: false,
        message: 'Tanlangan tumanda ishtirokchi topilmadi'
      };
    }

    const selectedIshtirokchi = randomIshtirokchi[0];

    // 6-QADAM: G'oliblar jadvaliga yozish
    onProgress({
      step: 6,
      totalSteps: 6,
      message: 'Natija saqlanmoqda...',
      percent: 95
    });

    // Viloyat va Tuman to'liq ma'lumotlarini olish
    const viloyatData = await Viloyat.findById(selectedViloyatId);
    const tumanData = await Tuman.findById(selectedTumanId);

    const golib = await Golib.create({
      ishtirokchi: {
        _id: selectedIshtirokchi._id,
        fio: selectedIshtirokchi.fio,
        telefon: selectedIshtirokchi.telefon || null,
        manzil: selectedIshtirokchi.manzil || null
      },
      tuman: {
        _id: selectedTumanId,
        nomi: selectedTumanNomi,
        soato: tumanData?.soato || null
      },
      viloyat: {
        _id: selectedViloyatId,
        nomi: selectedViloyatNomi,
        soato: viloyatData?.soato || null
      }
    });

    onProgress({
      step: 6,
      totalSteps: 6,
      message: 'G\'olib muvaffaqiyatli tanlandi!',
      percent: 100
    });

    // Natijani qaytarish - to'liq embedded ma'lumotlar
    return {
      success: true,
      message: 'G\'olib muvaffaqiyatli tanlandi!',
      data: {
        golib: {
          _id: golib._id,
          viloyat: golib.viloyat,
          tuman: golib.tuman,
          ishtirokchi: golib.ishtirokchi,
          tanlanganSana: golib.tanlanganSana
        },
        stats: {
          jami_viloyatlar: viloyatStats.length,
          jami_tumanlar: tumanStats.length,
          jami_ishtirokchilar: totalIshtirokchilar
        }
      }
    };
  } catch (error) {
    console.error('Random worker xatosi:', error);
    throw error;
  }
};

module.exports = { selectRandomWinnerAsync };
