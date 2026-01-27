const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');

// @desc    Barcha viloyatlarni olish
// @route   GET /api/viloyat
// @access  Private
const getViloyatlar = async (req, res) => {
  try {
    const viloyatlar = await Viloyat.find().sort({ nomi: 1 });

    // Har bir viloyat uchun tumanlar sonini hisoblash
    const viloyatlarWithCount = await Promise.all(
      viloyatlar.map(async (viloyat) => {
        const tumanlarSoni = await Tuman.countDocuments({ viloyat: viloyat._id });
        const faolTumanlarSoni = await Tuman.countDocuments({ viloyat: viloyat._id, isActive: true });
        return {
          ...viloyat.toObject(),
          tumanlarSoni,
          faolTumanlarSoni
        };
      })
    );

    res.json({
      success: true,
      count: viloyatlarWithCount.length,
      data: viloyatlarWithCount
    });
  } catch (error) {
    console.error('Get viloyatlar xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Bitta viloyatni olish
// @route   GET /api/viloyat/:id
// @access  Private
const getViloyat = async (req, res) => {
  try {
    const viloyat = await Viloyat.findById(req.params.id);

    if (!viloyat) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // Viloyatga tegishli tumanlar
    const tumanlar = await Tuman.find({ viloyat: viloyat._id }).sort({ nomi: 1 });

    res.json({
      success: true,
      data: {
        ...viloyat.toObject(),
        tumanlar
      }
    });
  } catch (error) {
    console.error('Get viloyat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Yangi viloyat qo'shish
// @route   POST /api/viloyat
// @access  Private/Admin
const createViloyat = async (req, res) => {
  try {
    const { nomi, soato } = req.body;

    // Nomi mavjudligini tekshirish
    const existsByNomi = await Viloyat.findOne({ nomi: nomi.trim() });
    if (existsByNomi) {
      return res.status(400).json({
        success: false,
        message: 'Bu viloyat nomi allaqachon mavjud'
      });
    }

    // SOATO mavjudligini tekshirish
    const existsBySoato = await Viloyat.findOne({ soato: soato.trim() });
    if (existsBySoato) {
      return res.status(400).json({
        success: false,
        message: 'Bu SOATO kodi allaqachon mavjud'
      });
    }

    const viloyat = await Viloyat.create({
      nomi: nomi.trim(),
      soato: soato.trim()
    });

    res.status(201).json({
      success: true,
      data: viloyat
    });
  } catch (error) {
    console.error('Create viloyat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi',
      error: error.message
    });
  }
};

// @desc    Viloyatni yangilash
// @route   PUT /api/viloyat/:id
// @access  Private/Admin
const updateViloyat = async (req, res) => {
  try {
    const { nomi, soato, isActive } = req.body;

    const viloyat = await Viloyat.findById(req.params.id);

    if (!viloyat) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // SOATO takrorlanmasligini tekshirish
    if (soato && soato.trim() !== viloyat.soato) {
      const existsBySoato = await Viloyat.findOne({ soato: soato.trim() });
      if (existsBySoato) {
        return res.status(400).json({
          success: false,
          message: 'Bu SOATO kodi allaqachon mavjud'
        });
      }
    }

    // Yangilash
    if (nomi) viloyat.nomi = nomi.trim();
    if (soato) viloyat.soato = soato.trim();
    if (typeof isActive === 'boolean') viloyat.isActive = isActive;

    await viloyat.save();

    res.json({
      success: true,
      data: viloyat
    });
  } catch (error) {
    console.error('Update viloyat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Viloyatning faolligini o'zgartirish
// @route   PATCH /api/viloyat/:id/toggle-active
// @access  Private
const toggleActive = async (req, res) => {
  try {
    const viloyat = await Viloyat.findById(req.params.id);

    if (!viloyat) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    viloyat.isActive = !viloyat.isActive;
    await viloyat.save();

    // Viloyat bilan birga barcha tumanlarni ham faol/nofaol qilish
    const result = await Tuman.updateMany(
      { viloyat: viloyat._id },
      { isActive: viloyat.isActive }
    );
    const tumanlarUpdated = result.modifiedCount;

    res.json({
      success: true,
      data: viloyat,
      message: viloyat.isActive
        ? `Viloyat va uning ${tumanlarUpdated} ta tumani faollashtirildi`
        : `Viloyat va uning ${tumanlarUpdated} ta tumani nofaol qilindi`
    });
  } catch (error) {
    console.error('Toggle active xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

// @desc    Viloyatni o'chirish
// @route   DELETE /api/viloyat/:id
// @access  Private/Admin
const deleteViloyat = async (req, res) => {
  try {
    const viloyat = await Viloyat.findById(req.params.id);

    if (!viloyat) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // Viloyatga tegishli tumanlar bormi?
    const tumanlarSoni = await Tuman.countDocuments({ viloyat: viloyat._id });
    if (tumanlarSoni > 0) {
      return res.status(400).json({
        success: false,
        message: `Bu viloyatga ${tumanlarSoni} ta tuman tegishli. Avval tumanlarni o'chiring.`
      });
    }

    await viloyat.deleteOne();

    res.json({
      success: true,
      message: 'Viloyat o\'chirildi'
    });
  } catch (error) {
    console.error('Delete viloyat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Server xatosi'
    });
  }
};

module.exports = {
  getViloyatlar,
  getViloyat,
  createViloyat,
  updateViloyat,
  deleteViloyat,
  toggleActive
};
