const express = require('express');
const { generateQRCode } = require('../controllers/qrController');
const router = express.Router();

router.post('/generate-qrcode', generateQRCode);

module.exports = router;