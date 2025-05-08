const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
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
      console.log('Un administrateur existe déjà dans la base de données');
      process.exit(0);
    }
    
    // Créer un nouvel administrateur
    const hashedPassword = await bcrypt.hash('AdminPassword123', 10);
    
    const adminUser = new User({
      email: 'admin@example.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Administrateur créé avec succès');
    
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur:', error);
  }
  
  process.exit(0);
})
.catch(err => {
  console.error('Erreur de connexion à MongoDB:', err);
  process.exit(1);
});