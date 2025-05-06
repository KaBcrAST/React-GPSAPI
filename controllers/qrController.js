const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

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

const generateLocationQR = async (req, res) => {
  try {
    const { latitude, longitude, name } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude et longitude sont requis' });
    }
    
    // Format d'URL pour Expo Go - pointer vers votre app
    // exp://<IP_ADDRESS:PORT>/--/location?lat=XXX&lon=YYY&name=ZZZ
    // Remplacez avec l'adresse IP et le port de votre serveur Expo
    const expoDevelopmentUrl = `exp://192.168.1.X:19000/--/location?lat=${latitude}&lon=${longitude}&name=${encodeURIComponent(name || 'Destination')}`;
    
    // Générer le QR code
    const qrDataURL = await QRCode.toDataURL(expoDevelopmentUrl);
    const qrImage = qrDataURL.replace(/^data:image\/png;base64,/, '');
    
    // Sauvegarder l'image (optionnel)
    const fileName = `location_${Date.now()}.png`;
    const filePath = path.join(__dirname, '..', 'public', 'qrcodes', fileName);
    
    // Créer le dossier s'il n'existe pas
    const dir = path.join(__dirname, '..', 'public', 'qrcodes');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, qrImage, 'base64');
    
    res.status(200).json({ 
      success: true, 
      qrImageUrl: `/qrcodes/${fileName}`,
      qrDataUrl: qrDataURL
    });
    
  } catch (error) {
    console.error('Erreur lors de la génération du QR code:', error);
    res.status(500).json({ error: 'Erreur lors de la génération du QR code' });
  }
};

module.exports = {
  generateQRCode,
  generateLocationQR
};