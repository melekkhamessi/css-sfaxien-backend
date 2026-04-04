const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Order = require('../models/Order');
const PromoCode = require('../models/PromoCode');
const Notification = require('../models/Notification');
const SocialMember = require('../models/SocialMember');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ── User Auth Middleware ──
function userAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Connexion requise' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.userId) return res.status(401).json({ error: 'Token invalide' });
        req.userId = decoded.userId;
        next();
    } catch {
        return res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
    }
}

// ══════════════════════════════════════════════
// AUTH ENDPOINTS
// ══════════════════════════════════════════════

// POST /api/user/register
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Adresse email invalide' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ error: 'Un compte existe déjà avec cet email' });
        }

        const user = new User({ firstName, lastName, email, password, phone: phone || '' });
        await user.save();

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, membership: user.membership, loyaltyPoints: user.loyaltyPoints, avatar: user.avatar }
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// POST /api/user/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }
        if (!user.password && user.provider !== 'local') {
            return res.status(401).json({ error: `Ce compte utilise la connexion ${user.provider === 'google' ? 'Google' : 'Facebook'}. Utilisez le bouton correspondant.` });
        }
        if (!(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, address: user.address, city: user.city, membership: user.membership, loyaltyPoints: user.loyaltyPoints, avatar: user.avatar }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ══════════════════════════════════════════════
// OAUTH: Google & Facebook
// ══════════════════════════════════════════════

const https = require('https');
function httpsGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        }).on('error', reject);
    });
}

function buildUserResponse(user) {
    return {
        id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email,
        phone: user.phone, address: user.address, city: user.city,
        membership: user.membership, loyaltyPoints: user.loyaltyPoints, avatar: user.avatar,
        provider: user.provider
    };
}

// POST /api/user/auth/google — Google Sign-In with credential (ID token or access token)
router.post('/auth/google', async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) return res.status(400).json({ error: 'Token Google manquant' });

        // Verify the Google token
        let gData;
        try {
            // Try as ID token first (from renderButton)
            gData = await httpsGet(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        } catch (e) {
            // Fallback to access token
            gData = await httpsGet(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${encodeURIComponent(credential)}`);
        }

        if (gData.error || !gData.email) {
            return res.status(401).json({ error: 'Token Google invalide' });
        }

        const email = gData.email.toLowerCase();
        const firstName = gData.given_name || gData.name?.split(' ')[0] || 'Utilisateur';
        const lastName = gData.family_name || gData.name?.split(' ').slice(1).join(' ') || '';
        const avatar = gData.picture || '';
        const googleId = gData.sub;

        // Find existing user by email or Google ID
        let user = await User.findOne({ $or: [{ email }, { provider: 'google', providerId: googleId }] });

        if (user) {
            // Update avatar from Google if empty
            if (!user.avatar && avatar) { user.avatar = avatar; await user.save(); }
            // Link Google if user existed via local signup
            if (user.provider === 'local' && !user.providerId) {
                user.provider = 'google'; user.providerId = googleId;
                if (!user.avatar && avatar) user.avatar = avatar;
                await user.save();
            }
        } else {
            // Create new user from Google data
            user = new User({
                firstName, lastName, email, password: '',
                avatar, provider: 'google', providerId: googleId
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: buildUserResponse(user), isNew: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 5000 });
    } catch (err) {
        console.error('Google auth error:', err);
        res.status(500).json({ error: 'Erreur d\'authentification Google' });
    }
});

// POST /api/user/auth/facebook — Facebook Login with access token
router.post('/auth/facebook', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ error: 'Token Facebook manquant' });

        // Verify the Facebook token and get user data
        const fbData = await httpsGet(`https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`);

        if (fbData.error || !fbData.id) {
            return res.status(401).json({ error: 'Token Facebook invalide' });
        }

        const fbId = fbData.id;
        const firstName = fbData.first_name || 'Utilisateur';
        const lastName = fbData.last_name || '';
        const email = (fbData.email || `fb_${fbId}@facebook.com`).toLowerCase();
        const avatar = fbData.picture?.data?.url || '';

        // Find existing user by email or Facebook ID
        let user = await User.findOne({ $or: [{ email }, { provider: 'facebook', providerId: fbId }] });

        if (user) {
            if (!user.avatar && avatar) { user.avatar = avatar; await user.save(); }
            if (user.provider === 'local' && !user.providerId) {
                user.provider = 'facebook'; user.providerId = fbId;
                if (!user.avatar && avatar) user.avatar = avatar;
                await user.save();
            }
        } else {
            user = new User({
                firstName, lastName, email, password: '',
                avatar, provider: 'facebook', providerId: fbId
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: buildUserResponse(user), isNew: !user.createdAt || (Date.now() - user.createdAt.getTime()) < 5000 });
    } catch (err) {
        console.error('Facebook auth error:', err);
        res.status(500).json({ error: 'Erreur d\'authentification Facebook' });
    }
});

// GET /api/user/auth/facebook/redirect — Start Facebook OAuth redirect flow
router.get('/auth/facebook/redirect', (req, res) => {
    const appId = process.env.FACEBOOK_APP_ID;
    if (!appId) return res.status(500).json({ error: 'FACEBOOK_APP_ID non configuré' });
    const redirectUri = `${req.protocol}://${req.get('host')}/api/user/auth/facebook/callback`;
    const state = require('crypto').randomBytes(16).toString('hex');
    const fbUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=public_profile,email&state=${state}`;
    res.redirect(fbUrl);
});

// GET /api/user/auth/facebook/callback — Facebook OAuth callback
router.get('/auth/facebook/callback', async (req, res) => {
    try {
        const { code, error: fbError } = req.query;
        if (fbError || !code) {
            return res.redirect('/?fb_error=cancelled');
        }

        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        const redirectUri = `${req.protocol}://${req.get('host')}/api/user/auth/facebook/callback`;

        // Exchange code for access token
        const tokenData = await httpsGet(`https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`);

        if (tokenData.error || !tokenData.access_token) {
            console.error('FB token exchange error:', tokenData.error);
            return res.redirect('/?fb_error=token');
        }

        // Get user data
        const fbData = await httpsGet(`https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture.type(large)&access_token=${encodeURIComponent(tokenData.access_token)}`);

        if (fbData.error || !fbData.id) {
            return res.redirect('/?fb_error=userdata');
        }

        const fbId = fbData.id;
        const firstName = fbData.first_name || 'Utilisateur';
        const lastName = fbData.last_name || '';
        const email = (fbData.email || `fb_${fbId}@facebook.com`).toLowerCase();
        const avatar = fbData.picture?.data?.url || '';

        let user = await User.findOne({ $or: [{ email }, { provider: 'facebook', providerId: fbId }] });
        let isNew = false;

        if (user) {
            if (!user.avatar && avatar) { user.avatar = avatar; await user.save(); }
            if (user.provider === 'local' && !user.providerId) {
                user.provider = 'facebook'; user.providerId = fbId;
                if (!user.avatar && avatar) user.avatar = avatar;
                await user.save();
            }
        } else {
            user = new User({
                firstName, lastName, email, password: '',
                avatar, provider: 'facebook', providerId: fbId
            });
            await user.save();
            isNew = true;
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });

        // Redirect back to the site with token in URL fragment (never sent to server)
        res.redirect(`/?fb_token=${token}&fb_new=${isNew ? '1' : '0'}`);
    } catch (err) {
        console.error('Facebook callback error:', err);
        res.redirect('/?fb_error=server');
    }
});

