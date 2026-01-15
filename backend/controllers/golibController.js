const Golib = require('../models/Golib');

// @desc    Barcha g'oliblarni olish
// @route   GET /api/golib
// @access  Private
const getGoliblar = async (req, res) => {
  try {
    const { page = 1, limit = 20, viloyat, tuman } = req.query;

    let query = {};
    if (viloyat) query.viloyat = viloyat;
    if (tuman) query.tuman = tuman;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const goliblar = await Golib.find(query)
      .populate('viloyat', 'nomi')
      .populate('tuman', 'nomi')
      .populate('ishtirokchi', 'fio telefon')
      .sort({ tanlanganSana: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Golib.countDocuments(query);

    res.json({
      success: true,
      count: goliblar.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: goliblar
    });
  } catch (error) {
    console.error('Get goliblar xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Oxirgi g'olibni olish
// @route   GET /api/golib/latest
// @access  Private
const getLatestGolib = async (req, res) => {
  try {
    const golib = await Golib.findOne()
      .populate('viloyat', 'nomi')
      .populate('tuman', 'nomi')
      .populate('ishtirokchi', 'fio telefon')
      .sort({ tanlanganSana: -1 });

    if (!golib) {
      return res.json({
        success: true,
        data: null,
        message: 'Hali g\'olib tanlanmagan'
      });
    }

    res.json({
      success: true,
      data: golib
    });
  } catch (error) {
    console.error('Get latest golib xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Bitta g'olibni olish
// @route   GET /api/golib/:id
// @access  Private
const getGolib = async (req, res) => {
  try {
    const golib = await Golib.findById(req.params.id)
      .populate('viloyat', 'nomi')
      .populate('tuman', 'nomi')
      .populate('ishtirokchi', 'fio telefon');

    if (!golib) {
      return res.status(404).json({
        success: false,
        message: 'G\'olib topilmadi'
      });
    }

    res.json({
      success: true,
      data: golib
    });
  } catch (error) {
    console.error('Get golib xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    G'olibni o'chirish
// @route   DELETE /api/golib/:id
// @access  Private/Admin
const deleteGolib = async (req, res) => {
  try {
    const golib = await Golib.findById(req.params.id);

    if (!golib) {
      return res.status(404).json({
        success: false,
        message: 'G\'olib topilmadi'
      });
    }

    await golib.deleteOne();

    res.json({
      success: true,
      message: 'G\'olib yozuvi o\'chirildi'
    });
  } catch (error) {
    console.error('Delete golib xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    G'oliblar statistikasi
// @route   GET /api/golib/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const totalGoliblar = await Golib.countDocuments();

    // Viloyatlar bo'yicha statistika
    const viloyatStats = await Golib.aggregate([
      {
        $group: {
          _id: '$viloyatNomi',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Tumanlar bo'yicha statistika
    const tumanStats = await Golib.aggregate([
      {
        $group: {
          _id: { viloyat: '$viloyatNomi', tuman: '$tumanNomi' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Kunlik statistika (oxirgi 7 kun)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const dailyStats = await Golib.aggregate([
      {
        $match: { tanlanganSana: { $gte: weekAgo } }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$tanlanganSana' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalGoliblar,
        viloyatStats,
        tumanStats,
        dailyStats
      }
    });
  } catch (error) {
    console.error('Get stats xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

module.exports = {
  getGoliblar,
  getLatestGolib,
  getGolib,
  deleteGolib,
  getStats
};
