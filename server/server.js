require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const userRoutes = require('./routes/user');
const playerRoutes = require('./routes/player');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cssfaxien';

// Generate & persist JWT secret if not set
if (!process.env.JWT_SECRET) {
    const fs = require('fs');
    const envPath = path.join(__dirname, '..', '.env');
    let secret;
    try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/JWT_SECRET=(.+)/);
        if (match) secret = match[1].trim();
    } catch(e) {}
    if (!secret) {
        secret = crypto.randomBytes(64).toString('hex');
        try { fs.appendFileSync(envPath, `\nJWT_SECRET=${secret}\n`); } catch(e) {}
    }
    process.env.JWT_SECRET = secret;
}

// Security: Helmet HTTP headers
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false
}));

// Security: Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // max 1000 requests per IP per window
    message: { error: 'Trop de requêtes, réessayez dans 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // stricter for auth routes
    message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Apply rate limiting
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..')));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/user', userRoutes);
app.use('/api/player', playerRoutes);

// Fallback: serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connecté avec succès');
        app.listen(PORT, () => {
            console.log(`Serveur démarré sur http://localhost:${PORT}`);
            console.log(`Sécurité: Helmet ✓ | Rate Limiting ✓ | JWT Secret ✓`);
        });
    })
    .catch(err => {
        console.error('Erreur de connexion MongoDB:', err.message);
        process.exit(1);
    });
