const QRCode = require('qrcode');

const generateQRCode = async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const qrCodeDataURL = await QRCode.toDataURL(url);
    res.json({ qrCodeDataURL });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
};

module.exports = { generateQRCode };