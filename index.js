require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gpsRoutes = require('./routes/gpsRoutes');
const { isAuthenticated } = require('./middlewares/middlewares');
const directionsRoutes = require('./routes/directionsRoutes');
const { generateQRCode } = require('./controllers/qrController');
const qrCodeRoutes = require('./routes/qrRoutes');
const mapRoutes = require('./routes/mapRoutes');
const searchRoutes = require('./routes/searchRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const app = express();

// Configurez CORS pour autoriser les requêtes de votre front-end
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()); // Pour parser les requêtes JSON

app.use('/auth', authRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api', directionsRoutes);
app.use('/api', qrCodeRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/search', searchRoutes);
console.log('Map routes registered');

// Swagger documentation route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/protected', isAuthenticated, (req, res) => {
  res.send('This is a protected route');
});

app.listen(5000, () => {
  console.log('Server listening on port: 5000');
  console.log('Available routes:');
  console.log('- GET /api/map/config');
  console.log('- POST /api/map/location');
});