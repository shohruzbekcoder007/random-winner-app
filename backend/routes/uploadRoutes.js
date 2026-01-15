const express = require('express');
const router = express.Router();
const {
  uploadExcel,
  uploadExcelByViloyat,
  downloadTemplate,
  downloadTemplateByViloyat
} = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Barcha routelar himoyalangan va faqat admin uchun
router.use(protect, adminOnly);

// Tuman bo'yicha yuklash
router.post('/excel', upload.single('file'), uploadExcel);
router.get('/template', downloadTemplate);

// Viloyat bo'yicha yuklash (SOATO bilan)
router.post('/excel-by-viloyat', upload.single('file'), uploadExcelByViloyat);
router.get('/template-by-viloyat', downloadTemplateByViloyat);

module.exports = router;
