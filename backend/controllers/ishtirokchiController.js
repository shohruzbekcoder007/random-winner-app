const Ishtirokchi = require('../models/Ishtirokchi');
const Tuman = require('../models/Tuman');

// @desc    Barcha ishtirokchilarni olish
// @route   GET /api/ishtirokchi
// @access  Private
const getIshtirokchilar = async (req, res) => {
  try {
    const { tuman, viloyat, isActive, page = 1, limit = 50 } = req.query;

    let query = {};
    if (tuman) query.tuman = tuman;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    // Viloyat bo'yicha filter
    if (viloyat) {
      const tumanlar = await Tuman.find({ viloyat }).select('_id');
      const tumanIds = tumanlar.map(t => t._id);
      query.tuman = { $in: tumanIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ishtirokchilar = await Ishtirokchi.find(query)
      .populate({
        path: 'tuman',
        select: 'nomi viloyat',
        populate: {
          path: 'viloyat',
          select: 'nomi'
        }
      })
      .sort({ fio: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Ishtirokchi.countDocuments(query);

    res.json({
      success: true,
      count: ishtirokchilar.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: ishtirokchilar
    });
  } catch (error) {
    console.error('Get ishtirokchilar xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Bitta ishtirokchini olish
// @route   GET /api/ishtirokchi/:id
// @access  Private
const getIshtirokchi = async (req, res) => {
  try {
    const ishtirokchi = await Ishtirokchi.findById(req.params.id).populate({
      path: 'tuman',
      select: 'nomi viloyat',
      populate: {
        path: 'viloyat',
        select: 'nomi'
      }
    });

    if (!ishtirokchi) {
      return res.status(404).json({
        success: false,
        message: 'Ishtirokchi topilmadi'
      });
    }

    res.json({
      success: true,
      data: ishtirokchi
    });
  } catch (error) {
    console.error('Get ishtirokchi xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Yangi ishtirokchi qo'shish
// @route   POST /api/ishtirokchi
// @access  Private/Admin
const createIshtirokchi = async (req, res) => {
  try {
    const { fio, tuman, telefon } = req.body;

    // Tuman mavjudligini tekshirish
    const tumanExists = await Tuman.findById(tuman);
    if (!tumanExists) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // Bir xil ishtirokchi mavjudligini tekshirish
    const exists = await Ishtirokchi.findOne({ fio: fio.trim(), tuman });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Bu ishtirokchi allaqachon mavjud'
      });
    }

    const ishtirokchi = await Ishtirokchi.create({
      fio: fio.trim(),
      tuman,
      telefon: telefon?.trim() || ''
    });

    const populatedIshtirokchi = await Ishtirokchi.findById(ishtirokchi._id).populate({
      path: 'tuman',
      select: 'nomi viloyat',
      populate: {
        path: 'viloyat',
        select: 'nomi'
      }
    });

    res.status(201).json({
      success: true,
      data: populatedIshtirokchi
    });
  } catch (error) {
    console.error('Create ishtirokchi xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Ishtirokchini yangilash
// @route   PUT /api/ishtirokchi/:id
// @access  Private/Admin
const updateIshtirokchi = async (req, res) => {
  try {
    const { fio, telefon, isActive } = req.body;

    const ishtirokchi = await Ishtirokchi.findById(req.params.id);

    if (!ishtirokchi) {
      return res.status(404).json({
        success: false,
        message: 'Ishtirokchi topilmadi'
      });
    }

    // Yangilash
    if (fio) ishtirokchi.fio = fio.trim();
    if (telefon !== undefined) ishtirokchi.telefon = telefon.trim();
    if (typeof isActive === 'boolean') ishtirokchi.isActive = isActive;

    await ishtirokchi.save();

    const populatedIshtirokchi = await Ishtirokchi.findById(ishtirokchi._id).populate({
      path: 'tuman',
      select: 'nomi viloyat',
      populate: {
        path: 'viloyat',
        select: 'nomi'
      }
    });

    res.json({
      success: true,
      data: populatedIshtirokchi
    });
  } catch (error) {
    console.error('Update ishtirokchi xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Ishtirokchini o'chirish
// @route   DELETE /api/ishtirokchi/:id
// @access  Private/Admin
const deleteIshtirokchi = async (req, res) => {
  try {
    const ishtirokchi = await Ishtirokchi.findById(req.params.id);

    if (!ishtirokchi) {
      return res.status(404).json({
        success: false,
        message: 'Ishtirokchi topilmadi'
      });
    }

    await ishtirokchi.deleteOne();

    res.json({
      success: true,
      message: 'Ishtirokchi o\'chirildi'
    });
  } catch (error) {
    console.error('Delete ishtirokchi xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Ishtirokchi faolligini o'zgartirish
// @route   PATCH /api/ishtirokchi/:id/toggle-active
// @access  Private/Admin
const toggleActive = async (req, res) => {
  try {
    const ishtirokchi = await Ishtirokchi.findById(req.params.id);

    if (!ishtirokchi) {
      return res.status(404).json({
        success: false,
        message: 'Ishtirokchi topilmadi'
      });
    }

    ishtirokchi.isActive = !ishtirokchi.isActive;
    await ishtirokchi.save();

    const populatedIshtirokchi = await Ishtirokchi.findById(ishtirokchi._id).populate({
      path: 'tuman',
      select: 'nomi viloyat',
      populate: {
        path: 'viloyat',
        select: 'nomi'
      }
    });

    res.json({
      success: true,
      data: populatedIshtirokchi
    });
  } catch (error) {
    console.error('Toggle active xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

module.exports = {
  getIshtirokchilar,
  getIshtirokchi,
  createIshtirokchi,
  updateIshtirokchi,
  deleteIshtirokchi,
  toggleActive
};
