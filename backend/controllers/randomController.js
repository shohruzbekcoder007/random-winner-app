const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');
const Golib = require('../models/Golib');

// @desc    Random g'olib tanlash - OPTIMALLASHTIRILGAN (faol viloyat/tuman kam bo'lganda tez ishlaydi)
// @route   POST /api/random/select
// @access  Private
const selectRandomWinner = async (req, res) => {
  try {
    const { excludePreviousWinners = true } = req.body;

    // Avvalgi g'oliblar ro'yxatini olish
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

    // Faol viloyatlarni olish (to'g'ridan-to'g'ri - tez)
    const faolViloyatlar = await Viloyat.find({ isActive: true }).lean();

    if (faolViloyatlar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faol viloyat topilmadi'
      });
    }

    // Viloyatlarni aralashtirish
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

      // Tumanlarni tekshirish
      for (const tuman of shuffledTumanlar) {
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
      return res.status(400).json({
        success: false,
        message: 'Tanlanishi mumkin bo\'lgan ishtirokchi topilmadi. ' +
          (excludePreviousWinners ? 'Barcha ishtirokchilar allaqachon g\'olib bo\'lgan.' : '')
      });
    }

    // G'oliblar jadvaliga yozish
    const golib = await Golib.create({
      ishtirokchi: {
        _id: selectedIshtirokchi._id,
        fio: selectedIshtirokchi.fio,
        telefon: selectedIshtirokchi.telefon || null,
        manzil: selectedIshtirokchi.manzil || null
      },
      tuman: {
        _id: selectedTuman._id,
        nomi: selectedTuman.nomi,
        soato: selectedTuman.soato || null
      },
      viloyat: {
        _id: selectedViloyat._id,
        nomi: selectedViloyat.nomi,
        soato: selectedViloyat.soato || null
      }
    });

    // Natijani qaytarish
    res.status(201).json({
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

    // Avvalgi g'oliblar ro'yxati - eski va yangi schema uchun moslashuvchan
    const previousWinners = await Golib.find().lean();
    const previousWinnerIds = previousWinners.map(g => {
      if (g.ishtirokchi && g.ishtirokchi._id) {
        return g.ishtirokchi._id;
      }
      return g.ishtirokchi;
    }).filter(Boolean);

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
          from: 'tumen',
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

// @desc    Debug - bazadagi ma'lumotlarni tekshirish
// @route   GET /api/random/debug
// @access  Private
const debugStats = async (req, res) => {
  try {
    const mongoose = require('mongoose');

    // Collection nomlarini olish
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Asosiy statistika
    const [
      totalIshtirokchilar,
      faolIshtirokchilar,
      totalTumanlar,
      faolTumanlar,
      totalViloyatlar,
      faolViloyatlar,
      totalGoliblar
    ] = await Promise.all([
      Ishtirokchi.countDocuments(),
      Ishtirokchi.countDocuments({ isActive: true }),
      Tuman.countDocuments(),
      Tuman.countDocuments({ isActive: true }),
      Viloyat.countDocuments(),
      Viloyat.countDocuments({ isActive: true }),
      Golib.countDocuments()
    ]);

    // Birinchi faol ishtirokchini tekshirish
    const sampleIshtirokchi = await Ishtirokchi.findOne({ isActive: true }).populate({
      path: 'tuman',
      populate: { path: 'viloyat' }
    });

    // Aggregation natijasini tekshirish
    const testAggregation = await Ishtirokchi.aggregate([
      { $match: { isActive: true } },
      { $limit: 1 },
      {
        $lookup: {
          from: 'tumen',
          localField: 'tuman',
          foreignField: '_id',
          as: 'tumanInfo'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        collectionNames,
        counts: {
          ishtirokchilar: { total: totalIshtirokchilar, faol: faolIshtirokchilar },
          tumanlar: { total: totalTumanlar, faol: faolTumanlar },
          viloyatlar: { total: totalViloyatlar, faol: faolViloyatlar },
          goliblar: totalGoliblar
        },
        sampleIshtirokchi: sampleIshtirokchi ? {
          _id: sampleIshtirokchi._id,
          fio: sampleIshtirokchi.fio,
          isActive: sampleIshtirokchi.isActive,
          tumanId: sampleIshtirokchi.tuman?._id,
          tumanNomi: sampleIshtirokchi.tuman?.nomi,
          tumanIsActive: sampleIshtirokchi.tuman?.isActive,
          viloyatId: sampleIshtirokchi.tuman?.viloyat?._id,
          viloyatNomi: sampleIshtirokchi.tuman?.viloyat?.nomi,
          viloyatIsActive: sampleIshtirokchi.tuman?.viloyat?.isActive
        } : null,
        testAggregation: testAggregation[0] || null
      }
    });
  } catch (error) {
    console.error('Debug stats xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
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
  resetAllWinners,
  debugStats
};
