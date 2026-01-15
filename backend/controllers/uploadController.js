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

module.exports = {
  uploadExcel,
  downloadTemplate
};
