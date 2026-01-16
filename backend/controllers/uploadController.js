const XLSX = require('xlsx');
const fs = require('fs');
const Viloyat = require('../models/Viloyat');
const Tuman = require('../models/Tuman');
const Ishtirokchi = require('../models/Ishtirokchi');

// @desc    Excel fayldan ma'lum tumanga ishtirokchilarni yuklash
// @route   POST /api/upload/excel
// @access  Private/Admin
const uploadExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel fayl yuklanmadi'
      });
    }

    // Tuman ID ni olish (form-data dan)
    const { tumanId } = req.body;

    if (!tumanId) {
      // Faylni o'chirish
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Tuman tanlanishi shart'
      });
    }

    // Tumanni tekshirish
    const tuman = await Tuman.findById(tumanId).populate('viloyat', 'nomi');
    if (!tuman) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Tuman topilmadi'
      });
    }

    // Excel faylni o'qish
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Ma'lumotlarni JSON formatga o'tkazish
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Birinchi qator sarlavha bo'lishi mumkin, tekshiramiz
    let startRow = 0;
    const firstRow = data[0];

    // Sarlavha tekshirish
    if (firstRow && (
      firstRow[0]?.toString().toLowerCase().includes('fio') ||
      firstRow[0]?.toString().toLowerCase().includes('ism') ||
      firstRow[0]?.toString().toLowerCase().includes('familiya') ||
      firstRow[0]?.toString().toLowerCase().includes('name')
    )) {
      startRow = 1;
    }

    const results = {
      total: 0,
      created: 0,
      skipped: 0,
      errors: [],
      tuman: tuman.nomi,
      viloyat: tuman.viloyat.nomi
    };

    // Ma'lumotlarni qayta ishlash
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];

      // Bo'sh qatorlarni o'tkazib yuborish (faqat FIO tekshiriladi)
      if (!row || !row[0]) {
        continue;
      }

      results.total++;

      const fio = row[0]?.toString().trim();
      // Telefon 2-ustunda bo'lishi mumkin
      const telefon = row[1]?.toString().trim() || '';

      // Bo'sh FIO ni o'tkazib yuborish
      if (!fio) {
        continue;
      }

      try {
        // Ishtirokchi mavjudligini tekshirish
        const existingIshtirokchi = await Ishtirokchi.findOne({
          fio: fio,
          tuman: tuman._id
        });

        if (existingIshtirokchi) {
          results.skipped++;
          continue;
        }

        // Yangi ishtirokchi yaratish
        await Ishtirokchi.create({
          fio,
          tuman: tuman._id,
          telefon
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          fio,
          error: error.message
        });
      }
    }

    // Yuklangan faylni o'chirish
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `${results.created} ta ishtirokchi "${tuman.nomi}" tumaniga muvaffaqiyatli yuklandi`,
      data: results
    });
  } catch (error) {
    console.error('Upload Excel xatosi:', error);

    // Xato bo'lsa faylni o'chirish
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Excel faylni qayta ishlashda xato',
      error: error.message
    });
  }
};

// @desc    Viloyat bo'yicha Excel fayldan ishtirokchilarni yuklash (SOATO orqali tuman aniqlanadi)
// @route   POST /api/upload/excel-by-viloyat
// @access  Private/Admin
const uploadExcelByViloyat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Excel fayl yuklanmadi'
      });
    }

    const { viloyatId } = req.body;

    if (!viloyatId) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Viloyat tanlanishi shart'
      });
    }

    // Viloyatni tekshirish
    const viloyat = await Viloyat.findById(viloyatId);
    if (!viloyat) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // Viloyatga tegishli barcha tumanlarni olish (SOATO bilan)
    const tumanlar = await Tuman.find({ viloyat: viloyatId });
    const tumanMap = {};
    tumanlar.forEach(t => {
      tumanMap[t.soato] = t;
    });

    // Excel faylni o'qish
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Ma'lumotlarni JSON formatga o'tkazish
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Sarlavha tekshirish
    let startRow = 0;
    const firstRow = data[0];
    if (firstRow && (
      firstRow[0]?.toString().toLowerCase().includes('soato') ||
      firstRow[0]?.toString().toLowerCase().includes('fio') ||
      firstRow[0]?.toString().toLowerCase().includes('ism')
    )) {
      startRow = 1;
    }

    const results = {
      total: 0,
      created: 0,
      skipped: 0,
      tumanNotFound: 0,
      errors: [],
      viloyat: viloyat.nomi,
      tumanStats: {}
    };

    // Ma'lumotlarni qayta ishlash
    for (let i = startRow; i < data.length; i++) {
      const row = data[i];

      // Bo'sh qatorlarni o'tkazib yuborish
      if (!row || !row[0]) {
        continue;
      }

      results.total++;

      // SOATO 1-ustunda, FIO 2-ustunda, Telefon 3-ustunda
      const soato = row[0]?.toString().trim();
      const fio = row[1]?.toString().trim();
      const telefon = row[2]?.toString().trim() || '';

      // Bo'sh FIO ni o'tkazib yuborish
      if (!fio) {
        results.errors.push({
          row: i + 1,
          soato,
          error: 'FIO kiritilmagan'
        });
        continue;
      }

      // SOATO bo'yicha tumanni topish
      const tuman = tumanMap[soato];
      if (!tuman) {
        results.tumanNotFound++;
        results.errors.push({
          row: i + 1,
          soato,
          fio,
          error: `SOATO "${soato}" bo'yicha tuman topilmadi`
        });
        continue;
      }

      try {
        // Ishtirokchi mavjudligini tekshirish
        const existingIshtirokchi = await Ishtirokchi.findOne({
          fio: fio,
          tuman: tuman._id
        });

        if (existingIshtirokchi) {
          results.skipped++;
          continue;
        }

        // Yangi ishtirokchi yaratish
        await Ishtirokchi.create({
          fio,
          tuman: tuman._id,
          telefon
        });

        results.created++;

        // Tuman statistikasi
        if (!results.tumanStats[tuman.nomi]) {
          results.tumanStats[tuman.nomi] = 0;
        }
        results.tumanStats[tuman.nomi]++;
      } catch (error) {
        results.errors.push({
          row: i + 1,
          soato,
          fio,
          error: error.message
        });
      }
    }

    // Yuklangan faylni o'chirish
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `${results.created} ta ishtirokchi "${viloyat.nomi}" viloyatiga muvaffaqiyatli yuklandi`,
      data: results
    });
  } catch (error) {
    console.error('Upload Excel by Viloyat xatosi:', error);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Excel faylni qayta ishlashda xato',
      error: error.message
    });
  }
};

