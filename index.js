require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('./config/passport');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const gpsRoutes = require('./routes/gpsRoutes');
const { isAuthenticated } = require('./middlewares/middlewares');

const app = express();

// Configurez CORS pour autoriser les requêtes de votre front-end
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()); // Pour parser les requêtes JSON

app.use('/auth', authRoutes);
app.use('/api/gps', gpsRoutes);

app.get('/', (req, res) => {
  res.send('<a href="/auth/google">Authenticate with Google</a>');
});

app.get('/protected', isAuthenticated, (req, res) => {
  res.send('This is a protected route');
});

app.listen(5000, () => console.log('listening on port: 5000'));