const jwt = require('jsonwebtoken');

function getJWTSecret() {
    return process.env.JWT_SECRET || require('crypto').randomBytes(32).toString('hex');
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, getJWTSecret());
        req.adminId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide' });
    }
}

module.exports = { authMiddleware, get JWT_SECRET() { return getJWTSecret(); } };
