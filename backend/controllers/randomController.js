const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');
const Golib = require('../models/Golib');

// Adolatli random tanlash uchun Fisher-Yates shuffle
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Random element tanlash
const getRandomElement = (array) => {
  if (array.length === 0) return null;
  const shuffled = shuffleArray(array);
  return shuffled[0];
};

// @desc    Random g'olib tanlash
// @route   POST /api/random/select
// @access  Private
const selectRandomWinner = async (req, res) => {
  try {
    const { excludePreviousWinners = true } = req.body;

    // 1-QADAM: Faol viloyatlarni olish
    // Faqat faol tumanlar va ishtirokchilari bor viloyatlarni tanlash
    const viloyatlar = await Viloyat.find({ isActive: true });

    if (viloyatlar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faol viloyat topilmadi'
      });
    }

    // Viloyatlarni ishtirokchilari bor yoki yo'qligini tekshirish
    const eligibleViloyatlar = [];

    for (const viloyat of viloyatlar) {
      // Viloyatda faol tumanlar bor-yo'qligini tekshirish
      const faolTumanlar = await Tuman.find({
        viloyat: viloyat._id,
        isActive: true
      });

      if (faolTumanlar.length === 0) continue;

      // Har bir tumanda faol ishtirokchilar bor-yo'qligini tekshirish
      let hasEligibleIshtirokchi = false;

      for (const tuman of faolTumanlar) {
        const ishtirokchiQuery = {
          tuman: tuman._id,
          isActive: true
        };

        // Oldingi g'oliblarni chiqarib tashlash
        if (excludePreviousWinners) {
          ishtirokchiQuery.isWinner = false;
        }

        const count = await Ishtirokchi.countDocuments(ishtirokchiQuery);
        if (count > 0) {
          hasEligibleIshtirokchi = true;
          break;
        }
      }

      if (hasEligibleIshtirokchi) {
        eligibleViloyatlar.push(viloyat);
      }
    }

    if (eligibleViloyatlar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tanlanishi mumkin bo\'lgan ishtirokchi topilmadi. ' +
          (excludePreviousWinners ? 'Barcha ishtirokchilar allaqachon g\'olib bo\'lgan.' : '')
      });
    }

    // 2-QADAM: Random viloyat tanlash
    const selectedViloyat = getRandomElement(eligibleViloyatlar);

    // 3-QADAM: Tanlangan viloyatdan faol tumanlarni olish
    const faolTumanlar = await Tuman.find({
      viloyat: selectedViloyat._id,
      isActive: true
    });

    // Ishtirokchilari bor tumanlarni filtrlash
    const eligibleTumanlar = [];

    for (const tuman of faolTumanlar) {
      const ishtirokchiQuery = {
        tuman: tuman._id,
        isActive: true
      };

      if (excludePreviousWinners) {
        ishtirokchiQuery.isWinner = false;
      }

      const count = await Ishtirokchi.countDocuments(ishtirokchiQuery);
      if (count > 0) {
        eligibleTumanlar.push(tuman);
      }
    }

    if (eligibleTumanlar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tanlangan viloyatda faol tuman topilmadi'
      });
    }

    // 4-QADAM: Random tuman tanlash
    const selectedTuman = getRandomElement(eligibleTumanlar);

    // 5-QADAM: Tanlangan tumandan ishtirokchilarni olish
    const ishtirokchiQuery = {
      tuman: selectedTuman._id,
      isActive: true
    };

    if (excludePreviousWinners) {
      ishtirokchiQuery.isWinner = false;
    }

    const ishtirokchilar = await Ishtirokchi.find(ishtirokchiQuery);

    if (ishtirokchilar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tanlangan tumanda ishtirokchi topilmadi'
      });
    }

    // 6-QADAM: Random ishtirokchi tanlash
    const selectedIshtirokchi = getRandomElement(ishtirokchilar);

    // 7-QADAM: Ishtirokchini g'olib sifatida belgilash
    selectedIshtirokchi.isWinner = true;
    await selectedIshtirokchi.save();

    // 8-QADAM: G'oliblar ro'yxatiga qo'shish
    const golib = await Golib.create({
      viloyat: selectedViloyat._id,
      tuman: selectedTuman._id,
      ishtirokchi: selectedIshtirokchi._id,
      viloyatNomi: selectedViloyat.nomi,
      tumanNomi: selectedTuman.nomi,
      ishtirokchiFio: selectedIshtirokchi.fio,
      ishtirokchiTelefon: selectedIshtirokchi.telefon
    });

    // Natijani qaytarish
    res.status(201).json({
      success: true,
      message: 'G\'olib muvaffaqiyatli tanlandi!',
      data: {
        golib: {
          _id: golib._id,
          viloyat: {
            _id: selectedViloyat._id,
            nomi: selectedViloyat.nomi
          },
          tuman: {
            _id: selectedTuman._id,
            nomi: selectedTuman.nomi
          },
          ishtirokchi: {
            _id: selectedIshtirokchi._id,
            fio: selectedIshtirokchi.fio,
            telefon: selectedIshtirokchi.telefon
          },
          tanlanganSana: golib.tanlanganSana
        },
        stats: {
          jami_viloyatlar: eligibleViloyatlar.length,
          jami_tumanlar: eligibleTumanlar.length,
          jami_ishtirokchilar: ishtirokchilar.length
        }
      }
    });
  } catch (error) {
    console.error('Random select xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'G\'olib tanlashda xato yuz berdi',
      error: error.message
    });
  }
};

// @desc    Tanlash uchun statistika
// @route   GET /api/random/stats
// @access  Private
const getSelectionStats = async (req, res) => {
  try {
    const { excludePreviousWinners = true } = req.query;
    const exclude = excludePreviousWinners === 'true' || excludePreviousWinners === true;

    // Faol viloyatlar
    const faolViloyatlar = await Viloyat.countDocuments({ isActive: true });

    // Faol tumanlar
    const faolTumanlar = await Tuman.countDocuments({ isActive: true });

    // Ishtirokchilar
    const ishtirokchiQuery = { isActive: true };
    if (exclude) {
      ishtirokchiQuery.isWinner = false;
    }

    const tanlanishiMumkin = await Ishtirokchi.countDocuments(ishtirokchiQuery);
    const jamiIshtirokchilar = await Ishtirokchi.countDocuments({ isActive: true });
    const goliblar = await Ishtirokchi.countDocuments({ isWinner: true });

    // Viloyat bo'yicha statistika
    const viloyatStats = await Viloyat.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'tumans',
          localField: '_id',
          foreignField: 'viloyat',
          as: 'tumanlar',
          pipeline: [{ $match: { isActive: true } }]
        }
      },
      {
        $project: {
          nomi: 1,
          tumanlarSoni: { $size: '$tumanlar' }
        }
      },
      { $sort: { nomi: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        faolViloyatlar,
        faolTumanlar,
        jamiIshtirokchilar,
        tanlanishiMumkin,
        goliblar,
        viloyatStats
      }
    });
  } catch (error) {
    console.error('Get selection stats xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Barcha g'olib statuslarini bekor qilish
// @route   POST /api/random/reset-all-winners
// @access  Private/Admin
const resetAllWinners = async (req, res) => {
  try {
    const result = await Ishtirokchi.updateMany(
      { isWinner: true },
      { isWinner: false }
    );

    res.json({
      success: true,
      message: `${result.modifiedCount} ta ishtirokchining g'olib statusi bekor qilindi`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('Reset all winners xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

module.exports = {
  selectRandomWinner,
  getSelectionStats,
  resetAllWinners
};
