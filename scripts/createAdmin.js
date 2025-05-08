const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

// Connecter à la base de données
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');

  try {
    // Vérifier si un admin existe déjà
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (adminExists) {
      console.log('Un administrateur existe déjà dans la base de données:');
      console.log(`- Email: ${adminExists.email}`);
      console.log(`- Nom: ${adminExists.name}`);
      process.exit(0);
    }
    
    // Définir les identifiants de l'administrateur
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gpsapp.com';
    const adminName = process.env.ADMIN_NAME || 'Administrateur';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    // Vérifier si le mot de passe doit être hashé avec bcrypt ou utilisé tel quel (pour SHA-256)
    let password;
    
    if (process.env.USE_BCRYPT === 'true') {
      // Utiliser bcrypt pour hacher le mot de passe
      password = await bcrypt.hash(adminPassword, 10);
      console.log('Mot de passe hashé avec bcrypt');
    } else {
      // Utiliser le mot de passe tel quel (supposé déjà en SHA-256)
      password = adminPassword;
      console.log('Mot de passe utilisé tel quel (pour SHA-256)');
    }
    
    // Créer l'administrateur
    const adminUser = new User({
      email: adminEmail,
      name: adminName,
      password: password,
      role: 'admin',
      lastLogin: new Date()
    });
    
    await adminUser.save();
    console.log('Administrateur créé avec succès:');
    console.log(`- Email: ${adminEmail}`);
    console.log(`- Nom: ${adminName}`);
    console.log(`- Mot de passe: ${adminPassword} (À changer après la première connexion)`);
  } catch (error) {
    console.error('Erreur lors de la création de l administrateur:', error);
  }
  
  process.exit(0);
})
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
});