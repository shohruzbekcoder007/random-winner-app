const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');
const Golib = require('../models/Golib');

// @desc    Random g'olib tanlash (Optimallashtirilgan - 1M+ ishtirokchi uchun)
// @route   POST /api/random/select
// @access  Private
const selectRandomWinner = async (req, res) => {
  try {
    const { excludePreviousWinners = true } = req.body;

    // Avvalgi g'oliblar ro'yxatini olish (agar excludePreviousWinners = true bo'lsa)
    let previousWinnerIds = [];
    if (excludePreviousWinners) {
      const previousWinners = await Golib.find().select('ishtirokchi');
      previousWinnerIds = previousWinners.map(g => g.ishtirokchi);
    }

    // Ishtirokchi filter
    const ishtirokchiMatch = {
      isActive: true
    };
    if (excludePreviousWinners && previousWinnerIds.length > 0) {
      ishtirokchiMatch._id = { $nin: previousWinnerIds };
    }

    // 1-QADAM: Aggregation bilan faol ishtirokchilari bor viloyatlarni topish
    const viloyatStats = await Ishtirokchi.aggregate([
      { $match: ishtirokchiMatch },
      {
        $lookup: {
          from: 'tumans',
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
      return res.status(400).json({
        success: false,
        message: 'Tanlanishi mumkin bo\'lgan ishtirokchi topilmadi. ' +
          (excludePreviousWinners ? 'Barcha ishtirokchilar allaqachon g\'olib bo\'lgan.' : '')
      });
    }

    // 2-QADAM: Random viloyat tanlash (weighted random - ishtirokchilar soniga qarab)
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

    // 3-QADAM: Tanlangan viloyatdagi faol tumanlarni topish
    const tumanStats = await Ishtirokchi.aggregate([
      { $match: ishtirokchiMatch },
      {
        $lookup: {
          from: 'tumans',
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
      return res.status(400).json({
        success: false,
        message: 'Tanlangan viloyatda faol tuman topilmadi'
      });
    }

    // 4-QADAM: Random tuman tanlash (weighted random)
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

    // 5-QADAM: Random ishtirokchi tanlash - FAQAT BITTA
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
      return res.status(400).json({
        success: false,
        message: 'Tanlangan tumanda ishtirokchi topilmadi'
      });
    }

    const selectedIshtirokchi = randomIshtirokchi[0];

    // 6-QADAM: G'oliblar jadvaliga yozish (faqat Golib jadvaliga)
    const golib = await Golib.create({
      ishtirokchi: selectedIshtirokchi._id,
      tuman: selectedTumanId,
      viloyat: selectedViloyatId
    });

    // Natijani qaytarish
    res.status(201).json({
      success: true,
      message: 'G\'olib muvaffaqiyatli tanlandi!',
      data: {
        golib: {
          _id: golib._id,
          viloyat: {
            _id: selectedViloyatId,
            nomi: selectedViloyatNomi
          },
          tuman: {
            _id: selectedTumanId,
            nomi: selectedTumanNomi
          },
          ishtirokchi: {
            _id: selectedIshtirokchi._id,
            fio: selectedIshtirokchi.fio,
            telefon: selectedIshtirokchi.telefon
          },
          tanlanganSana: golib.tanlanganSana
        },
        stats: {
          jami_viloyatlar: viloyatStats.length,
          jami_tumanlar: tumanStats.length,
          jami_ishtirokchilar: totalIshtirokchilar
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

// @desc    Tanlash uchun statistika (Optimallashtirilgan)
// @route   GET /api/random/stats
// @access  Private
const getSelectionStats = async (req, res) => {
  try {
    const { excludePreviousWinners = true } = req.query;
    const exclude = excludePreviousWinners === 'true' || excludePreviousWinners === true;

    // Avvalgi g'oliblar ro'yxati
    const previousWinners = await Golib.find().select('ishtirokchi');
    const previousWinnerIds = previousWinners.map(g => g.ishtirokchi);

    // Parallel so'rovlar
    const [
      faolViloyatlar,
      faolTumanlar,
      jamiIshtirokchilar,
      goliblarSoni
    ] = await Promise.all([
      Viloyat.countDocuments({ isActive: true }),
      Tuman.countDocuments({ isActive: true }),
      Ishtirokchi.countDocuments({ isActive: true }),
      Golib.countDocuments()
    ]);

    // Tanlanishi mumkin bo'lgan ishtirokchilar
    let tanlanishiMumkin;
    if (exclude && previousWinnerIds.length > 0) {
      tanlanishiMumkin = await Ishtirokchi.countDocuments({
        isActive: true,
        _id: { $nin: previousWinnerIds }
      });
    } else {
      tanlanishiMumkin = jamiIshtirokchilar;
    }

    // Viloyat statistikasi
    const viloyatStats = await Viloyat.aggregate([
      { $match: { isActive: true } },
      {
        $lookup: {
          from: 'tumans',
          let: { viloyatId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$viloyat', '$$viloyatId'] },
                isActive: true
              }
            },
            { $count: 'count' }
          ],
          as: 'tumanlar'
        }
      },
      {
        $project: {
          nomi: 1,
          tumanlarSoni: {
            $ifNull: [{ $arrayElemAt: ['$tumanlar.count', 0] }, 0]
          }
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
        goliblar: goliblarSoni,
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

// @desc    Barcha g'oliblarni o'chirish (Golib jadvalini tozalash)
// @route   POST /api/random/reset-all-winners
// @access  Private/Admin
const resetAllWinners = async (req, res) => {
  try {
    const result = await Golib.deleteMany({});

    res.json({
      success: true,
      message: `${result.deletedCount} ta g'olib yozuvi o'chirildi`,
      data: {
        deletedCount: result.deletedCount
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
