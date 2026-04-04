const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
['images', 'videos'].forEach(sub => {
    const dir = path.join(uploadsDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Allowed file types
const imageTypes = /jpeg|jpg|png|gif|webp|svg/;
const videoTypes = /mp4|webm|ogg|mov|avi/;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const sub = videoTypes.test(ext) ? 'videos' : 'images';
        cb(null, path.join(uploadsDir, sub));
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, uniqueName + ext);
    }
});

function fileFilter(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (imageTypes.test(ext) || videoTypes.test(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé'), false);
    }
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Upload single file
router.post('/single', authMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier envoyé' });
    const ext = path.extname(req.file.originalname).toLowerCase().slice(1);
    const sub = videoTypes.test(ext) ? 'videos' : 'images';
    res.json({ url: `/uploads/${sub}/${req.file.filename}`, filename: req.file.filename });
});

// Upload multiple files
router.post('/multiple', authMiddleware, upload.array('files', 20), (req, res) => {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Aucun fichier envoyé' });
    const urls = req.files.map(f => {
        const ext = path.extname(f.originalname).toLowerCase().slice(1);
        const sub = videoTypes.test(ext) ? 'videos' : 'images';
        return { url: `/uploads/${sub}/${f.filename}`, filename: f.filename };
    });
    res.json(urls);
});

module.exports = router;
