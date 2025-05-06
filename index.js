require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { isAuthenticated } = require('./middlewares/middlewares');
const { generateQRCode } = require('./controllers/qrController');
const qrCodeRoutes = require('./routes/qrRoutes');
const searchRoutes = require('./routes/searchRoutes');
const speedLimitRoutes = require('./routes/speedLimitRoutes');
const navigationRoutes = require('./routes/navigationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const connectDB = require('./config/database');
const trafficRoutes = require('./routes/trafficRoutes');

const app = express();
connectDB();

app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path}`, {
    body: req.body,
    query: req.query,
    params: req.params
  });
  next();
});

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

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', qrCodeRoutes);
app.use('/api/search', searchRoutes);
app.use('/api', speedLimitRoutes);
app.use('/api', navigationRoutes);
app.use('/api', reportRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/navigation', navigationRoutes);

console.log('Map routes registered');

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/protected', isAuthenticated, (req, res) => {
  res.send('This is a protected route');
});

app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code
  });

  switch (err.name) {
    case 'MongoTimeoutError':
      return res.status(504).json({
        error: 'Database timeout',
        details: 'The database operation timed out',
        path: req.path
      });
    
    case 'ValidationError':
      return res.status(400).json({
        error: 'Validation error',
        details: err.message,
        path: req.path
      });
      
    case 'MongoError':
      if (err.code === 11000) {
        return res.status(409).json({
          error: 'Duplicate entry',
          details: 'This record already exists',
          path: req.path
        });
      }
      break;
      
    default:
      if (err.code === 'ETIMEDOUT') {
        return res.status(504).json({
          error: 'Connection timeout',
          details: 'The request timed out',
          path: req.path
        });
      }
  }

  res.status(err.status || 500).json({
    error: 'Server error',
    details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    path: req.path,
    requestId: `req_${Date.now()}`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/map/config');
  console.log('- POST /api/map/location');
});