// @desc    Namuna Excel faylni yuklab olish
// @route   GET /api/upload/template
// @access  Private/Admin
const downloadTemplate = async (req, res) => {
  try {
    // Namuna ma'lumotlar (faqat FIO va Telefon)
    const templateData = [
      ['FIO', 'Telefon'],
      ['Alijon Valiyev', '+998901234567'],
      ['Bobur Karimov', '+998907654321'],
      ['Gulnora Rahimova', ''],
      ['Sardor Toshmatov', '+998933334455']
    ];

    // Excel workbook yaratish
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    // Ustun kengliklarini sozlash
    worksheet['!cols'] = [
      { wch: 30 }, // FIO
      { wch: 18 }  // Telefon
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ishtirokchilar');

    // Faylni buffer ga yozish
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Response headerlarini sozlash
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ishtirokchilar_namuna.xlsx');

    res.send(buffer);
  } catch (error) {
    console.error('Download template xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Namuna faylni yaratishda xato'
    });
  }
};

// @desc    Viloyat bo'yicha namuna Excel faylni yuklab olish (dinamik - haqiqiy SOATO kodlari bilan)
// @route   GET /api/upload/template-by-viloyat?viloyatId=xxx
// @access  Private/Admin
const downloadTemplateByViloyat = async (req, res) => {
  try {
    const { viloyatId } = req.query;

    if (!viloyatId) {
      return res.status(400).json({
        success: false,
        message: 'Viloyat tanlanishi shart'
      });
    }

    // Viloyatni tekshirish
    const viloyat = await Viloyat.findById(viloyatId);
    if (!viloyat) {
      return res.status(404).json({
        success: false,
        message: 'Viloyat topilmadi'
      });
    }

    // Viloyatga tegishli barcha tumanlarni olish
    const tumanlar = await Tuman.find({ viloyat: viloyatId, isActive: true }).sort({ nomi: 1 });

    if (tumanlar.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Bu viloyatda faol tuman topilmadi'
      });
    }

    // Namuna ma'lumotlar yaratish - haqiqiy SOATO kodlari bilan
    const templateData = [
      ['SOATO', 'FIO', 'Telefon']
    ];

    // Har bir tuman uchun 1 tadan namuna qator qo'shish
    const namunalarFio = ['Alijon Valiyev', 'Bobur Karimov', 'Gulnora Rahimova', 'Sardor Toshmatov'];
    const namunalarTelefon = ['+998901234567', '+998907654321', '', '+998933334455'];

    tumanlar.forEach((tuman, index) => {
      const fioIndex = index % namunalarFio.length;
      templateData.push([
        tuman.soato,
        `${namunalarFio[fioIndex]} (${tuman.nomi})`,
        namunalarTelefon[fioIndex]
      ]);
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);

    worksheet['!cols'] = [
      { wch: 12 }, // SOATO
      { wch: 40 }, // FIO
      { wch: 18 }  // Telefon
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ishtirokchilar');

    // Ikkinchi sheet - Tumanlar ro'yxati (SOATO ma'lumotnomasi)
    const tumanlarData = [
      ['SOATO', 'Tuman nomi']
    ];
    tumanlar.forEach(tuman => {
      tumanlarData.push([tuman.soato, tuman.nomi]);
    });

    const tumanlarSheet = XLSX.utils.aoa_to_sheet(tumanlarData);
    tumanlarSheet['!cols'] = [
      { wch: 12 }, // SOATO
      { wch: 30 }  // Tuman nomi
    ];
    XLSX.utils.book_append_sheet(workbook, tumanlarSheet, 'SOATO kodlari');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Fayl nomiga viloyat nomini qo'shish
    const safeViloyatName = viloyat.nomi.replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=ishtirokchilar_${safeViloyatName}_namuna.xlsx`);

    res.send(buffer);
  } catch (error) {
    console.error('Download template by viloyat xatosi:', error);
    res.status(500).json({
      success: false,
      message: 'Namuna faylni yaratishda xato'
    });
  }
};

module.exports = {
  uploadExcel,
  uploadExcelByViloyat,
  downloadTemplate,
  downloadTemplateByViloyat
};
