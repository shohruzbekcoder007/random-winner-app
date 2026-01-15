const express = require('express');
const router = express.Router();
const { uploadExcel, downloadTemplate } = require('../controllers/uploadController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Barcha routelar himoyalangan va faqat admin uchun
router.use(protect, adminOnly);

router.post('/excel', upload.single('file'), uploadExcel);
router.get('/template', downloadTemplate);

module.exports = router;
