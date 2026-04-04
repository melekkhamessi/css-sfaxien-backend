const express = require('express');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
        }

        const admin = await Admin.findOne({ username });
        if (!admin || !(await admin.comparePassword(password))) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/auth/setup — Create first admin (only works if no admin exists)
router.post('/setup', async (req, res) => {
    try {
        const count = await Admin.countDocuments();
        if (count > 0) {
            return res.status(403).json({ error: 'Un administrateur existe déjà' });
        }

        const { username, password } = req.body;
        if (!username || !password || password.length < 6) {
            return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe (min 6 caractères) requis' });
        }

        const admin = new Admin({ username, password });
        await admin.save();
        
        const token = jwt.sign({ id: admin._id }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ token, username: admin.username });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/auth/check — Verify current token
router.get('/check', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.json({ authenticated: false });
    }
    try {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, JWT_SECRET);
        res.json({ authenticated: true });
    } catch {
        res.json({ authenticated: false });
    }
});

// PUT /api/auth/change-password
router.put('/change-password', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Non autorisé' });
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        const { password } = req.body;
        if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6)' });
        const admin = await Admin.findById(decoded.id);
        if (!admin) return res.status(404).json({ error: 'Admin non trouvé' });
        admin.password = password;
        await admin.save();
        res.json({ success: true });
    } catch (e) {
        res.status(401).json({ error: 'Non autorisé' });
    }
});

module.exports = router;
