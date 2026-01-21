const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');
const Golib = require('../models/Golib');

/**
 * Random g'olib tanlash (async, progress bilan) - OPTIMALLASHTIRILGAN
 * Faol viloyat va tumanlar kam bo'lgani uchun ulardan to'g'ridan-to'g'ri tanlash
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
      const previousWinners = await Golib.find().lean();
      // Eski va yangi schema uchun moslashuvchan
      previousWinnerIds = previousWinners.map(g => {
        // Yangi schema: ishtirokchi = { _id, fio, ... }
        if (g.ishtirokchi && g.ishtirokchi._id) {
          return g.ishtirokchi._id;
        }
        // Eski schema: ishtirokchi = ObjectId
        return g.ishtirokchi;
      }).filter(Boolean);
    }

    // 2-QADAM: Faol viloyatlarni olish (to'g'ridan-to'g'ri)
    onProgress({
      step: 2,
      totalSteps: 6,
      message: 'Faol viloyatlar olinmoqda...',
      percent: 15
    });

    const faolViloyatlar = await Viloyat.find({ isActive: true }).lean();

    if (faolViloyatlar.length === 0) {
      return {
        success: false,
        message: 'Faol viloyat topilmadi'
      };
    }

    // 3-QADAM: Random viloyat tanlash
    onProgress({
      step: 3,
      totalSteps: 6,
      message: 'Viloyat tanlanmoqda...',
      percent: 30
    });

    // Viloyatlarni aralashtirish va birini tanlash
    const shuffledViloyatlar = faolViloyatlar.sort(() => Math.random() - 0.5);
    let selectedViloyat = null;
    let selectedTuman = null;
    let selectedIshtirokchi = null;

    // Viloyatlarni ketma-ket tekshirish - ishtirokchisi bor viloyatni topish
    for (const viloyat of shuffledViloyatlar) {
      // Bu viloyatdagi faol tumanlarni olish
      const faolTumanlar = await Tuman.find({
        viloyat: viloyat._id,
        isActive: true
      }).lean();

      if (faolTumanlar.length === 0) continue;

      // Tumanlarni aralashtirish
      const shuffledTumanlar = faolTumanlar.sort(() => Math.random() - 0.5);

      // Tumanlarni tekshirish - ishtirokchisi bor tumanni topish
      for (const tuman of shuffledTumanlar) {
        // Bu tumandagi ishtirokchini random tanlash
        const ishtirokchiMatch = {
          tuman: tuman._id,
          isActive: true
        };

        if (excludePreviousWinners && previousWinnerIds.length > 0) {
          ishtirokchiMatch._id = { $nin: previousWinnerIds };
        }

        // $sample bilan random ishtirokchi olish
        const randomIshtirokchi = await Ishtirokchi.aggregate([
          { $match: ishtirokchiMatch },
          { $sample: { size: 1 } }
        ]);

        if (randomIshtirokchi.length > 0) {
          selectedViloyat = viloyat;
          selectedTuman = tuman;
          selectedIshtirokchi = randomIshtirokchi[0];
          break;
        }
      }

      if (selectedIshtirokchi) break;
    }

    if (!selectedIshtirokchi) {
      return {
        success: false,
        message: 'Tanlanishi mumkin bo\'lgan ishtirokchi topilmadi. ' +
          (excludePreviousWinners ? 'Barcha ishtirokchilar allaqachon g\'olib bo\'lgan.' : '')
      };
    }

    const selectedViloyatId = selectedViloyat._id;
    const selectedViloyatNomi = selectedViloyat.nomi;
    const selectedTumanId = selectedTuman._id;
    const selectedTumanNomi = selectedTuman.nomi;

    onProgress({
      step: 3,
      totalSteps: 6,
      message: `Viloyat tanlandi: ${selectedViloyatNomi}`,
      percent: 45,
      viloyat: selectedViloyatNomi
    });

    // Viloyat tanlangandan keyin 5 sekund kutish
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 4-QADAM: Tuman tanlandi
    onProgress({
      step: 4,
      totalSteps: 6,
      message: `Tuman tanlandi: ${selectedTumanNomi}`,
      percent: 70,
      viloyat: selectedViloyatNomi,
      tuman: selectedTumanNomi
    });

    // Tuman tanlangandan keyin 5 sekund kutish
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 5-QADAM: Ishtirokchi tanlandi
    onProgress({
      step: 5,
      totalSteps: 6,
      message: 'G\'olib tanlandi!',
      percent: 85
    });

    // 6-QADAM: G'oliblar jadvaliga yozish
    onProgress({
      step: 6,
      totalSteps: 6,
      message: 'Natija saqlanmoqda...',
      percent: 95
    });

    // G'oliblar jadvaliga yozish - selectedViloyat va selectedTuman dan ma'lumotlar olish
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
        soato: selectedTuman.soato || null
      },
      viloyat: {
        _id: selectedViloyatId,
        nomi: selectedViloyatNomi,
        soato: selectedViloyat.soato || null
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
          jami_viloyatlar: faolViloyatlar.length
        }
      }
    };
  } catch (error) {
    console.error('Random worker xatosi:', error);
    throw error;
  }
};

module.exports = { selectRandomWinnerAsync };