// GET /api/user/me — Get current user profile
router.get('/me', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/user/me — Update profile
router.put('/me', userAuth, async (req, res) => {
    try {
        const allowed = ['firstName', 'lastName', 'phone', 'address', 'city', 'avatar'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// PUT /api/user/password — Change password
router.put('/password', userAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Mots de passe requis' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' });
        }

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const valid = await user.comparePassword(currentPassword);
        if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

        user.password = newPassword;
        await user.save();
        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ══════════════════════════════════════════════
// ORDER ENDPOINTS
// ══════════════════════════════════════════════

// POST /api/user/orders — Create a new order
router.post('/orders', userAuth, async (req, res) => {
    try {
        const { items, promoCode, paymentMethod, shipping } = req.body;
        if (!items || !items.length) {
            return res.status(400).json({ error: 'La commande doit contenir au moins un article' });
        }

        let subtotal = 0;
        const orderItems = items.map(item => {
            const lineTotal = (item.unitPrice || 0) * (item.quantity || 1);
            subtotal += lineTotal;
            return {
                type: item.type,
                productId: item.productId || undefined,
                label: item.label,
                details: item.details || '',
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                image: item.image || '',
                size: item.size || '',
                customization: item.customization || {}
            };
        });

        let discount = 0;
        let promoUsed = '';
        if (promoCode) {
            const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
            if (promo && promo.isValid()) {
                if (subtotal >= promo.minOrder) {
                    if (promo.type === 'percent') {
                        discount = Math.round(subtotal * promo.discount / 100);
                    } else {
                        discount = Math.min(promo.discount, subtotal);
                    }
                    promo.usedCount += 1;
                    await promo.save();
                    promoUsed = promo.code;
                }
            }
        }

        const shippingCost = shipping ? 7 : 0;
        const total = Math.max(0, subtotal - discount + shippingCost);

        const order = new Order({
            user: req.userId,
            items: orderItems,
            subtotal,
            discount,
            promoCode: promoUsed,
            shipping: shipping || undefined,
            shippingCost,
            total,
            paymentMethod: paymentMethod || 'card'
        });
        await order.save();

        // Add loyalty points (1 point per 10 TND spent)
        const pointsEarned = Math.floor(total / 10);
        if (pointsEarned > 0) {
            await User.findByIdAndUpdate(req.userId, { $inc: { loyaltyPoints: pointsEarned } });
        }

        // Create admin notification
        try {
            const user = await User.findById(req.userId).select('firstName lastName email');
            const userName = user ? `${user.firstName} ${user.lastName}` : 'Membre';
            const userEmail = user ? user.email : '';
            const mainType = orderItems[0]?.type || 'product';
            const typeLabel = mainType === 'ticket' ? 'billet' : mainType === 'donation' ? 'don' : mainType === 'subscription' ? 'abonnement' : 'achat boutique';
            await new Notification({
                type: mainType === 'product' ? 'order' : mainType,
                title: `Nouvelle commande (${typeLabel})`,
                message: `${userName} a passé une commande de ${total} TND`,
                details: { items: orderItems.map(i => i.label), shipping },
                reference: order.reference,
                amount: total,
                userName,
                userEmail
            }).save();
        } catch (notifErr) {
            console.error('Notification creation error:', notifErr);
        }

        res.status(201).json({ order, pointsEarned });
    } catch (err) {
        console.error('Order error:', err);
        res.status(500).json({ error: 'Erreur lors de la création de la commande' });
    }
});

// GET /api/user/orders — Get user's orders
router.get('/orders', userAuth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/user/orders/:id — Get single order
router.get('/orders/:id', userAuth, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.userId });
        if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
        res.json(order);
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ══════════════════════════════════════════════
// PROMO CODE ENDPOINTS
// ══════════════════════════════════════════════

// POST /api/user/promo/validate — Validate a promo code
router.post('/promo/validate', userAuth, async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        if (!code) return res.status(400).json({ error: 'Code promo requis' });

        const promo = await PromoCode.findOne({ code: code.toUpperCase() });
        if (!promo) return res.status(404).json({ valid: false, error: 'Code promo invalide' });
        if (!promo.isValid()) return res.status(400).json({ valid: false, error: 'Code promo expiré ou épuisé' });
        if (orderTotal && orderTotal < promo.minOrder) {
            return res.status(400).json({ valid: false, error: `Commande minimum : ${promo.minOrder} TND` });
        }

        let discountAmount = 0;
        if (promo.type === 'percent') {
            discountAmount = orderTotal ? Math.round(orderTotal * promo.discount / 100) : promo.discount;
        } else {
            discountAmount = promo.discount;
        }

        res.json({
            valid: true,
            code: promo.code,
            discount: promo.discount,
            type: promo.type,
            discountAmount,
            appliesTo: promo.appliesTo
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// ══════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════

// GET /api/user/dashboard — Get dashboard overview
router.get('/dashboard', userAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'Utilisateur non trouvé' });

        const orders = await Order.find({ user: req.userId }).sort({ createdAt: -1 });

        const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
        const totalOrders = orders.length;
        const totalTickets = orders.reduce((sum, o) => sum + o.items.filter(i => i.type === 'ticket').reduce((s, i) => s + i.quantity, 0), 0);
        const totalDonations = orders.reduce((sum, o) => sum + o.items.filter(i => i.type === 'donation').reduce((s, i) => s + i.unitPrice * i.quantity, 0), 0);
        const recentOrders = orders.slice(0, 5);

        // Determine membership tier
        let membership = 'standard';
        if (totalSpent >= 2000) membership = 'platinum';
        else if (totalSpent >= 1000) membership = 'gold';
        else if (totalSpent >= 400) membership = 'silver';

        if (user.membership !== membership) {
            user.membership = membership;
            await user.save();
        }

        // Check social member status by email
        let socialMember = null;
        if (user.email) {
            const sm = await SocialMember.findOne({ email: user.email.toLowerCase() });
            if (sm) {
                socialMember = {
                    memberNumber: sm.memberNumber,
                    firstName: sm.firstName,
                    lastName: sm.lastName,
                    plan: sm.plan,
                    season: sm.season,
                    status: sm.status,
                    cin: sm.cin
                };
            }
        }

        res.json({
            user,
            stats: { totalSpent, totalOrders, totalTickets, totalDonations },
            recentOrders,
            membership,
            socialMember
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
