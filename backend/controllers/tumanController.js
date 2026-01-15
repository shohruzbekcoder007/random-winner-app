const Tuman = require('../models/Tuman');
const Viloyat = require('../models/Viloyat');
const Ishtirokchi = require('../models/Ishtirokchi');

// @desc    Barcha tumanlarni olish
// @route   GET /api/tuman
// @access  Private
const getTumanlar = async (req, res) => {
  try {
    const { viloyat, isActive } = req.query;

    let query = {};
    if (viloyat) query.viloyat = viloyat;
    if (typeof isActive !== 'undefined') query.isActive = isActive === 'true';

    const tumanlar = await Tuman.find(query)
      .populate('viloyat', 'nomi soato')
      .sort({ nomi: 1 });

    // Har bir tuman uchun ishtirokchilar sonini hisoblash
    const tumanlarWithCount = await Promise.all(
      tumanlar.map(async (tuman) => {
        const ishtirokchilarSoni = await Ishtirokchi.countDocuments({ tuman: tuman._id });
        const faolIshtirokchilar = await Ishtirokchi.countDocuments({
          tuman: tuman._id,
          isActive: true,
          isWinner: false  // G'olib bo'lmaganlar
        });
        return {
          ...tuman.toObject(),
          ishtirokchilarSoni,
          faolIshtirokchilar
        };
      })
    );

    res.json({
      success: true,
      count: tumanlarWithCount.length,
      data: tumanlarWithCount
    });
  } catch (error) {
    console.error('Get tumanlar xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Bitta tumanni olish
// @route   GET /api/tuman/:id
// @access  Private
const getTuman = async (req, res) => {
  try {
    const tuman = await Tuman.findById(req.params.id).populate('viloyat', 'nomi soato');

    if (!tuman) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // Tumandagi ishtirokchilar
    const ishtirokchilar = await Ishtirokchi.find({ tuman: tuman._id }).sort({ fio: 1 });

    res.json({
      success: true,
      data: {
        ...tuman.toObject(),
        ishtirokchilar
      }
    });
  } catch (error) {
    console.error('Get tuman xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Yangi tuman qo'shish
// @route   POST /api/tuman
// @access  Private/Admin
const createTuman = async (req, res) => {
  try {
    const { nomi, soato, viloyat, isActive } = req.body;

    // Viloyat mavjudligini tekshirish
    const viloyatExists = await Viloyat.findById(viloyat);
    if (!viloyatExists) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // Bir xil tuman mavjudligini tekshirish
    const exists = await Tuman.findOne({ nomi: nomi.trim(), viloyat });
    if (exists) {
      return res.status(400).json({
        success: false,
        message: 'Bu tuman allaqachon mavjud'
      });
    }

    // SOATO mavjudligini tekshirish
    const existsBySoato = await Tuman.findOne({ soato: soato.trim() });
    if (existsBySoato) {
      return res.status(400).json({
        success: false,
        message: 'Bu SOATO kodi allaqachon mavjud'
      });
    }

    const tuman = await Tuman.create({
      nomi: nomi.trim(),
      soato: soato.trim(),
      viloyat,
      isActive: isActive !== false
    });

    const populatedTuman = await Tuman.findById(tuman._id).populate('viloyat', 'nomi soato');

    res.status(201).json({
      success: true,
      data: populatedTuman
    });
  } catch (error) {
    console.error('Create tuman xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Tumanni yangilash
// @route   PUT /api/tuman/:id
// @access  Private/Admin
const updateTuman = async (req, res) => {
  try {
    const { nomi, soato, isActive } = req.body;

    const tuman = await Tuman.findById(req.params.id);

    if (!tuman) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // SOATO takrorlanmasligini tekshirish
    if (soato && soato.trim() !== tuman.soato) {
      const existsBySoato = await Tuman.findOne({ soato: soato.trim() });
      if (existsBySoato) {
        return res.status(400).json({
          success: false,
          message: 'Bu SOATO kodi allaqachon mavjud'
        });
      }
    }

    // Yangilash
    if (nomi) tuman.nomi = nomi.trim();
    if (soato) tuman.soato = soato.trim();
    if (typeof isActive === 'boolean') tuman.isActive = isActive;

    await tuman.save();

    const populatedTuman = await Tuman.findById(tuman._id).populate('viloyat', 'nomi soato');

    res.json({
      success: true,
      data: populatedTuman
    });
  } catch (error) {
    console.error('Update tuman xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Tumanni o'chirish
// @route   DELETE /api/tuman/:id
// @access  Private/Admin
const deleteTuman = async (req, res) => {
  try {
    const tuman = await Tuman.findById(req.params.id);

    if (!tuman) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // Tumanda ishtirokchilar bormi?
    const ishtirokchilarSoni = await Ishtirokchi.countDocuments({ tuman: tuman._id });
    if (ishtirokchilarSoni > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu tumanda ${ishtirokchilarSoni} ta ishtirokchi bor. Avval ishtirokchilarni o'chiring.`
      });
    }

    await tuman.deleteOne();

    res.json({
      success: true,
      message: 'Tuman o\'chirildi'
    });
  } catch (error) {
    console.error('Delete tuman xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Tumanning faolligini o'zgartirish
// @route   PATCH /api/tuman/:id/toggle-active
// @access  Private/Admin
const toggleActive = async (req, res) => {
  try {
    const tuman = await Tuman.findById(req.params.id);

    if (!tuman) {
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    tuman.isActive = !tuman.isActive;
    await tuman.save();

    const populatedTuman = await Tuman.findById(tuman._id).populate('viloyat', 'nomi');

    res.json({
      success: true,
      data: populatedTuman,
      message: tuman.isActive ? 'Tuman faollashtirildi' : 'Tuman o\'chirildi'
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
  getTumanlar,
  getTuman,
  createTuman,
  updateTuman,
  deleteTuman,
  toggleActive
};
