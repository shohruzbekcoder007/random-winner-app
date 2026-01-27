const Golib = require('../models/Golib');
const XLSX = require('xlsx');

// Filter query yasash uchun yordamchi funksiya
const buildFilterQuery = (params) => {
  const { viloyat, tuman, search, startDate, endDate } = params;
  let query = {};

  // Viloyat bo'yicha filter
  if (viloyat) query['viloyat._id'] = viloyat;

  // Tuman bo'yicha filter
  if (tuman) query['tuman._id'] = tuman;

  // FIO bo'yicha qidirish
  if (search) {
    query['ishtirokchi.fio'] = { $regex: search, $options: 'i' };
  }

  // Sana oralig'i bo'yicha filter
  if (startDate || endDate) {
    query.tanlanganSana = {};
    if (startDate) {
      query.tanlanganSana.$gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.tanlanganSana.$lte = end;
    }
  }

  return query;
};

// @desc    Barcha g'oliblarni olish
// @route   GET /api/golib
// @access  Private
const getGoliblar = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = buildFilterQuery(req.query);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Embedded bo'lgani uchun populate kerak emas
    const goliblar = await Golib.find(query)
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
    // Embedded bo'lgani uchun populate kerak emas
    const golib = await Golib.findOne()
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
    // Embedded bo'lgani uchun populate kerak emas
    const golib = await Golib.findById(req.params.id);

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

    // Viloyatlar bo'yicha statistika - embedded data
    const viloyatStats = await Golib.aggregate([
      {
        $group: {
          _id: '$viloyat.nomi',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Tumanlar bo'yicha statistika - embedded data
    const tumanStats = await Golib.aggregate([
      {
        $group: {
          _id: { viloyat: '$viloyat.nomi', tuman: '$tuman.nomi' },
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

// @desc    G'oliblarni XLSX formatda yuklash
// @route   GET /api/golib/export
// @access  Private
const exportGoliblar = async (req, res) => {
  try {
    const query = buildFilterQuery(req.query);

    // Barcha filterga mos goliblarni olish
    const goliblar = await Golib.find(query)
      .sort({ tanlanganSana: -1 });

    // Excel uchun ma'lumotlarni tayyorlash
    const data = goliblar.map((golib, index) => ({
      '№': index + 1,
      'FIO': golib.ishtirokchi?.fio || '',
      'Viloyat': golib.viloyat?.nomi || '',
      'Tuman': golib.tuman?.nomi || '',
      'Manzil': golib.ishtirokchi?.telefon || '',
      'Tanlangan sana': golib.tanlanganSana
        ? new Date(golib.tanlanganSana).toLocaleString('uz-UZ')
        : ''
    }));

    // Workbook yaratish
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Goliblar');

    // Ustun kengliklari
    worksheet['!cols'] = [
      { wch: 5 },   // №
      { wch: 35 },  // FIO
      { wch: 20 },  // Viloyat
      { wch: 25 },  // Tuman
      { wch: 50 },  // Manzil
      { wch: 20 }   // Sana
    ];

    // Buffer yaratish
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Response headers
    const filename = `goliblar_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);
  } catch (error) {
    console.error('Export goliblar xatosi:', error);
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
  getStats,
  exportGoliblar
};
