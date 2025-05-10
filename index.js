require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middlewares/middlewares');
const { generateQRCode } = require('./controllers/qrController');
const qrCodeRoutes = require('./routes/qrRoutes');
const searchRoutes = require('./routes/searchRoutes');
const speedLimitRoutes = require('./routes/speedLimitRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const connectDB = require('./config/database');
const adminRoutes = require('./routes/adminRoutes');  // Nouvelles routes admin
const https = require('https');
const fs = require('fs');
const path = require('path');

const app = express();
connectDB();

// Protection contre les attaques XSS
app.use(xss());

// Protection contre les injections NoSQL
app.use(mongoSanitize());

// Sécurité des en-têtes HTTP
app.use(helmet());

// Limiter les requêtes pour éviter les attaques par force brute
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // limite chaque IP à 100 requêtes par fenêtre
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard' 
  }
});

// Limiter spécifiquement les tentatives d'authentification
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // 5 tentatives d'authentification max par 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer plus tard' 
  }
});

// Appliquer le limiteur aux routes d'authentification
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Appliquer le limiteur général aux autres routes
app.use('/api', generalLimiter);

// Configuration CORS pour permettre les requêtes de toutes les origines
app.use(cors({
  origin: '*', // Accepter toutes les origines
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Sécuriser les sessions
app.use(session({ 
  secret: process.env.SESSION_SECRET,
  resave: false, 
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // Cookies sécurisés en production
    httpOnly: true, // Empêche l'accès JS aux cookies
    sameSite: 'lax' // Protection CSRF
  } 
}));

app.use(passport.initialize());
app.use(passport.session());

// Parser JSON avec validation et sanitization
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
      req.rawBody = buf;
    } catch (e) {
      res.status(400).json({ error: 'Format JSON invalide' });
      throw new Error('Format JSON invalide');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Journalisation des requêtes avec masquage des données sensibles
app.use((req, res, next) => {
  // Fonction pour masquer les données sensibles
  const maskSensitiveData = (obj) => {
    if (!obj) return obj;
    const masked = { ...obj };
    
    // Masquer les champs sensibles
    if (masked.password) masked.password = '******';
    if (masked.token) masked.token = '******';
    if (masked.apiKey) masked.apiKey = '******';
    
    return masked;
  };
  
  console.log(`📝 ${req.method} ${req.path}`, {
    body: maskSensitiveData(req.body),
    query: maskSensitiveData(req.query),
    params: req.params
  });
  next();
});

// Middleware de timeout
app.use((req, res, next) => {
  const timeout = parseInt(process.env.FUNCTION_TIMEOUT) || 30000; 
  
  const timeoutHandler = setTimeout(() => {
    console.error(`⏰ Request timeout for ${req.method} ${req.path}`);
    res.status(408).json({ 
      error: 'Request timeout',
      path: req.path,
      method: req.method
    });
  }, timeout);

  res.on('finish', () => clearTimeout(timeoutHandler));
  res.on('close', () => clearTimeout(timeoutHandler));
  
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', qrCodeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', speedLimitRoutes);
app.use('/api', navigationRoutes);
app.use('/api', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/navigation', navigationRoutes);
console.log('Map routes registered');

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/protected', isAuthenticated, (req, res) => {
  res.send('This is a protected route');
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code
  });

  // Gestion spécifique par type d'erreur
  switch (err.name) {
    case 'MongoError':
    case 'MongoServerError':
      if (err.code === 11000) {
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'Cette entrée existe déjà'
        });
      }
      break;

    case 'ValidationError':
      return res.status(400).json({
        error: 'Validation error', 
        message: err.message
      });
      
    case 'CastError':
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'Format de données invalide'
      });
  }

  // Erreur par défaut
  res.status(err.status || 500).json({
    error: 'Server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur serveur interne'
  });
});

const PORT = process.env.PORT || 5000;

// Tenter de démarrer en HTTPS si les certificats existent
try {
  const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certificates', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certificates', 'cert.pem'))
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`🔒 Serveur HTTPS démarré sur le port ${PORT}`);
    console.log(`📝 Environnement: ${process.env.NODE_ENV}`);
  });
} catch (err) {
  console.log('Certificats SSL non trouvés, démarrage en mode HTTP');
  app.listen(PORT, () => {
    console.log(`🚀 Serveur HTTP démarré sur le port ${PORT}`);
    console.log(`📝 Environnement: ${process.env.NODE_ENV}`);
  });
}